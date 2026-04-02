const url = "https://feeildpjwqfjlqimaxwr.supabase.co/rest/v1/posts?select=id,profiles(name)";
const headers = {
  "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZWlsZHBqd3FmamxxaW1heHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNjAzOTAsImV4cCI6MjA4OTYzNjM5MH0.cBCe_xj_UH2se_t6OxhIb5HfZ7ivuxg8Wwdps60L9rM",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZWlsZHBqd3FmamxxaW1heHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNjAzOTAsImV4cCI6MjA4OTYzNjM5MH0.cBCe_xj_UH2se_t6OxhIb5HfZ7ivuxg8Wwdps60L9rM"
};

fetch(url, { headers })
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)));
