import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkReviewsSchema() {
  const { data, error } = await supabase.rpc('get_table_columns_by_name', { table_name: 'meet_reviews' });
  if (error) {
    console.error('RPC failed:', error.message);
    const { data: maybeAll, error: fallErr } = await supabase.from('meet_reviews').select('*');
    if (!fallErr && maybeAll.length > 0) {
      console.log('Keys:', Object.keys(maybeAll[0]));
    } else {
        // Last resort: query using postgrest internal tables or just ignore
    }
  } else {
    console.log('Columns:', data);
  }
}
checkReviewsSchema();
