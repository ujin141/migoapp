import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const { data, error } = await supabase.from('messages').select('*').limit(1);
console.log("Error:", error);
if (data && data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
} else {
    console.log("No data, but no error means table is readable.");
    const { error: err2 } = await supabase.from('messages').insert({}).select();
    console.log("Insert empty error:", err2);
}
