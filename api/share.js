export default function handler(req, res) {
  // Query parameters: element (wood|fire|earth|metal|water), name (닉네임), ref (추천 코드)
  const { element, name, ref } = req.query;

  const elements = {
    wood: { emoji: "🌲", name: "거대소나무", nameEn: "Giant Pine Tree" },
    fire: { emoji: "🔥", name: "태양열정", nameEn: "Golden Flame" },
    earth: { emoji: "⛰️", name: "단단바위", nameEn: "Iron Mountain" },
    metal: { emoji: "💎", name: "화려보석", nameEn: "Glimmering Jewel" },
    water: { emoji: "🌊", name: "유연강물", nameEn: "Ocean Explorer" }
  };

  const selected = elements[element] || elements.wood;
  const displayName = name ? decodeURIComponent(name) : "누군가";
  const title = `나의 여행 DNA는? [${selected.emoji} ${selected.name}]`;
  const desc = `${displayName}님이 당신을 여행 사주 테스트에 초대했습니다! 서로의 여행 궁합과 매칭되는 여행자를 확인해보세요.`;
  
  // Host domain check for dynamic absolute path
  const host = req.headers.host || "www.migo-go.com";
  const protocol = host.includes("localhost") ? "http" : "https";
  const imageUrl = `${protocol}://${host}/og-${element || 'wood'}.png`;
  const shareUrl = `${protocol}://${host}/api/share?element=${element || 'wood'}&name=${encodeURIComponent(displayName)}${ref ? `&ref=${ref}` : ''}`;
  const redirectUrl = `/#/travel-dna?friendElement=${element || 'wood'}&friendName=${encodeURIComponent(displayName)}${ref ? `&ref=${ref}` : ''}`;

  // Serve static HTML with custom OG tags for crawlers, and JavaScript redirection for browser users.
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <meta name="description" content="${desc}">
      
      <!-- Open Graph (SNS 공유 프리뷰) -->
      <meta property="og:type" content="website">
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${desc}">
      <meta property="og:image" content="${imageUrl}">
      <meta property="og:url" content="${shareUrl}">
      
      <!-- Twitter / X Card -->
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${title}">
      <meta name="twitter:description" content="${desc}">
      <meta name="twitter:image" content="${imageUrl}">
      
      <!-- App Store Deep Link (딥링크 연동) -->
      <meta property="al:ios:url" content="migo://travel-dna?element=${element || 'wood'}&ref=${ref || ''}">
      <meta property="al:ios:app_store_id" content="6761537006">
      <meta property="al:ios:app_name" content="Migo">
      <meta property="al:android:url" content="migo://travel-dna?element=${element || 'wood'}&ref=${ref || ''}">
      <meta property="al:android:package" content="com.lunaticsgroup.migo">
      
      <!-- Browser Redirection -->
      <script>
        window.location.href = "${redirectUrl}";
      </script>
    </head>
    <body>
      <p>Migo 앱으로 이동하고 있습니다... 만약 자동으로 이동하지 않는다면 <a href="${redirectUrl}">여기</a>를 클릭하세요.</p>
    </body>
    </html>
  `);
}
