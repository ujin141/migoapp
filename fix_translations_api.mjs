import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';

// Manual .env loading to avoid missing dotenv dependency
const envVars = fs.readFileSync('.env.local', 'utf8').split(/\r?\n/);
for (const line of envVars) {
  const match = line.trim().match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2].trim();
}

const openai = new OpenAI({ apiKey: process.env.VITE_OPENAI_API_KEY });
const LOCALES_DIR = './src/i18n/locales';

const KEYS = {
  // notification
  "notification.title": {
    en: "Notifications", ko: "알림", ja: "通知", zh: "通知", es: "Notificaciones", fr: "Notifications"
  },
  "notification.empty": {
    en: "No notifications yet", ko: "아직 알림이 없어요", ja: "通知はまだありません", zh: "暂无通知"
  },
  "notification.emptyDesc": {
    en: "Find a travel companion!", ko: "새로운 여행 친구를 찾아보세요!", ja: "旅の仲間を見つけましょう！", zh: "去寻找旅行伙伴吧！"
  },
  "notification.unread": {
    en: "{{count}} unread", ko: "{{count}}개의 읽지 않은 알림", ja: "{{count}}件未読", zh: "{{count}}条未读"
  },
  "notification.markAll": {
    en: "Mark all read", ko: "모두 읽음", ja: "すべて既読", zh: "全部标读"
  },
  
  // discover section  
  "discover.groups": {
    en: "Travel Groups", ko: "여행 그룹", ja: "旅グループ", zh: "旅行群组"
  },
  "discover.community": {
    en: "Community", ko: "커뮤니티", ja: "コミュニティ", zh: "社区"
  },
  "discover.all": {
    en: "All", ko: "전체", ja: "全て", zh: "全部"
  },
  "discover.recruiting": {
    en: "Recruiting", ko: "모집 중", ja: "募集中", zh: "招募中"
  },
  "discover.almostFull": {
    en: "Almost Full", ko: "마감 임박", ja: "まもなく満員", zh: "快满了"
  },
  "discover.searchPlaceholder": {
    en: "Search by destination, travel style...", ko: "목적지, 여행 스타일 검색...", ja: "目的地、旅行スタイルを検索...", zh: "搜索目的地、旅行风格..."
  },
  
  // filter section
  "filter.genderAll": {
    en: "All", ko: "전체", ja: "全て", zh: "全部"
  },
  "filter.genderF": {
    en: "Female", ko: "여성", ja: "女性", zh: "女性"
  },
  "filter.genderM": {
    en: "Male", ko: "남성", ja: "男性", zh: "男性"
  },
  "filter.title": {
    en: "Filter Settings", ko: "필터 설정", ja: "フィルター設定", zh: "筛选设置"
  },
  "filter.distance": {
    en: "Distance Radius", ko: "거리 반경", ja: "距離半径", zh: "距离范围"
  },
  "filter.reset": {
    en: "Reset", ko: "초기화", ja: "リセット", zh: "重置"
  },
  "filter.apply": {
    en: "Apply", ko: "적용하기", ja: "適用", zh: "应用"
  },
  "filter.style": {
    en: "Travel Style", ko: "여행 스타일", ja: "旅行スタイル", zh: "旅行风格"
  },
  
  // match section
  "match.filterGender": {
    en: "Who to Meet", ko: "만남 대상", ja: "出会いたい相手", zh: "遇见对象"
  },
  "match.filterDist": {
    en: "Distance Radius", ko: "거리 반경", ja: "距離半径", zh: "距离范围"
  },
  "match.filterTitle": {
    en: "Filter Settings", ko: "필터 설정", ja: "フィルター設定", zh: "筛选设置"
  },
  "match.filterReset": {
    en: "Reset", ko: "초기화", ja: "リセット", zh: "重置"
  },
  "match.empty": {
    en: "You've seen all nearby travelers!", ko: "주변 여행자를 모두 확인했어요!", ja: "周辺の旅行者を全員確認しました！", zh: "已查看所有附近旅行者！"
  },
  "match.emptyDesc": {
    en: "New travelers will appear soon", ko: "새로운 여행자가 곧 등록될 거예요", ja: "新しい旅行者がまもなく現れます", zh: "新的旅行者即将出现"
  },
  
  // profile section
  "profile.title": {
    en: "Profile", ko: "프로필", ja: "プロフィール", zh: "个人资料"
  },
  "profile.editProfileBtn": {
    en: "Edit Profile", ko: "프로필 편집", ja: "プロフィール編集", zh: "编辑资料"
  },
  "profile.subDesc": {
    en: "Subscribe to Migo Plus for exclusive benefits.", ko: "Migo Plus를 구독하고 특별한 혜택을 받으세요.", ja: "Migo Plusに登録して特別な特典をご利用ください。", zh: "订阅Migo Plus享受独家福利。"
  },
  "profile.language": {
    en: "Language Settings", ko: "언어 설정", ja: "言語設定", zh: "语言设置"
  },
  
  // notif section (sometimes used directly)
  "notif.emptyDesc": {
    en: "Find a travel companion!", ko: "여행 친구를 찾아보세요!", ja: "旅の仲間を見つけましょう！", zh: "去寻找旅行伙伴吧！"
  }
};

