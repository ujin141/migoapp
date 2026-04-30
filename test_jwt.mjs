import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
async function testFunction() {
  const { data: user, error: signUpError } = await supabase.auth.signUp({
    email: 'test_delete_1234567@example.com',
    password: 'password123'
  });
  const { data: session } = await supabase.auth.getSession();
  console.log("Token:", session.session.access_token.split('.')[0]);
  const decodedHeader = Buffer.from(session.session.access_token.split('.')[0], 'base64').toString();
  console.log("Decoded Header:", decodedHeader);
}
testFunction();
