import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env.local', 'utf-8');
const envUrl = envFile.split('\n').find(l => l.startsWith('VITE_SUPABASE_URL')).split('=')[1].replace(/["']/g, '').trim();
const envKey = envFile.split('\n').find(l => l.startsWith('VITE_SUPABASE_ANON_KEY')).split('=')[1].replace(/["']/g, '').trim();

const supabase = createClient(envUrl, envKey);

async function test() {
  const { data, error } = await supabase.from('trip_groups').select('id, title, status, profiles!trip_groups_host_id_fkey(name, photo_url)').limit(5).order('created_at', {ascending: false});
  console.log("Using profiles!trip_groups_host_id_fkey:", JSON.stringify(data, null, 2), error);
  
  const { data: d2, error: e2 } = await supabase.from('trip_groups').select('id, title, status, profiles:host_id(name, photo_url)').limit(5).order('created_at', {ascending: false});
  console.log("Using profiles:host_id:", JSON.stringify(d2, null, 2), e2);
  
  const { data: d3, error: e3 } = await supabase.from('trip_groups').select('id, title, status, profiles:profiles!trip_groups_host_id_fkey(name, photo_url)').limit(5).order('created_at', {ascending: false});
  console.log("Using profiles:profiles!trip_groups_host_id_fkey:", JSON.stringify(d3, null, 2), e3);
}
test();
