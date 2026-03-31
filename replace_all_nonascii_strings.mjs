// replace_all_nonascii_strings.mjs
// 파일의 문자열 리터럴 내 비ASCII 문자를 파싱 안전한 방식으로 처리
// 전략: 각 줄에서 " " (따옴표 쌍) 내의 비ASCII 문자는 유지하되
// 닫히지 않은 따옴표(홀수 개수)는 강제 닫기
import { readFileSync, writeFileSync } from 'fs';

const file = 'c:/Users/ujin1/Desktop/MIGO/MigoApp/src/pages/DiscoverPage.tsx';
const text = readFileSync(file, 'utf8');
const lines = text.split('\n');

// esbuild 오류 위치들 목록 (직접 특정 줄 수정)
// 388번째 줄: toast({ title: "?? 참여 중인 그룹이에요", description: "채팅에서 이미 확인하세요 }) 
// 닫히지 않은 패턴

let fixCount = 0;
const correctedLines = lines.map((line, idx) => {
  // 비ASCII 없으면 건드리지 않음
  if (!/[^\x00-\x7F]/.test(line)) return line;
  
  const cr = line.endsWith('\r');
  const base = cr ? line.slice(0, -1) : line;
  
  // 따옴표 카운트 (이스케이프 처리 포함)
  let quoteCount = 0;
  let templateCount = 0;
  let inTemplate = false;
  for (let i = 0; i < base.length; i++) {
    if (base[i] === '\\') { i++; continue; }
    if (base[i] === '`') { inTemplate = !inTemplate; templateCount++; }
    if (!inTemplate && base[i] === '"') quoteCount++;
  }
  
  // 홀수 따옴표이고 템플릿 리터럴도 홀수가 아닌 경우 → 닫는 따옴표 추가
  if (quoteCount % 2 !== 0 && templateCount % 2 === 0) {
    fixCount++;
    let fixed = base;
    // 줄 끝 패턴에 따라 닫기
    if (fixed.endsWith(',')) fixed = fixed.slice(0, -1) + '",';
    else if (fixed.endsWith(';')) fixed = fixed.slice(0, -1) + '";';
    else if (fixed.endsWith(')')) fixed = fixed + '"';
    else if (fixed.endsWith('});')) fixed = fixed.slice(0, -3) + '", });';
    else if (fixed.endsWith('});') ) fixed = fixed.slice(0,-3) + '", });';
    else fixed = fixed + '"';
    return fixed + (cr ? '\r' : '');
  }
  
  return line;
});

writeFileSync(file, correctedLines.join('\n'), 'utf8');
console.log(`Fixed ${fixCount} lines with odd quotes`);
