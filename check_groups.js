import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());
  
  async function run() {
    const { data, error } = await supabase.from('trip_groups').select('id, title, status, is_active');
    console.log('Trip Groups Count:', data?.length);
    console.log(data);
  }
  run();
} else {
  console.log('No env found');
}
