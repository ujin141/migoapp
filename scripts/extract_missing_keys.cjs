#!/usr/bin/env node
// extract_missing_keys.js - 소스코드에서 누락된 i18n 키와 폴백 텍스트를 추출

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const pagesDir = path.join(srcDir, 'pages');
const compDir = path.join(srcDir, 'components');
const hooksDir = path.join(srcDir, 'hooks');
const contextDir = path.join(srcDir, 'context');

// ko.ts에서 이미 정의된 키 추출
const koFile = fs.readFileSync(path.join(srcDir, 'i18n/locales/ko.ts'), 'utf8');
const enFile = fs.readFileSync(path.join(srcDir, 'i18n/locales/en.ts'), 'utf8');

function extractDefinedKeys(content) {
  const keys = new Set();
  const regex = /"([a-zA-Z][a-zA-Z0-9_.]+)"\s*:/g;
  let m;
  while ((m = regex.exec(content))) keys.add(m[1]);
  return keys;
}

const koKeys = extractDefinedKeys(koFile);
const enKeys = extractDefinedKeys(enFile);

// 소스코드에서 t("key") 와 t("key", "fallback") 패턴 추출
function extractUsedKeys(dir) {
  const results = {};
  if (!fs.existsSync(dir)) return results;
  
  const files = [];
  function walk(d) {
    for (const f of fs.readdirSync(d)) {
      const full = path.join(d, f);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (f.endsWith('.tsx') || f.endsWith('.ts')) files.push(full);
    }
  }
  walk(dir);
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    // t("key", "fallback") 패턴
    const regex1 = /t\("([a-zA-Z][a-zA-Z0-9_.]+)"\s*,\s*"([^"]*)"\)/g;
    let m;
    while ((m = regex1.exec(content))) {
      if (!results[m[1]]) results[m[1]] = { fallback: m[2], file: path.basename(file) };
    }
    
    // t("key") 패턴 (폴백 없음)
    const regex2 = /t\("([a-zA-Z][a-zA-Z0-9_.]+)"\)/g;
    while ((m = regex2.exec(content))) {
      if (!results[m[1]]) results[m[1]] = { fallback: null, file: path.basename(file) };
    }
    
    // t('key', 'fallback') 패턴 (single quotes)
    const regex3 = /t\('([a-zA-Z][a-zA-Z0-9_.]+)'\s*,\s*'([^']*)'\)/g;
    while ((m = regex3.exec(content))) {
      if (!results[m[1]]) results[m[1]] = { fallback: m[2], file: path.basename(file) };
    }
    
    // t('key') 패턴
    const regex4 = /t\('([a-zA-Z][a-zA-Z0-9_.]+)'\)/g;
    while ((m = regex4.exec(content))) {
      if (!results[m[1]]) results[m[1]] = { fallback: null, file: path.basename(file) };
    }
  }
  return results;
}

const allKeys = {};
for (const dir of [pagesDir, compDir, hooksDir, contextDir]) {
  Object.assign(allKeys, extractUsedKeys(dir));
}

// 누락 키만 필터
const missingKo = {};
const missingEn = {};

for (const [key, info] of Object.entries(allKeys)) {
  if (!koKeys.has(key)) missingKo[key] = info;
  if (!enKeys.has(key)) missingEn[key] = info;
}

// 결과 출력
console.log(`\n=== ko.ts 누락: ${Object.keys(missingKo).length}개 ===`);
console.log(`=== en.ts 누락: ${Object.keys(missingEn).length}개 ===\n`);

// JSON 파일로 저장
fs.writeFileSync('/tmp/missing_ko.json', JSON.stringify(missingKo, null, 2));
fs.writeFileSync('/tmp/missing_en.json', JSON.stringify(missingEn, null, 2));

// 카테고리별 분류
const categories = {};
for (const [key, info] of Object.entries(missingKo)) {
  const cat = key.split('.')[0];
  if (!categories[cat]) categories[cat] = [];
  categories[cat].push({ key, ...info });
}

for (const [cat, items] of Object.entries(categories).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n--- ${cat} (${items.length}개) ---`);
  for (const item of items.slice(0, 5)) {
    console.log(`  "${item.key}": ${item.fallback ? `"${item.fallback}"` : '(no fallback)'} [${item.file}]`);
  }
  if (items.length > 5) console.log(`  ... +${items.length - 5}개 더`);
}
