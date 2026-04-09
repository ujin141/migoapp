import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkColumns() {
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').limit(1);
  if (pErr) console.error('Profiles err:', pErr);
  else console.log('Profiles columns:', Object.keys(profiles[0] || {}));

  const { data: tripGroups, error: tgErr } = await supabase.from('trip_groups').select('*').limit(1);
  if (tgErr) console.error('TripGroups err:', tgErr);
  else console.log('TripGroups columns:', Object.keys(tripGroups[0] || {}));

  const { data: posts, error: poErr } = await supabase.from('posts').select('*').limit(1);
  if (poErr) console.error('Posts err:', poErr);
  else console.log('Posts columns:', Object.keys(posts[0] || {}));

  const { data: reviews, error: revErr } = await supabase.from('meet_reviews').select('*').limit(1);
  if (revErr) console.error('Reviews err:', revErr);
  else console.log('Reviews columns:', Object.keys(reviews[0] || {}));
}

checkColumns();
