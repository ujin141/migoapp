import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from("posts").select("profiles(*)").limit(1);
  console.log("Error profiles:", JSON.stringify(error, null, 2));

  const { error: error2 } = await supabase.from("posts").select("id, author_id, profiles!posts_author_id_fkey(*)").limit(1);
  console.log("Error explicit fkey:", JSON.stringify(error2, null, 2));
}

run();
