import { execSync } from 'child_process';
import fs from 'fs';

const diff = execSync('git diff src/components/ src/pages/', { maxBuffer: 1024 * 1024 * 50 }).toString();
const lines = diff.split('\n');

const recovered = {};

// Hardcoded map for the manual replacements in extract script
const manualKeys = {
  'general.cancel': '취소',
  'verif.checkDone': '인증 확인 ✅',
  'map.distanceUnknown': '거리 미확인',
  'general.femaleOnly': '여성 전용',
  'general.sameSexOnly': '동성만',
  'general.anySex': '상관없음',
  'login.passwordConfirm': '비밀번호 확인',
  'login.passwordConfirmPlaceholder': '비밀번호를 다시 입력해주세요',
  'login.phoneNotice': '전화번호는 신원 확인 목적으로만 사용되며 다른 유저에게 공개되지 않아요. 1인 1계정 정책을 위해 필수예요.'
};

let i = 0;
while (i < lines.length) {
  if (lines[i].startsWith('-') && !lines[i].startsWith('---')) {
    const deleted = lines[i].substring(1);
    
    // Check if there is a corresponding '+' line within next 5 lines
    let addedLine = null;
    for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
      if (lines[j] && lines[j].startsWith('+') && !lines[j].startsWith('+++')) {
        addedLine = lines[j].substring(1);
        
        if (addedLine) {
          // 1. Toast handling
          if (deleted.includes('toast({') && addedLine.includes('toast({')) {
             const tMatch = addedLine.match(/t\("([^"]+Title)"\)/);
             if (tMatch) {
                 const key = tMatch[1];
                 const origT = deleted.match(/title:\s*(["'])(.+?)\1/);
                 if (origT) recovered[key] = origT[2];
             }
             const tdMatch = addedLine.match(/t\("([^"]+Desc)"\)/);
             if (tdMatch) {
                 const key = tdMatch[1];
                 const origD = deleted.match(/description:\s*(["'])(.+?)\1/);
                 if (origD) recovered[key] = origD[2];
             }
          }
          
          // 2. Confirm handling
          if (deleted.includes('window.confirm') && addedLine.includes('window.confirm')) {
             const cMatch = addedLine.match(/t\("([^"]+Confirm)"\)/);
             if (cMatch) {
                 const key = cMatch[1];
                 const origC = deleted.match(/confirm\((["'])(.+?)\1\)/);
                 if (origC) recovered[key] = origC[2];
             }
          }
        }
      }
    }
  }
  i++;
}

// Merge Manual
Object.assign(recovered, manualKeys);

fs.writeFileSync('recovered.json', JSON.stringify(recovered, null, 2), 'utf-8');
console.log('Recovered count:', Object.keys(recovered).length);