const LANG_MAP = {
  ko: "Korean", en: "English", ja: "Japanese", zh: "Chinese (Simplified)", es: "Spanish", fr: "French",
  de: "German", pt: "Portuguese", id: "Indonesian", vi: "Vietnamese", th: "Thai", ar: "Arabic", hi: "Hindi",
  ru: "Russian", tr: "Turkish", it: "Italian", nl: "Dutch", pl: "Polish", sv: "Swedish", da: "Danish",
  no: "Norwegian", fi: "Finnish", cs: "Czech", ro: "Romanian", hu: "Hungarian", el: "Greek", bg: "Bulgarian",
  uk: "Ukrainian", he: "Hebrew", bn: "Bengali", ta: "Tamil", te: "Telugu", kn: "Kannada", ml: "Malayalam",
  gu: "Gujarati", mr: "Marathi", pa: "Punjabi", fa: "Persian", ur: "Urdu", sw: "Swahili", zu: "Zulu",
  ca: "Catalan", hr: "Croatian", sk: "Slovak", sl: "Slovenian", lv: "Latvian", lt: "Lithuanian",
  et: "Estonian", is: "Icelandic"
};

const localeFiles = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.ts'));

function injectIntoContent(originalContent, missingKeysObj) {
  let changed = false;
  let newContent = originalContent;

  for (const [dotPath, translatedVal] of Object.entries(missingKeysObj)) {
    const parts = dotPath.split('.');
    const section = parts[0];
    const subKey = parts.slice(1).join('.');
    
    // Ensure section exists
    const sectPattern = new RegExp('\"' + section + '\"\\s*:\\s*\\{');
    if (!sectPattern.test(newContent)) {
      let exportIdx = newContent.lastIndexOf('export default');
      if (exportIdx === -1) continue;
      
      let closingIdx = newContent.lastIndexOf('};', exportIdx);
      if (closingIdx === -1) {
        closingIdx = newContent.lastIndexOf('}', exportIdx);
      }
      
      let insertStr = ',\\n  "' + section + '": {\\n  }';
      newContent = newContent.substring(0, closingIdx) + insertStr + '\\n' + newContent.substring(closingIdx);
      changed = true;
    }

    // Identify section boundaries
    const sectionMatch = new RegExp('\"' + section + '\"\\s*:\\s*\\{', 'g').exec(newContent);
    if (!sectionMatch) continue;

    let sectStart = sectionMatch.index + sectionMatch[0].length;
    let depth = 1;
    let curr = sectStart;
    while(curr < newContent.length && depth > 0) {
      if(newContent[curr] === '{') depth++;
      else if(newContent[curr] === '}') depth--;
      curr++;
    }
    let sectEnd = curr - 1;
    
    let sectRegion = newContent.substring(sectStart, sectEnd);
    const escapedSubKey = subKey.replace(/\\./g, '\\\\.');
    const keyPattern = new RegExp('\"' + escapedSubKey + '\"\\s*:\\s*"(?:[^"\\\\\\\\]|\\\\\\\\.)*"(,?)');

    const escapedNative = translatedVal.replace(/\\/g, '\\\\\\\\').replace(/"/g, '\\\\\\"');

    if (keyPattern.test(sectRegion)) {
      // Key exists, optionally replace it. Let's replace to be sure it's accurate and not English fallback!
      let replacedRegion = sectRegion.replace(keyPattern, (match, comma) => '"' + subKey + '": "' + escapedNative + '"' + comma);
      if (replacedRegion !== sectRegion) {
        newContent = newContent.substring(0, sectStart) + replacedRegion + newContent.substring(sectEnd);
        changed = true;
      }
    } else {
      // Key missing, insert it
      let prevContent = newContent.substring(sectStart, sectEnd).trim();
      let prefix = prevContent.length > 0 && !prevContent.endsWith(',') ? ',' : '';
      let newEntry = prefix + '\\n    "' + subKey + '": "' + escapedNative + '"\\n  ';
      newContent = newContent.substring(0, sectEnd) + newEntry + newContent.substring(sectEnd);
      changed = true;
    }
  }
  return { newContent, changed };
}

async function run() {
  console.log("Starting translation sync pipeline...");
  let totalUpdated = 0;

  for (const file of localeFiles) {
    const lang = file.replace('.ts', '');
    const fp = path.join(LOCALES_DIR, file);
    let content = fs.readFileSync(fp, 'utf8');

    const missingKeysForLang = {};
    const keysToTranslate = {};
    
    // Check which keys need translation
    for (const [dotPath, transMap] of Object.entries(KEYS)) {
      if (transMap[lang]) {
        missingKeysForLang[dotPath] = transMap[lang];
      } else {
        // We will bulk translate all missing keys for this lang
        keysToTranslate[dotPath] = transMap['en'];
      }
    }

    if (Object.keys(keysToTranslate).length > 0) {
      console.log('Translating ' + Object.keys(keysToTranslate).length + ' keys for ' + lang + '...');
      try {
        const prompt = 'Translate the following English string keys into ' + (LANG_MAP[lang] || lang) + '. Return ONLY a raw JSON object string where the keys are exactly the same, and the values are the translated text. Do not wrap in markdown code blocks like ```json. Do not alter text inside {{ }}.\\n\\n' + JSON.stringify(keysToTranslate, null, 2);
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }]
        });
        
        let reply = response.choices[0].message.content.trim();
        if (reply.startsWith('\`\`\`json')) {
          reply = reply.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
        }
        if (reply.startsWith('\`\`\`')) {
          reply = reply.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
        }
        
        const translatedObj = JSON.parse(reply);
        Object.assign(missingKeysForLang, translatedObj);
        console.log('[+] Successfully translated for ' + lang);
      } catch (err) {
        console.error('[!] Error translating for ' + lang + ':', err.message);
        // Fallback to English if translation fails
        Object.assign(missingKeysForLang, keysToTranslate);
      }
    }

    const res = injectIntoContent(content, missingKeysForLang);
    let newContent = res.newContent;
    let changed = res.changed;
    
    if (changed) {
      fs.writeFileSync(fp, newContent, 'utf8');
      totalUpdated++;
      console.log('[v] Updated ' + file);
    } else {
      console.log('[-] No changes needed for ' + file);
    }
  }

  console.log('\\nPipeline complete. Updated ' + totalUpdated + ' files.');
}

run();
