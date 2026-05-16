import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env.local', 'utf-8');
const envUrl = envFile.split('\n').find(l => l.startsWith('VITE_SUPABASE_URL')).split('=')[1].replace(/["']/g, '').trim();
const envKey = envFile.split('\n').find(l => l.startsWith('VITE_SUPABASE_ANON_KEY')).split('=')[1].replace(/["']/g, '').trim();

const supabase = createClient(envUrl, envKey);

async function test() {
  const { data, error } = await supabase.from('trip_groups').select('id, title, departure').limit(1);
  console.log("With specific column:", data, error);
  const { data: d2, error: e2 } = await supabase.from('trip_groups').select('*').limit(1);
  console.log("With select * (has departure?):", d2 && d2[0] && 'departure' in d2[0]);
}
test();
