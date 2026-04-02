import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/^"|"$/g, '');
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/^"|"$/g, '');
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from("posts").select(`
    id, content, title, image_url, image_urls, created_at, author_id,
    profiles!posts_author_id_fkey(name, photo_url),
    post_likes(count),
    comments(id, text, created_at, author_id, profiles(name, photo_url))
  `).eq("hidden", false).order("created_at", { ascending: false }).limit(1);
  console.log("Error comments target:", JSON.stringify(error, null, 2));
}

run();
