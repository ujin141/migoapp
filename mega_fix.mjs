// mega_fix.mjs - DiscoverPage.tsx 모든 손상 줄 한꺼번에 수정
import { readFileSync, writeFileSync } from 'fs';

const file = 'c:/Users/ujin1/Desktop/MIGO/MigoApp/src/pages/DiscoverPage.tsx';
const text = readFileSync(file, 'utf8');
const lines = text.split('\n');
let fixCount = 0;

// 특정 줄 패턴 교체 맵
const lineReplacements = [
  // 88줄: activeFilter 초기값
  [/setState\("[\?].*?체"/, 'setState("전체"'],
  [/useState\("[\?].*?체"\)/, 'useState("전체")'],
  // 손상된 "알 수 없음" 패턴
  [/"[\?]{1,5}[\?].*?음"/, '"알 수 없음"'],
  // toast title/description 닫히지 않은 패턴 수정
];

const newLines = lines.map((line, idx) => {
  if (!/[^\x00-\x7E]/.test(line)) return line; // ASCII만이면 건드리지 않음
  
  let newLine = line;
  const cr = line.endsWith('\r');
  const base = cr ? line.slice(0, -1) : line;
  
  // 특정 손상 패턴들 수정
  // useState("?체") → useState("전체")
  newLine = newLine.replace(/useState\("[\?][^\x00-\x7E]*?"\)/, 'useState("전체")');
  
  // "?????음" → "알 수 없음"
  newLine = newLine.replace(/"[\?]+?[\x80-\xFF]*?음"/g, '"알 수 없음"');
  
  // "방금 ??" → "방금 전"
  newLine = newLine.replace(/"방금 [\?][\?]"/g, '"방금 전"');
  newLine = newLine.replace(/"방금 [\?]+"/g, '"방금 전"');
  
  // activeFilter 비교 손상 수정
  // activeFilter === "?체" → activeFilter === "all"
  newLine = newLine.replace(/activeFilter === "[\?][^\x00-\x7E]*?체"/, 'activeFilter === "all"');
  // 모집 중
  newLine = newLine.replace(/activeFilter === "모집 [\?]+"/, 'activeFilter === "recruiting"');
  
  // toast 메시지 - 닫히지 않은 따옴표가 있는 toast 처리
  // 패턴: toast({ title: "손상된텍스트 }) 또는 toast({ title: "손상된텍스트, description: "...}) 
  if (newLine.includes('toast({') && /[^\x00-\x7E]/.test(newLine)) {
    // 모든 한글이 들어간 toast는 간단한 영어 또는 제거
    // 구체적 교체
    newLine = newLine
      .replace(/"\s*(?:번역\s*)?[\?]+패?"/, '"오류 발생"')
      .replace(/"[\?]*\s*(?:다[\?]\s*)?시[\?]*\s*(?:해[\?]\s*)?주[\?]*[\?]*요"/, '"잠시 후 다시 시도해주세요"')
      .replace(/"이미 참여 중인 그룹[\?]*[\?]*"/, '"이미 참여 중인 그룹이에요"')
      .replace(/"[\?]*참여 중인 그룹[\?]*"/, '"이미 참여 중인 그룹이에요"')
      .replace(/"[\?]*가[\?]*찼어[\?]*"/, '"정원이 가득 찼어요"')
      .replace(/"[\?]*른 그룹[\?]*찾아볼까[\?]*"/, '"다른 그룹을 찾아볼까요?"')
      .replace(/"로그[\?]*이[\?]*\s*(?:필요[\?]*)?[\?]*니[\?]*"/, '"로그인이 필요합니다"')
      .replace(/"[\?]*목[\?]*[\?]*용[\?]*[\?]*력[\?]*주[\?]*요"/, '"제목과 내용을 입력해주세요"')
      .replace(/"글[\?]*[\?]*로[\?]*되[\?]*어[\?]*"/, '"글이 업로드되었어요! 🎉"')
      .replace(/"[\?]*록[\?]*패"/, '"업로드 실패"')
      .replace(/"[\?]*클립[\?]*드[\?]*[\?]*사[\?]*어[\?]*"/, '"클립보드에 복사되었어요! 📋"')
      .replace(/"번역 [\?]패"/, '"번역 실패"');
    
    // 여전히 끝 따옴표가 없는 경우 (홀수 따옴표)
    const quoteCount = (newLine.match(/"/g) || []).length;
    const backtickCount = (newLine.match(/`/g) || []).length;
    if (quoteCount % 2 !== 0 && backtickCount % 2 === 0) {
      if (newLine.trimEnd().endsWith(',')) {
        newLine = newLine.trimEnd().slice(0, -1) + '",';
      } else if (newLine.trimEnd().endsWith(';')) {
        newLine = newLine.trimEnd().slice(0, -1) + '";';
      } else if (newLine.trimEnd().endsWith('}')) {
        newLine = newLine.trimEnd().slice(0, -1) + '"}';
      } else {
        newLine = newLine.trimEnd() + '"';
      }
      if (cr) newLine += '\r';
    }
    
    if (newLine !== line) fixCount++;
  }
  
  if (newLine !== line) fixCount++;
  return newLine;
});

writeFileSync(file, newLines.join('\n'), 'utf8');
console.log(`Fixed ${fixCount} lines`);

// 검증 - 비ASCII가 남아있는 코드 줄 수
const check = readFileSync(file, 'utf8').split('\n');
let remaining = 0;
for (const l of check) {
  if (/[^\x00-\x7E]/.test(l) && !l.trim().startsWith('//')) remaining++;
}
console.log('Remaining non-ASCII code lines:', remaining);
// 처음 5개
let shown = 0;
for (let i = 0; i < check.length && shown < 5; i++) {
  if (/[^\x00-\x7E]/.test(check[i]) && !check[i].trim().startsWith('//')) {
    shown++;
    console.log(i+1, ':', check[i].slice(0,100));
  }
}
