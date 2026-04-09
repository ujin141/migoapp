import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = '/Users/song-ujin/.gemini/antigravity/scratch/migoapp/.env.local';
let envUrl = '';
let envKey = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.includes('VITE_SUPABASE_URL=')) envUrl = line.split('=')[1].trim().replace(/['"]/g, '');
    if (line.includes('VITE_SUPABASE_ANON_KEY=')) envKey = line.split('=')[1].trim().replace(/['"]/g, '');
  });
} catch(e) {}

if (!envUrl) {
    console.log("No env URL");
} else {
    // create unauthenticated client
    const supabase = createClient(envUrl, envKey);
    const { error } = await supabase.from('chat_members').delete().eq('thread_id','123').eq('user_id','123');
    console.log('Delete error:', error);
}
