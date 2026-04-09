// byte_replace.mjs - 문자열 리터럴 내 비ASCII 바이트 ASCII로 교체
import { readFileSync, writeFileSync } from 'fs';

const file = 'c:/Users/ujin1/Desktop/MIGO/MigoApp/src/pages/DiscoverPage.tsx';

// 파일을 바이너리로 읽어 모든 비ASCII 바이트를 '?' 로 치환
// 단, 정상 UTF-8 한글(3바이트 시퀀스)은 그대로 둠
// 문제 있는 바이트: c2 + (bf이하)로 시작하는 손상된 2바이트 시퀀스
const buf = readFileSync(file);
const result = [];
let i = 0;
let replaced = 0;

while (i < buf.length) {
  const b = buf[i];
  
  // 유효한 UTF-8 시퀀스 판별
  let seqLen = 0;
  if ((b & 0x80) === 0) seqLen = 1; // ASCII
  else if ((b & 0xE0) === 0xC0) seqLen = 2; // 2바이트
  else if ((b & 0xF0) === 0xE0) seqLen = 3; // 3바이트 (한글 등)
  else if ((b & 0xF8) === 0xF0) seqLen = 4; // 4바이트
  else {
    // 유효하지 않은 시작 바이트 - '?' 로 교체
    result.push(0x3F); // '?'
    replaced++;
    i++;
    continue;
  }
  
  // 후속 바이트 검증
  let valid = true;
  for (let k = 1; k < seqLen; k++) {
    if (i + k >= buf.length || (buf[i+k] & 0xC0) !== 0x80) {
      valid = false;
      break;
    }
  }
  
  if (!valid) {
    result.push(0x3F); // '?'
    replaced++;
    i++;
    continue;
  }
  
  // 유효한 시퀀스 - 그대로 복사
  for (let k = 0; k < seqLen; k++) {
    result.push(buf[i + k]);
  }
  i += seqLen;
}

const newBuf = Buffer.from(result);
console.log(`Replaced ${replaced} invalid bytes. Size: ${buf.length} -> ${newBuf.length}`);
writeFileSync(file, newBuf);

// 검증: 여전히 비ASCII 있는지 확인
const check = readFileSync(file, 'utf8');
const nonAsciiLines = check.split('\n').filter((l, i) => /[^\x00-\x7E]/.test(l) && !l.trim().startsWith('//'));
console.log('Remaining non-ASCII code lines:', nonAsciiLines.length);
nonAsciiLines.slice(0, 5).forEach((l, i) => console.log(i, ':', l.slice(0,80)));
