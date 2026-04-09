const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '/Users/song-ujin/.gemini/antigravity/scratch/migoapp/.env';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const parts = line.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/['"]/g, '');
      process.env[key] = val;
    }
  });
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: userData } = await supabase.auth.getUser(); // this might not work without token
  // Let's just check the RLS on chat_members
  console.log("Supabase connected");
}
check();
