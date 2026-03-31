// check_529b.mjs - 529번째 줄 backtick 상태 확인
import { readFileSync } from 'fs';
const file = 'c:/Users/ujin1/Desktop/MIGO/MigoApp/src/pages/DiscoverPage.tsx';
const lines = readFileSync(file, 'utf8').split('\n');
const line = lines[528]; // 0-indexed = line 529
console.log('Line 529 raw:', JSON.stringify(line).slice(0,120));
const bt = (line.match(/`/g)||[]).length;
console.log('Backtick count:', bt);
// 529-533번째 줄
for (let i = 526; i < 534; i++) {
  console.log(i+1, ':', lines[i]?.slice(0,100));
}
