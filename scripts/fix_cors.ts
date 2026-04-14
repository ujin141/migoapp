import { createClient } from '@supabase/supabase-js';

// use inline credentials to be safe 
const supabaseUrl = "https://feeildpjwqfjlqimaxwr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZWlsZHBqd3FmamxxaW1heHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNjAzOTAsImV4cCI6MjA4OTYzNjM5MH0.cBCe_xj_UH2se_t6OxhIb5HfZ7ivuxg8Wwdps60L9rM";
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCors() {
  const { data, error } = await supabase.from('profiles').select('id, name, photo_url, photo_urls');
  if (error) { console.error("Fetch DB Error", error); return; }

  for (const p of data) {
    let changed = false;
    let newUrl = p.photo_url;
    let newUrls = p.photo_urls ? [...p.photo_urls] : [];

    if (newUrl && newUrl.includes('randomuser.me')) {
      newUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random&size=200`;
      changed = true;
    }
    
    for (let i = 0; i < newUrls.length; i++) {
       if (newUrls[i] && newUrls[i].includes('randomuser.me')) {
          newUrls[i] = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random&size=200`;
          changed = true;
       }
    }

    if (changed) {
      console.log(`Updating user ${p.name}...`);
      await supabase.from('profiles').update({ photo_url: newUrl, photo_urls: newUrls }).eq('id', p.id);
    }
  }
  console.log("Done fixing images!");
}

fixCors();
