// check_529.mjs - 529번째 줄 주변 확인
import { readFileSync } from 'fs';
const file = 'c:/Users/ujin1/Desktop/MIGO/MigoApp/src/pages/DiscoverPage.tsx';
const lines = readFileSync(file, 'utf8').split('\n');
for (let i = 510; i < 540; i++) {
  console.log(i+1, ':', lines[i]?.slice(0, 100));
}
