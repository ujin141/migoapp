const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src/i18n/locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.ts'));

const engTranslations = {
  tabTitle: "Instant Meet",
  chatPrefix: "💎 Instant Meet: ",
  chatLastMsg: "📍 Let's meet at {{place}} around {{time}}!",
  chatLastMsgDefault: "Instant Meet match confirmed!",
  limitTitle: "Access Restricted",
  limitDesc: "You cannot use Instant Meet due to 3 or more no-shows.",
  freeLimitTitle: "Free Tier Limit Reached",
  freeLimitDesc: "Premium subscribers can use Instant Meet unlimited times.",
  mainTitle: "Nearby Instant Meet",
  mainDesc: "Matching you with the best available companion right now.",
  tagInstant: "Instant Match",
  tagLocation: "Location Based",
  tag1Hour: "Within 1 Hour",
  selectPlaceTitle: "Select Meetup Location",
  selectPlaceDesc: "Pick a popular hot spot",
  vibeTitle: "Meetup Style",
  vibeDesc: "What kind of meetup do you want?",
  plusOnly: "Plus Only",
  unlockPlus: "Unlock with Plus",
  startBtn: "Start from here",
  enterBtn: "Enter Instant Meet",
  infoTitle: "Instant Meet (within 1 hour)",
  matchSuccess: "Match Success! Starting Instant Meet",
  goToChat: "Go to Chat Room",
  places: {
    hongdae: "Hongdae/Yeonnam",
    gangnam: "Gangnam/Sinnonhyeon",
    itaewon: "Itaewon",
    busan: "Gwangalli/Haeundae",
    jeju: "Aewol/Hamdeok",
    shibuya: "Shibuya",
    shinjuku: "Shinjuku",
    dotonbori: "Dotonbori",
    fukuoka: "Tenjin/Nakasu",
    khaosan: "Khaosan Road",
    taipei: "Ximending",
    danang: "My Khe Beach",
    bali: "Canggu",
    cebu: "IT Park",
    newyork: "Manhattan Soho",
    london: "London Soho",
    paris_marais: "Le Marais",
    sydney: "Sydney Bondi"
  },
  styles: {
    any: "All",
    party: "Party type",
    healing: "Healing type",
    serious: "Serious"
  }
};

const korTranslations = {
  tabTitle: "바로모임",
  chatPrefix: "💎 바로모임: ",
  chatLastMsg: "📍 {{place}} {{time}}에 만나요!",
  chatLastMsgDefault: "바로모임 매칭이 성사되었습니다!",
  limitTitle: "이용 제한됨",
  limitDesc: "노쇼가 3회 이상 누적되어 바로모임을 사용할 수 없습니다.",
  freeLimitTitle: "무료 이용 완료",
  freeLimitDesc: "프리미엄 구독자는 바로모임을 무제한으로 이용할 수 있습니다.",
  mainTitle: "주변 즉흥 바로모임",
  mainDesc: "지금 바로 만날 수 있는 최적의 상대를 매칭합니다.",
  tagInstant: "즉시 매칭",
  tagLocation: "위치 기반",
  tag1Hour: "1시간 내",
  selectPlaceTitle: "모임 장소 선택",
  selectPlaceDesc: "핫한 장소를 골라보세요",
  vibeTitle: "만남 스타일",
  vibeDesc: "어떤 만남을 원하세요?",
  plusOnly: "Plus 전용",
  unlockPlus: "Plus로 잠금 해제",
  startBtn: "바로모임 시작하기",
  enterBtn: "바로모임 입장하기",
  infoTitle: "즉흥 바로모임 (1시간 내 만남)",
  matchSuccess: "매칭 성공! 바로모임 시작",
  goToChat: "채팅방으로 이동",
  places: {
    hongdae: "홍대/연남",
    gangnam: "강남/신논현",
    itaewon: "이태원",
    busan: "광안리/해운대",
    jeju: "애월/함덕",
    shibuya: "시부야 (Shibuya)",
    shinjuku: "신주쿠 (Shinjuku)",
    dotonbori: "도톤보리 (Dotonbori)",
    fukuoka: "텐진 (Fukuoka)",
    khaosan: "카오산로드 (Khaosan)",
    taipei: "시먼딩 (Ximending)",
    danang: "미케비치 (Da Nang)",
    bali: "짱구 (Canggu)",
    cebu: "IT 파크 (Cebu)",
    newyork: "맨해튼 소호 (New York)",
    london: "소호 (London)",
    paris_marais: "마레 지구 (Paris)",
    sydney: "본다이 비치 (Sydney)"
  },
  styles: {
    any: "전체 (all)",
    party: "파티/술자리 (party)",
    healing: "힐링/카페 (healing)",
    serious: "진지한 대화 (serious)"
  }
};

for (const file of files) {
  const filePath = path.join(localesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('"instant": {')) {
    continue; // already injected
  }
  
  const translations = (file === 'ko.ts') ? korTranslations : engTranslations;
  const injectString = `"instant": ${JSON.stringify(translations, null, 4).replace(/\n/g, '\n  ')},`;
  
  content = content.replace(/(const \w+\s*=\s*\{)/, `$1\n  ${injectString}`);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Injected into ' + file);
}
