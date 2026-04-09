import requests
import json

url = "https://feeildpjwqfjlqimaxwr.supabase.co/rest/v1/posts?limit=1"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZWlsZHBqd3FmamxxaW1heHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNjAzOTAsImV4cCI6MjA4OTYzNjM5MH0.cBCe_xj_UH2se_t6OxhIb5HfZ7ivuxg8Wwdps60L9rM",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZWlsZHBqd3FmamxxaW1heHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNjAzOTAsImV4cCI6MjA4OTYzNjM5MH0.cBCe_xj_UH2se_t6OxhIb5HfZ7ivuxg8Wwdps60L9rM",
    "Prefer": "return=representation"
}

res = requests.post(url, headers=headers, json={"title": "test", "content": "test", "author_id": "00000000-0000-0000-0000-000000000000", "tags": ['{"lat": 37.0, "lng": 127.0, "location_name": "Seoul"}']})
print(res.status_code)
print(json.dumps(res.json(), indent=2))
