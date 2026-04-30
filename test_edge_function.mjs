import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if(!supabaseUrl || !supabaseAnonKey) {
  console.log("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFunction() {
  console.log("Signing in as a test user...");
  // Create a dummy user first
  const { data: user, error: signUpError } = await supabase.auth.signUp({
    email: 'test_delete_12345@example.com',
    password: 'password123'
  });
  
  if (signUpError) {
    console.error("SignUp error:", signUpError);
    return;
  }
  
  console.log("Waiting a bit...");
  await new Promise(r => setTimeout(r, 2000));

  console.log("Invoking delete-account...");
  // We need to pass the token explicitly if we are using server-side client, 
  // but supabase-js handles it if user is logged in the same client instance.
  try {
    const { data: result, error } = await supabase.functions.invoke('delete-account');
    if (error) {
       console.error("Invoke Error object:", error);
       if (error.context) {
          console.error("Invoke Error text:", await error.context.text());
       }
    } else {
       console.log("Result:", result);
    }
  } catch(e) {
    console.error("Caught exception:", e);
  }
}

testFunction();
