const fs = require('fs');

const dests = [
  { name: '서울', country: '대한민국', emoji: '🇰🇷', enName: 'seoul', enCountry: 'korea' },
  { name: '부산', country: '대한민국', emoji: '🇰🇷', enName: 'busan', enCountry: 'korea' },
  { name: '제주', country: '대한민국', emoji: '🇰🇷', enName: 'jeju', enCountry: 'korea' },
  { name: '경주', country: '대한민국', emoji: '🇰🇷', enName: 'gyeongju', enCountry: 'korea' },
  { name: '강릉', country: '대한민국', emoji: '🇰🇷', enName: 'gangneung', enCountry: 'korea' },
  { name: '전주', country: '대한민국', emoji: '🇰🇷', enName: 'jeonju', enCountry: 'korea' },
  { name: '도쿄', country: '일본', emoji: '🇯🇵', enName: 'tokyo', enCountry: 'japan' },
  { name: '오사카', country: '일본', emoji: '🇯🇵', enName: 'osaka', enCountry: 'japan' },
  { name: '교토', country: '일본', emoji: '🇯🇵', enName: 'kyoto', enCountry: 'japan' },
  { name: '후쿠오카', country: '일본', emoji: '🇯🇵', enName: 'fukuoka', enCountry: 'japan' },
  { name: '삿포로', country: '일본', emoji: '🇯🇵', enName: 'sapporo', enCountry: 'japan' },
  { name: '오키나와', country: '일본', emoji: '🇯🇵', enName: 'okinawa', enCountry: 'japan' },
  { name: '방콕', country: '태국', emoji: '🇹🇭', enName: 'bangkok', enCountry: 'thailand' },
  { name: '치앙마이', country: '태국', emoji: '🇹🇭', enName: 'chiang mai', enCountry: 'thailand' },
  { name: '푸켓', country: '태국', emoji: '🇹🇭', enName: 'phuket', enCountry: 'thailand' },
  { name: '발리', country: '인도네시아', emoji: '🇮🇩', enName: 'bali', enCountry: 'indonesia' },
  { name: '싱가포르', country: '싱가포르', emoji: '🇸🇬', enName: 'singapore', enCountry: 'singapore' },
  { name: '쿠알라룸푸르', country: '말레이시아', emoji: '🇲🇾', enName: 'kuala lumpur', enCountry: 'malaysia' },
  { name: '코타키나발루', country: '말레이시아', emoji: '🇲🇾', enName: 'kota kinabalu', enCountry: 'malaysia' },
  { name: '다낭', country: '베트남', emoji: '🇻🇳', enName: 'da nang', enCountry: 'vietnam' },
  { name: '호치민', country: '베트남', emoji: '🇻🇳', enName: 'ho chi minh', enCountry: 'vietnam' },
  { name: '하노이', country: '베트남', emoji: '🇻🇳', enName: 'hanoi', enCountry: 'vietnam' },
  { name: '나트랑', country: '베트남', emoji: '🇻🇳', enName: 'nha trang', enCountry: 'vietnam' },
  { name: '마닐라', country: '필리핀', emoji: '🇵🇭', enName: 'manila', enCountry: 'philippines' },
  { name: '세부', country: '필리핀', emoji: '🇵🇭', enName: 'cebu', enCountry: 'philippines' },
  { name: '보라카이', country: '필리핀', emoji: '🇵🇭', enName: 'boracay', enCountry: 'philippines' },
  { name: '타이베이', country: '대만', emoji: '🇹🇼', enName: 'taipei', enCountry: 'taiwan' },
  { name: '가오슝', country: '대만', emoji: '🇹🇼', enName: 'kaohsiung', enCountry: 'taiwan' },
  { name: '홍콩', country: '홍콩', emoji: '🇭🇰', enName: 'hong kong', enCountry: 'hong kong' },
  { name: '마카오', country: '마카오', emoji: '🇲🇴', enName: 'macau', enCountry: 'macau' },
  { name: '파리', country: '프랑스', emoji: '🇫🇷', enName: 'paris', enCountry: 'france' },
  { name: '로마', country: '이탈리아', emoji: '🇮🇹', enName: 'rome', enCountry: 'italy' },
  { name: '바르셀로나', country: '스페인', emoji: '🇪🇸', enName: 'barcelona', enCountry: 'spain' },
  { name: '런던', country: '영국', emoji: '🇬🇧', enName: 'london', enCountry: 'uk' },
  { name: '암스테르담', country: '네덜란드', emoji: '🇳🇱', enName: 'amsterdam', enCountry: 'netherlands' },
  { name: '베를린', country: '독일', emoji: '🇩🇪', enName: 'berlin', enCountry: 'germany' },
  { name: '프라하', country: '체코', emoji: '🇨🇿', enName: 'prague', enCountry: 'czech' },
  { name: '부다페스트', country: '헝가리', emoji: '🇭🇺', enName: 'budapest', enCountry: 'hungary' },
  { name: '비엔나', country: '오스트리아', emoji: '🇦🇹', enName: 'vienna', enCountry: 'austria' },
  { name: '인터라켄', country: '스위스', emoji: '🇨🇭', enName: 'interlaken', enCountry: 'switzerland' },
  { name: '취리히', country: '스위스', emoji: '🇨🇭', enName: 'zurich', enCountry: 'switzerland' },
  { name: '리스본', country: '포르투갈', emoji: '🇵🇹', enName: 'lisbon', enCountry: 'portugal' },
  { name: '아테네', country: '그리스', emoji: '🇬🇷', enName: 'athens', enCountry: 'greece' },
  { name: '두바이', country: 'UAE', emoji: '🇦🇪', enName: 'dubai', enCountry: 'uae' },
  { name: '이스탄불', country: '터키', emoji: '🇹🇷', enName: 'istanbul', enCountry: 'turkey' },
  { name: '뉴욕', country: '미국', emoji: '🇺🇸', enName: 'new york', enCountry: 'usa' },
  { name: '로스앤젤레스', country: '미국', emoji: '🇺🇸', enName: 'los angeles', enCountry: 'usa' },
  { name: '하와이', country: '미국', emoji: '🇺🇸', enName: 'hawaii', enCountry: 'usa' },
  { name: '시드니', country: '호주', emoji: '🇦🇺', enName: 'sydney', enCountry: 'australia' },
  { name: '멜버른', country: '호주', emoji: '🇦🇺', enName: 'melbourne', enCountry: 'australia' },
  { name: '퀸즈타운', country: '뉴질랜드', emoji: '🇳🇿', enName: 'queenstown', enCountry: 'new zealand' },
  { name: '몰디브', country: '몰디브', emoji: '🇲🇻', enName: 'maldives', enCountry: 'maldives' },
  { name: '사이판', country: '사이판', emoji: '🏝️', enName: 'saipan', enCountry: 'saipan' },
  { name: '괌', country: '괌', emoji: '🏝️', enName: 'guam', enCountry: 'guam' }
];

