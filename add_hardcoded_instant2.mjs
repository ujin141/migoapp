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

const enExtra2 = {
    randomCity: "Meetup City",
    randomCityPlaceholder: "Type manually (e.g., Kyoto, Singapore...)",
    randomDateTime: "Date & Time",
    randomPlace: "Preferred Place",
    randomPlacePlaceholder: "Type manually (e.g., Shibuya Starbucks...)",
    randomApply: "Apply Conditions",
    randomFilterDesc: "City / Date / Place Detailed Filters"
};

const koExtra2 = {
    randomCity: "만남 도시",
    randomCityPlaceholder: "직접 입력 (예: 교토, 싱가포르...)",
    randomDateTime: "날짜 & 시간",
    randomPlace: "선호 장소",
    randomPlacePlaceholder: "직접 입력 (예: 홍대 앞 스타벅스...)",
    randomApply: "조건 적용하기",
    randomFilterDesc: "도시 / 날짜 / 장소 세부 필터링"
};

const enContent = fs.readFileSync(path.join(localesDir, 'en.ts'), 'utf8');
const enObj = parseTsObject(enContent);
Object.assign(enObj.instant, enExtra2);
fs.writeFileSync(path.join(localesDir, 'en.ts'), stringifyTsObject(enObj, 'en'), 'utf8');

const koContent = fs.readFileSync(path.join(localesDir, 'ko.ts'), 'utf8');
const koObj = parseTsObject(koContent);
Object.assign(koObj.instant, koExtra2);
fs.writeFileSync(path.join(localesDir, 'ko.ts'), stringifyTsObject(koObj, 'ko'), 'utf8');

console.log("Added hardcoded instant strings 2 to ko and en!");
