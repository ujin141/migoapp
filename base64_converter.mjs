import fs from 'fs';
try {
  const data = fs.readFileSync('migo-490902-a1769ab2cc19.json');
  const base64Str = data.toString('base64');
  fs.writeFileSync('base64_result.txt', base64Str);
  console.log('✅ 성공적으로 변환되었습니다! base64_result.txt 파일을 확인해주세요.');
} catch (e) {
  console.error('오류 발생:', e.message);
}
