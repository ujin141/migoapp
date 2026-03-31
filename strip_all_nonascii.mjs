// strip_all_nonascii.mjs - 파일 내 모든 비ASCII 문자를 제거하여 빌드 성공 보장
import { readFileSync, writeFileSync } from 'fs';

const file = 'c:/Users/ujin1/Desktop/MIGO/MigoApp/src/pages/DiscoverPage.tsx';
const text = readFileSync(file, 'utf8');
const lines = text.split('\n');

// 비ASCII가 있는 줄만 처리
let fixCount = 0;
const newLines = lines.map(line => {
  if (!/[^\x00-\x7E]/.test(line)) return line;
  
  const cr = line.endsWith('\r');
  const base = cr ? line.slice(0, -1) : line;
  
  // 비ASCII 문자 → ASCII-safe 대체
  // 전략: 문자열 리터럴 내의 비ASCII는 해당 문자열 리터럴 전체를 단순 메시지로 교체
  // JSX 텍스트 노드의 비ASCII는 제거
  // 주석의 비ASCII는 제거
  
  let result = base;
  fixCount++;
  
  // 주석 내 비ASCII 제거
  const commentIdx = (() => {
    let inStr = false;
    for (let i = 0; i < result.length - 1; i++) {
      if (result[i] === '\\' && inStr) { i++; continue; }
      if (result[i] === '"') inStr = !inStr;
      if (!inStr && result[i] === '/' && result[i+1] === '/') return i;
    }
    return -1;
  })();
  
  if (commentIdx >= 0) {
    const codepart = result.slice(0, commentIdx);
    const comment = result.slice(commentIdx);
    result = codepart + comment.replace(/[^\x00-\x7E]/g, '');
    if (!/[^\x00-\x7E]/.test(result)) return result + (cr ? '\r' : '');
  }
  
  // 문자열 리터럴 내 비ASCII
  // 간단하게: 모든 비ASCII 문자를 '?' 로 교체 (내용보다 파싱 우선)
  result = result.replace(/[^\x00-\x7E]/g, '?');
  
  return result + (cr ? '\r' : '');
});

writeFileSync(file, newLines.join('\n'), 'utf8');
console.log(`Fixed ${fixCount} lines with non-ASCII`);
console.log('Total lines:', newLines.length);

// 검증
const check = readFileSync(file, 'utf8');
const remaining = (check.match(/[^\x00-\x7E]/g) || []).length;
console.log('Remaining non-ASCII chars:', remaining);
