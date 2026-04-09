import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://feeildpjwqfjlqimaxwr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZWlsZHBqd3FmamxxaW1heHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNjAzOTAsImV4cCI6MjA4OTYzNjM5MH0.cBCe_xj_UH2se_t6OxhIb5HfZ7ivuxg8Wwdps60L9rM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
async function run() {
    const { data, error } = await supabase.from('trip_groups').select('*').limit(1);
    if(error){
        console.error("Error:", error);
    }
    if (data && data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
    } else {
        console.log("No data returned, attempting insert to get error...");
        const res = await supabase.from('trip_groups').insert({
            title: "TEST",
            host_id: "nonexistent",
            max_members: 4,
            status: "active"
        });
        console.log(res);
    }
}
run();
