import fs from 'fs';
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
});

async function run() {
  const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/messages?limit=1`, {
    headers: {
      'apikey': env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}`
    }
  });
  const data = await res.json();
  console.log(data);
}
run();
