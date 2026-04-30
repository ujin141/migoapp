import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
async function testFunction() {
  const { data: user, error: signUpError } = await supabase.auth.signUp({
    email: 'test_rpc_delete_345@example.com',
    password: 'password123'
  });
  console.log("Signed up:", user);
  const { data, error } = await supabase.rpc('delete_user');
  console.log("RPC Error:", error);
  console.log("RPC Data:", data);
}
testFunction();
