const fs = require('fs');
let code = fs.readFileSync('c:/Users/ujin1/Desktop/MIGO/MigoApp/src/pages/DiscoverPage.tsx', 'utf8');

const targetStr = `{activeTab === "community" && (
        <div className="px-5 space-y-3 pt-3 pb-24">
          {loadingPosts ? (`.trim().replace(/\r\n/g, '\n');

// Try a more regex approach to ignore minor whitespace differences
const regexTarget = /\{activeTab === "community" && \(\s*<div className="px-5 space-y-3 pt-3 pb-24">\s*\{loadingPosts \? \(/;

const replaceStr = `{activeTab === "community" && (
        <div className="px-5 space-y-3 pt-3 pb-24">
          <div className="flex gap-4 border-b border-border/50 pb-2 mb-4">
            <button onClick={() => setActiveCommunityFilter("latest")} className={\`font-bold pb-2 border-b-2 px-1 transition-all \${activeCommunityFilter === "latest" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}\`}>최신글</button>
            <button onClick={() => setActiveCommunityFilter("popular")} className={\`font-bold pb-2 border-b-2 px-1 transition-all \${activeCommunityFilter === "popular" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}\`}>🔥인기글</button>
          </div>
          {loadingPosts ? (`;

if (regexTarget.test(code)) {
  code = code.replace(regexTarget, replaceStr);
  fs.writeFileSync('c:/Users/ujin1/Desktop/MIGO/MigoApp/src/pages/DiscoverPage.tsx', code);
  console.log("SUCCESS: Community tabs added successfully!");
} else {
  console.log("FAIL: Target regex not found in DiscoverPage.tsx");
}
