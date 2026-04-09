/**
 * Apple Sign In — Client Secret JWT 생성 스크립트
 * 사용법: node generate-apple-jwt.mjs
 *
 * 아래 4가지 값을 채워서 실행하세요.
 */
import { createSign } from 'crypto';
import { readFileSync } from 'fs';

// ────────────────────────────────────────────────
// ✏️  여기 4가지 값을 채우세요
// ────────────────────────────────────────────────
const TEAM_ID = '94XAL28D97';          // Apple Developer → Membership → Team ID (10자리)
const KEY_ID = 'PRF67MUH2D';          // 생성한 Key의 Key ID (10자리)
const CLIENT_ID = 'com.lunaticsgroup.migo.web'; // Services ID
const KEY_FILE = 'C:/Users/ujin1/Downloads/AuthKey_PRF67MUH2D.p8';     // 다운로드한 .p8 파일 경로
// ────────────────────────────────────────────────

const privateKey = readFileSync(KEY_FILE, 'utf8');

// JWT Header
const header = {
  alg: 'ES256',
  kid: KEY_ID,
};

// JWT Payload (유효기간 180일 = 6개월)
const now = Math.floor(Date.now() / 1000);
const payload = {
  iss: TEAM_ID,
  iat: now,
  exp: now + 15777000, // 6개월 (초)
  aud: 'https://appleid.apple.com',
  sub: CLIENT_ID,
};

// Base64URL 인코딩
const base64url = (obj) =>
  Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

const headerB64 = base64url(header);
const payloadB64 = base64url(payload);
const signingInput = `${headerB64}.${payloadB64}`;

// ES256 서명
const sign = createSign('SHA256');
sign.update(signingInput);
sign.end();
const signature = sign
  .sign({ key: privateKey, dsaEncoding: 'ieee-p1363' })
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=/g, '');

const jwt = `${signingInput}.${signature}`;

console.log('\n✅ Apple Client Secret JWT 생성 완료!\n');
console.log('📋 아래 JWT를 Supabase Secret Key 필드에 붙여넣으세요:\n');
console.log(jwt);
console.log('\n⚠️  이 JWT는 6개월(180일) 후 만료됩니다. 주기적으로 재생성하세요.\n');
