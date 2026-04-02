import fs from 'fs';
import path from 'path';

function parseTsObject(content) {
  try {
    const startIdx = content.indexOf('{');
    const endIdx = content.lastIndexOf('}');
    const jsonStr = content.substring(startIdx, endIdx + 1);
    return (new Function(`return (${jsonStr})`))();
  } catch (e) {
    console.error(e);
    return {};
  }
}

function stringifyTsObject(obj, varName) {
  return `const ${varName} = ${JSON.stringify(obj, null, 2)};\nexport default ${varName};\n`;
}

const localesDir = path.join(process.cwd(), 'src', 'i18n', 'locales');

const enExtra = {
    randomMatchTitle: "Detailed Conditions",
    randomMatchNone: "Not selected (Nearby instant match)",
    matchFail: "Match Failed",
    matchFailDesc: "No groups match your conditions. Please adjust your filters.",
    matchFailDesc2: "There are no nearby groups that match your conditions.",
    roomError: "Entry Error",
    roomErrorDesc: "A problem occurred while creating the chat room.",
    matchSuccessTitle: "🎲 Match successful!",
    randomMatchPrefix: "🎲 Random Match",
    unknownPlace: "TBD",
    unknownTime: "TBD",
    proposalTitle: "📌 Meeting Proposal",
    proposalDate: "Date: {{date}} {{time}}",
    proposalPlace: "Location: {{city}} {{place}}",
    proposalEnd: "A match has been made. Have an enjoyable meeting! 🎉",
    popCities: {
      c1: "Seoul", c2: "Busan", c3: "Jeju", c4: "Tokyo", c5: "Osaka", c6: "Bali", c7: "Bangkok", c8: "Paris", c9: "New York"
    },
    popPlaces: {
      p1: "Cafe", p2: "Hongdae Club", p3: "Izakaya", p4: "Rooftop bar", p5: "Restaurant", p6: "Park"
    }
};

const koExtra = {
    randomMatchTitle: "상세 조건 설정",
    randomMatchNone: "선택 안 함 (주변 즉석 매칭)",
    matchFail: "매칭 실패",
    matchFailDesc: "조건에 맞는 그룹이 없습니다. 필터를 조정해 보세요.",
    matchFailDesc2: "현재 선택하신 조건에 맞는 주변 모임이 없습니다.",
    roomError: "입장 오류",
    roomErrorDesc: "채팅방 생성 중 문제가 발생했습니다.",
    matchSuccessTitle: "🎲 매칭 성공!",
    randomMatchPrefix: "🎲 랜덤매칭",
    unknownPlace: "장소미정",
    unknownTime: "시간미정",
    proposalTitle: "📌 만남 제안",
    proposalDate: "날짜: {{date}} {{time}}",
    proposalPlace: "장소: {{city}} {{place}}",
    proposalEnd: "매칭이 성사되었습니다. 즐거운 만남 되세요! 🎉",
    popCities: {
      c1: "서울", c2: "부산", c3: "제주", c4: "도쿄", c5: "오사카", c6: "발리", c7: "방콕", c8: "파리", c9: "뉴욕"
    },
    popPlaces: {
      p1: "카페", p2: "홍대 클럽", p3: "이자카야", p4: "루프탑 바", p5: "맛집", p6: "공원"
    }
};

const enContent = fs.readFileSync(path.join(localesDir, 'en.ts'), 'utf8');
const enObj = parseTsObject(enContent);
Object.assign(enObj.instant, enExtra);
fs.writeFileSync(path.join(localesDir, 'en.ts'), stringifyTsObject(enObj, 'en'), 'utf8');

const koContent = fs.readFileSync(path.join(localesDir, 'ko.ts'), 'utf8');
const koObj = parseTsObject(koContent);
Object.assign(koObj.instant, koExtra);
fs.writeFileSync(path.join(localesDir, 'ko.ts'), stringifyTsObject(koObj, 'ko'), 'utf8');

console.log("Added hardcoded instant strings to ko and en!");
