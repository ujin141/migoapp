import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkErrors() {
  const pRet = await supabase.from('profiles').select('id,name,photo_url,photo_urls,age,bio,gender,nationality,location,lat,lng,languages,interests,mbti,verified,plan,is_plus,travel_dates,travel_mission,visited_countries,budget_range,boost_expires_at').limit(1);
  if (pRet.error) console.log('Profiles Error:', pRet.error.message, pRet.error.details, pRet.error.hint);

  const tRet = await supabase.from('trip_groups').select('id,title,destination,dates,max_members,tags,description,entry_fee,is_premium,host_id,host_completed_groups,recent_messages,profiles!trip_groups_host_id_fkey(name,photo_url,bio),trip_group_members(user_id,profiles(name,photo_url))').limit(1);
  if (tRet.error) console.log('TripGroups Error:', tRet.error.message, tRet.error.details, tRet.error.hint);

  const poRet = await supabase.from('posts').select('id,content,images,image_url,created_at,post_likes(count),comments(id)').limit(1);
  if (poRet.error) console.log('Posts Error:', poRet.error.message, poRet.error.details, poRet.error.hint);

  const rRet = await supabase.from('meet_reviews').select('to_user,rating').limit(1);
  if (rRet.error) console.log('Reviews Error:', rRet.error.message, rRet.error.details, rRet.error.hint);
}

checkErrors();
