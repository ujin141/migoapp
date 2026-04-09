// check_356.mjs - 356번째 줄 확인
import { readFileSync } from 'fs';
const file = 'c:/Users/ujin1/Desktop/MIGO/MigoApp/src/pages/DiscoverPage.tsx';
const lines = readFileSync(file, 'utf8').split('\n');
for (let i = 352; i < 363; i++) {
  console.log(i+1, ':', lines[i]?.slice(0, 100));
}
