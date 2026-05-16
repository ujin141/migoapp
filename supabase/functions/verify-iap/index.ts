import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { google } from "npm:googleapis@133.0.0"; // Use googleapis for Deno

// CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// IAP Products Info
const SUBSCRIPTIONS = {
  "com.lunaticsgroup.migo.sub.plus.m1": { plan: "plus", boosts: 1, super_likes: 5, krw: 14900 },
  "com.lunaticsgroup.migo.sub.plus.q1": { plan: "plus", boosts: 1, super_likes: 5, krw: 34900 },
  "com.lunaticsgroup.migo.sub.plus.y1": { plan: "plus", boosts: 1, super_likes: 5, krw: 99900 },
  "com.lunaticsgroup.migo.sub.premium.": { plan: "premium", boosts: 5, super_likes: 9999, krw: 99900 },
};

const CONSUMABLES = {
  "com.lunaticsgroup.migo.superlike3": { type: "superlike", amount: 3 },
  "com.lunaticsgroup.migo.superlike10": { type: "superlike", amount: 10 },
  "com.lunaticsgroup.migo.superlike30": { type: "superlike", amount: 30 },
  "com.lunaticsgroup.migo.boost1": { type: "boost", amount: 1 },
  "com.lunaticsgroup.migo.boost5": { type: "boost", amount: 5 },
  "com.lunaticsgroup.migo.boost15": { type: "boost", amount: 15 },
  "com.lunaticsgroup.migo.travel_pack": { type: "pack", superlike: 10, boost: 1 },
  "com.lunaticsgroup.migo.verifiedbadge": { type: "badge" },
  "com.lunaticsgroup.migo.item.profiletheme": { type: "theme" },
  "com.lunaticsgroup.migo.nearby_unlock": { type: "nearby" },
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Invalid JWT token");

    const body = await req.json();
    const { platform, productId, purchaseToken, isSubscription = false } = body;

    if (!platform || !productId || !purchaseToken) {
      throw new Error("Missing required parameters: platform, productId, purchaseToken");
    }

    // --- 1. Verify with Google/Apple Servers ---
    let isValidPurchase = false;

    if (platform === "android") {
      const packageName = "com.migo.app";
      // Google Play verification
      const base64Credentials = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64");
      if (!base64Credentials) {
        console.warn("GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64 is not set. Simulating success for testing.");
        isValidPurchase = true; // For testing if not configured
      } else {
        const credentials = JSON.parse(atob(base64Credentials));
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ["https://www.googleapis.com/auth/androidpublisher"],
        });
        const androidpublisher = google.androidpublisher({ version: "v3", auth });

        if (isSubscription) {
          const res = await androidpublisher.purchases.subscriptions.get({
            packageName,
            subscriptionId: productId,
            token: purchaseToken,
          });
          isValidPurchase = res.data && res.data.paymentState !== undefined;
        } else {
          const res = await androidpublisher.purchases.products.get({
            packageName,
            productId,
            token: purchaseToken,
          });
          // purchaseState 0 = PURCHASED
          isValidPurchase = res.data && res.data.purchaseState === 0;
        }
      }
    } else if (platform === "ios") {
      // Apple Store verification
      const appStoreSecret = Deno.env.get("APPLE_SHARED_SECRET");
      if (!appStoreSecret) {
        console.warn("APPLE_SHARED_SECRET is not set. Simulating success for testing.");
        isValidPurchase = true; // For testing if not configured
      } else {
        const verifyUrl = Deno.env.get("ENVIRONMENT") === "production" 
            ? "https://buy.itunes.apple.com/verifyReceipt" 
            : "https://sandbox.itunes.apple.com/verifyReceipt";
            
        const response = await fetch(verifyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "receipt-data": purchaseToken,
            "password": appStoreSecret,
            "exclude-old-transactions": true
          }),
        });
        const data = await response.json();
        isValidPurchase = data.status === 0;
      }
    }

    if (!isValidPurchase) {
      throw new Error("Purchase verification failed");
    }

    // --- 2. Update Database ---
    const userId = user.id;

    if (isSubscription && SUBSCRIPTIONS[productId]) {
      const subInfo = SUBSCRIPTIONS[productId];
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default to 30 days for now

      await Promise.all([
        supabase.from("profiles").update({ 
          is_plus: true, 
          plan: subInfo.plan, 
          plus_expires_at: expiresAt 
        }).eq("id", userId),
        
        supabase.from("subscriptions").insert({
          user_id: userId, 
          plan: subInfo.plan, 
          status: "active", 
          expires_at: expiresAt,
          price_krw: subInfo.krw,
          iap_product_id: productId,
          iap_transaction_id: purchaseToken,
        }),
      ]);

      // Add bonuses
      const { data: itemData } = await supabase.from("user_items").select("*").eq("user_id", userId).maybeSingle();
      const currentBoosts = itemData?.boosts ?? 0;
      await supabase.from("user_items").upsert({
        user_id: userId,
        boosts: currentBoosts + subInfo.boosts
      }, { onConflict: "user_id" });

    } else if (!isSubscription && CONSUMABLES[productId]) {
      const itemInfo = CONSUMABLES[productId];
      const { data: itemData } = await supabase.from("user_items").select("*").eq("user_id", userId).maybeSingle();
      const currentSuperLikes = itemData?.super_likes ?? 0;
      const currentBoosts = itemData?.boosts ?? 0;

      if (itemInfo.type === "superlike") {
        await supabase.from("user_items").upsert({ user_id: userId, super_likes: currentSuperLikes + itemInfo.amount! }, { onConflict: "user_id" });
      } else if (itemInfo.type === "boost") {
        await supabase.from("user_items").upsert({ user_id: userId, boosts: currentBoosts + itemInfo.amount! }, { onConflict: "user_id" });
      } else if (itemInfo.type === "pack") {
        await supabase.from("user_items").upsert({ 
          user_id: userId, 
          super_likes: currentSuperLikes + itemInfo.superlike!,
          boosts: currentBoosts + itemInfo.boost!
        }, { onConflict: "user_id" });
      } else if (itemInfo.type === "badge") {
        await supabase.from("profiles").update({ has_badge: true }).eq("id", userId);
      } else if (itemInfo.type === "theme") {
        await supabase.from("profiles").update({ profile_theme: "aurora" }).eq("id", userId);
      } else if (itemInfo.type === "nearby") {
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("profiles").update({ nearby_expires_at: expires }).eq("id", userId);
      }
    } else {
      throw new Error(`Unknown product ID: ${productId}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("IAP Verification Error:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
