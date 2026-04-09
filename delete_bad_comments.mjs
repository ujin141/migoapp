// delete_bad_comments.mjs - 손상된 한글 주석 줄 완전 삭제
// 주석 내에 ? 로 변환된 손상 문자가 많은 줄은 삭제
import { readFileSync, writeFileSync } from 'fs';

const file = 'c:/Users/ujin1/Desktop/MIGO/MigoApp/src/pages/DiscoverPage.tsx';
const text = readFileSync(file, 'utf8');
const lines = text.split('\n');
let deleteCount = 0;

const newLines = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // 주석 줄에서 ? 가 3개 이상 있으면 삭제 (손상된 한글 주석)
  if (trimmed.startsWith('//') && (trimmed.match(/\?/g) || []).length >= 3) {
    deleteCount++;
    console.log(`Deleted line ${i+1}:`, trimmed.slice(0, 60));
    continue;
  }
  
  // 인라인 주석에서 ? 가 많으면 주석 부분만 삭제
  const commentIdx = (() => {
    let inStr = false;
    for (let j = 0; j < line.length - 1; j++) {
      if (line[j] === '\\' && inStr) { j++; continue; }
      if (line[j] === '"') inStr = !inStr;
      if (!inStr && line[j] === '/' && line[j+1] === '/') return j;
    }
    return -1;
  })();
  
  if (commentIdx >= 0) {
    const commentPart = line.slice(commentIdx);
    if ((commentPart.match(/\?/g) || []).length >= 2) {
      deleteCount++;
      const codePart = line.slice(0, commentIdx).trimEnd();
      if (codePart) {
        newLines.push(codePart);
      }
      continue;
    }
  }
  
  newLines.push(line);
}

writeFileSync(file, newLines.join('\n'), 'utf8');
console.log(`Deleted/cleaned ${deleteCount} bad comment lines`);
console.log('Total lines:', newLines.length);

// 검증
const check = readFileSync(file, 'utf8').split('\n');
const line325idx = Math.min(324, check.length - 1);
console.log('Around line 325:');
for (let i = Math.max(0, line325idx - 2); i < Math.min(check.length, line325idx + 5); i++) {
  console.log(i+1, ':', check[i].slice(0, 80));
}
