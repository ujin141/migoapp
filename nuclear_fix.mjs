// nuclear_fix.mjs - DiscoverPage.tsx 파일 전체 손상 바이트 완전 제거
import { readFileSync, writeFileSync } from 'fs';

const file = 'c:/Users/ujin1/Desktop/MIGO/MigoApp/src/pages/DiscoverPage.tsx';
const buf = readFileSync(file);

console.log('Original size:', buf.length);
console.log('First 6 bytes:', [...buf.slice(0,6)].map(b => b.toString(16).padStart(2,'0')).join(' '));

// Step 1: BOM 제거
let start = 0;
if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
  start = 3;
  console.log('UTF-8 BOM removed');
}

// Step 2: 파일을 latin-1로 디코드 (바이트 보존)
const latin1 = buf.slice(start).toString('latin1');

// Step 3: 손상 패턴 찾기 - Ã¯Â¿Â½ (EF BF BD = U+FFFD가 latin-1로 읽혀서 UTF-8로 재인코딩된 것)
// latin-1에서 C3 AF C2 BF C2 BD 패턴 = Ã¯Â¿Â½
// 실제로 latin-1 문자열에서는 각 바이트가 문자 1개로 대응됨
// C3 = Ã, AF = ¯, C2 = Â, BF = ¿, C2 = Â, BD = ½
// 이 패턴은 UTF-8 U+FFFD (EF BF BD)가 또다시 UTF-8로 인코딩된 결과

// Step 4: latin-1 문자열을 줄로 분리하고, 각 줄에서 Latin-1 확장 문자(>127)를 제거
const lines = latin1.split('\n');

const cleanLines = lines.map((line, idx) => {
  // ASCII 범위(0-127) 이외의 문자를 제거하되
  // 줄 내 // 주석은 완전히 제거
  // JSX 문자열 리터럴 내의 한글은 유지 (별도 처리 필요)
  
  // 주석의 비ASCII 문자 제거
  const commentIdx = line.indexOf('//');
  if (commentIdx >= 0) {
    const codepart = line.slice(0, commentIdx);
    const comment = line.slice(commentIdx);
    // 주석 내 비ASCII 문자 제거
    const cleanComment = comment.replace(/[^\x00-\x7F]/g, '');
    if (cleanComment !== comment) {
      return codepart + cleanComment.trim() === '//' ? codepart.trimEnd() : codepart + cleanComment;
    }
  }
  return line;
});

// Step 5: 다시 합치고 UTF-8로 저장
// 각 라인에서 한글 문자열 리터럴은 Node.js가 string으로 처리할 때 올바르게 처리됨
// 실제로 저장할 때는 한글은 그대로 유지
const result = cleanLines.join('\n');

// 한글 문자열 리터럴 재복원이 필요: 현재 latin-1으로 읽은 한글 문자가 있음
// 79번째 줄의 filters 배열을 직접 대체
const finalLines = result.split('\n');
for (let i = 0; i < finalLines.length; i++) {
  const line = finalLines[i];
  // filters 배열 줄 찾아서 교체
  if (/^const filters = \[/.test(line.trim())) {
    finalLines[i] = 'const filters = ["\uC804\uCCB4", "\uBAA8\uC9D1 \uC911", "\uACE7 \uB9C8\uAC10", "\uC778\uAE30 \uAE09\uC0C1\uC2B9"];';
    console.log(`Replaced filters at line ${i+1}`);
  }
}

const finalText = finalLines.join('\n');
writeFileSync(file, finalText, 'utf8');
console.log('Saved as UTF-8 without BOM, size:', Buffer.from(finalText).length);

// 검증
const check = readFileSync(file, 'utf8').split('\n');
for (let i = 24; i < 32; i++) {
  console.log(`Line ${i+1}: ${check[i].slice(0,80)}`);
}
console.log('...');
for (let i = 77; i < 83; i++) {
  console.log(`Line ${i+1}: ${check[i]}`);
}