let content = fs.readFileSync('src/components/GroupCreateModal.tsx', 'utf8');

// Replace the DESTINATIONS block
const newDestinations = dests.map(d => {
  // Find the original line
  const match = content.match(new RegExp(`{ name: i18n\\.t\\(".*", "${d.name}"\\).*?}`));
  if (match) {
    const original = match[0];
    return original.replace(' }', `, keys: ["${d.name}", "${d.enName}", "${d.country}", "${d.enCountry}"] }`);
  }
  return null;
}).filter(Boolean);

if (newDestinations.length === dests.length) {
  let inDestinations = false;
  let result = [];
  const lines = content.split('\n');
  let idx = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('const DESTINATIONS = [')) {
      inDestinations = true;
      result.push(line);
      continue;
    }
    if (inDestinations) {
      if (line.includes('];')) {
        inDestinations = false;
        result.push(line);
      } else {
        if (idx < newDestinations.length) {
          result.push('  ' + newDestinations[idx] + (idx < newDestinations.length - 1 ? ',' : ''));
          idx++;
        }
      }
    } else {
      result.push(line);
    }
  }
  fs.writeFileSync('src/components/GroupCreateModal.tsx', result.join('\n'));
  console.log("Success");
} else {
  console.log("Mismatch", dests.length, newDestinations.length);
}

