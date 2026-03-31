// join_multiline_jsx.mjs - JSX에서 잘린 template literal 다중 줄을 단일 줄로 합치기
// 패턴: className={`...잘린 내용\n다음 줄 조건식\n ...}` 을 하나의 줄로
import { readFileSync, writeFileSync } from 'fs';

const file = 'c:/Users/ujin1/Desktop/MIGO/MigoApp/src/pages/DiscoverPage.tsx';
const text = readFileSync(file, 'utf8');
const lines = text.split('\n');

// JSX 속성에서 열린 template literal(` 로 끝나는 줄)을 찾아 다음 줄과 합침
// 종료 조건: `}` 가 닫힌 줄 (속성 값이 완전히 끝남)
let i = 0;
const newLines = [];
let fixCount = 0;

while (i < lines.length) {
  const line = lines[i];
  const cr = line.endsWith('\r');
  const base = cr ? line.slice(0, -1) : line;
  
  // JSX 속성에서 template literal이 열렸지만 닫히지 않은 패턴 검출
  // 조건: 줄에 ={` 가 있고, `} 로 닫히지 않은 경우
  // 또는 줄이 ` 로 끝나거나 ${로 끝나거나 $ 들어간 후 \n로 끊긴 경우
  const hasOpenTemplate = /=\{`/.test(base) || /^\s*`/.test(base);
  const hasSingleBacktick = (base.match(/`/g) || []).length % 2 !== 0;
  
  if (hasSingleBacktick && !base.trim().startsWith('//') && !base.trim().startsWith('*')) {
    // template literal이 이 줄에서 열렸지만 닫히지 않음
    // 다음 줄들을 읽어서 template literal이 닫힐 때까지 합침
    let combinedLine = base;
    let j = i + 1;
    let depth = (base.match(/`/g) || []).length; // 홀수면 닫히지 않음
    
    while (j < lines.length && depth % 2 !== 0) {
      const nextLine = lines[j];
      const nextBase = nextLine.endsWith('\r') ? nextLine.slice(0, -1) : nextLine;
      const nextBackticks = (nextBase.match(/`/g) || []).length;
      
      // 다음 줄의 내용을 합침 (공백 정규화)
      combinedLine = combinedLine + ' ' + nextBase.trim();
      depth += nextBackticks;
      j++;
    }
    
    if (j > i + 1) {
      // 여러 줄을 합쳤음
      fixCount++;
      newLines.push(combinedLine + (cr ? '\r' : ''));
      i = j;
      continue;
    }
  }
  
  newLines.push(line);
  i++;
}

writeFileSync(file, newLines.join('\n'), 'utf8');
console.log(`Joined ${fixCount} multiline template literals`);
console.log('Total lines:', newLines.length);
