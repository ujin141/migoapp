// check_115.mjs - 115번째 줄 확인
import { readFileSync } from 'fs';
const file = 'c:/Users/ujin1/Desktop/MIGO/MigoApp/src/pages/DiscoverPage.tsx';
const lines = readFileSync(file, 'utf8').split('\n');
for (let i = 110; i < 122; i++) {
  console.log(i+1, ':', lines[i]?.slice(0, 110));
}
