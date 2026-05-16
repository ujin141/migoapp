import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env.local', 'utf-8');
const envUrl = envFile.split('\n').find(l => l.startsWith('VITE_SUPABASE_URL')).split('=')[1].replace(/["']/g, '').trim();
const envKey = envFile.split('\n').find(l => l.startsWith('VITE_SUPABASE_ANON_KEY')).split('=')[1].replace(/["']/g, '').trim();

const supabase = createClient(envUrl, envKey);

async function test() {
  const { data, error } = await supabase.from('trip_groups').select('id, title, departure, status').order('created_at', {ascending: false}).limit(10);
  console.log(JSON.stringify(data, null, 2), error);
}
test();
