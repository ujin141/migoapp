import fs from 'fs';
import path from 'path';

function parseTsObject(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let clean = content.trim();
  clean = clean.replace(/^const\s+\w+\s*=\s*/, '');
  clean = clean.replace(/^export default\s+/, '');
  clean = clean.replace(/export default\s+\w+;?\s*$/, '');
  clean = clean.trim();
  if (clean.endsWith(';')) clean = clean.substring(0, clean.length - 1).trim();
  
  try {
    const obj = (new Function(`return (${clean})`))();
    return { obj, isKo: filePath.includes('ko.ts') };
  } catch (e) {
    console.error(`Error parsing ${filePath}:`, e.message);
    return null;
  }
}

function stringifyTsObject(obj, isKo) {
  if (isKo) {
    return `const ko = ${JSON.stringify(obj, null, 2)};\nexport default ko;\n`;
  } else {
    return `export default ${JSON.stringify(obj, null, 2)};\n`;
  }
}

const patches = {
  ko: {
    top: {
      "여행미션": "여행 미션",
      "미션플레이": "예: 오늘 저녁 혼자 먹기 싫은 맛집 같이 갈 사람 🍜",
      "여권": "MIGO 스탬프 여권 (방문 국가)",
      "국가선택": "국가 선택"
    },
    auto: {
      "g_main": "대표",
      "g_addphoto": "사진 추가",
      "g_travelstyle_tags": "여행 스타일 태그",
      "z_프로필테마_123": "프로필 테마"
    }
  },
  en: {
    top: {
      "여행미션": "Travel Mission",
      "미션플레이": "e.g. Someone to go to a popular restaurant with because I don't want to eat alone 🍜",
      "여권": "MIGO Stamp Passport (Visited Countries)",
      "국가선택": "Select Country"
    },
    auto: {
      "g_main": "Main",
      "g_addphoto": "Add Photo",
      "g_travelstyle_tags": "Travel Style Tags",
      "z_프로필테마_123": "Profile Theme"
    }
  },
  ja: {
    top: {
      "여행미션": "旅行ミッション",
      "미션플레이": "例：今日の夕食を一人で食べたくない人、一緒に美味しい店に行く人 🍜",
      "여권": "MIGOスタンプパスポート (訪問国)",
      "국가선택": "国を選択"
    },
    auto: {
      "g_main": "代表",
      "g_addphoto": "写真追加",
      "g_travelstyle_tags": "旅行スタイルタグ",
      "z_프로필테마_123": "プロフィールテーマ"
    }
  },
  zh: {
    top: {
      "여행미션": "旅行任务",
      "미션플레이": "例如：今天晚餐不想一个人吃，想一起去美食店的人 🍜",
      "여권": "MIGO盖章护照 (访问国家)",
      "국가선택": "选择国家"
    },
    auto: {
      "g_main": "代表",
      "g_addphoto": "添加照片",
      "g_travelstyle_tags": "旅行风格标签",
      "z_프로필테마_123": "个人资料主题"
    }
  }
};

const targetLangs = ['ko', 'en', 'ja', 'zh'];

targetLangs.forEach(lang => {
  const filePath = `src/i18n/locales/${lang}.ts`;
  console.log(`Patching ${filePath}...`);
  
  const parsed = parseTsObject(filePath);
  if (!parsed) {
    console.error(`Failed to parse ${filePath}`);
    return;
  }
  
  const { obj, isKo } = parsed;
  const patch = patches[lang];
  
  // Apply top-level patches
  for (const [key, value] of Object.entries(patch.top)) {
    obj[key] = value;
  }
  
  // Apply auto nested patches
  if (!obj.auto) {
    obj.auto = {};
  }
  for (const [key, value] of Object.entries(patch.auto)) {
    obj.auto[key] = value;
  }
  
  fs.writeFileSync(filePath, stringifyTsObject(obj, isKo), 'utf8');
  console.log(`Successfully patched and saved ${filePath}`);
});

console.log('All patches applied successfully!');
