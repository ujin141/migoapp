import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=['"]?(.*?)['"]?(\n|$)/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=['"]?(.*?)['"]?(\n|$)/)[1];

const supabase = createClient(url, key);

supabase.from('trip_groups').select('id, title, status').then(({data, error}) => {
  if (error) console.error(error);
  console.log("Groups in DB:", data?.length);
  console.log(data);
});
