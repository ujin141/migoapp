import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// read the .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log("URL:", supabaseUrl);
