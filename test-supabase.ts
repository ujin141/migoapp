import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://xydfhhigwuztsmyvymow.supabase.co" 
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbG... (this script will fail if I don't give the env)"

// I need the env
