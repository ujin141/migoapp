import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env.local', 'utf-8');
const envUrl = envFile.split('\n').find(l => l.startsWith('VITE_SUPABASE_URL')).split('=')[1].replace(/["']/g, '').trim();
const envKey = envFile.split('\n').find(l => l.startsWith('VITE_SUPABASE_ANON_KEY')).split('=')[1].replace(/["']/g, '').trim();

const supabase = createClient(envUrl, envKey);

async function test() {
  const { data, error } = await supabase.from('profiles').select('email, name, photo_url').in('email', ['seed_08@migo.app', 'seed_16@migo.app', 'seed_37@migo.app', 'seed_25@migo.app', 'seed_24@migo.app']);
  console.log("Profiles:", JSON.stringify(data, null, 2), error);
}
test();
