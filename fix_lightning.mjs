import fs from 'fs';
import path from 'path';
import translate from 'translate-google';

const keysToTranslate = {
  "v2_tonight_vip": "🔥 오늘 저녁 술 모임 자동 매칭",
  "v2_tonight_desc": "버튼 한 번으로 근처 3~4명 랜덤 펍 번개",
  "v2_scan_msg": "내 주변 술 친구 탐색 중...",
  "v2_scan_sub": "반경 3km 이내의 접속자를 스캔합니다",
  "v2_vip_title": "VIP 맞춤 번개",
  "v2_vip_desc": "플러스 회원 전용 상세 매칭 필터",
  "v2_vip_age": "나이대 선호",
  "v2_age_20": "20대 초중반",
  "v2_age_late20": "20대 후반",
  "v2_age_30": "30대 이상",
  "v2_vip_lang": "사용 언어/국적",
  "v2_lang_ko": "한국어 위주",
  "v2_lang_global": "글로벌 믹스",
  "v2_vip_vibe": "원하는 분위기 (Vibe)",
  "v2_vibe_party": "파티/텐션업",
  "v2_vibe_chill": "잔잔한 딥톡",
  "v2_vibe_food": "로컬 감성",
  "v2_vip_scan": "맞춤형 스캔 시작",
  "v2_vip_preview": "미리 보고 선택하기",
  "v2_vip_select": "원하는 컨셉의 모임을 하나 선택하세요.",
  "v2_vip_premium": "PREMIUM",
  "v2_vip_enter": "여기로 입장",
  
  "v2_bar1_title": "🔥 미친 텐션 파티룸",
  "v2_bar1_1": "클럽 라운지",
  "v2_bar1_2": "프라이빗 라운지",
  
  "v2_bar2_title": "🍷 조용한 와인 딥톡",
  "v2_bar2_1": "고급 와인바",
  "v2_bar2_2": "시크릿 와인바",
  
  "v2_bar3_title": "🍜 감성 로컬 맛집",
  "v2_bar3_1": "현지인 맛집",
  "v2_bar3_2": "숨겨진 이자카야",
  
  "v2_basic_done": "매칭 완료!",
  "v2_cancel": "다음에 할게요",
  "v2_created": "방이 개설되었습니다! 즐거운 모임 되세요 🍻",
  "v2_error": "오류가 발생했습니다."
};

const localesDir = path.join(process.cwd(), 'src/i18n/locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.ts'));

function injectKeys(filePath, newKeysObj) {
  let content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes('"v2_tonight_vip"')) return false; // Already translated

  if (!content.includes('"auto": {')) {
    content = content.replace(/};\s*export default [^;]+;?\s*$/, (match) => {
       return `,\n  "auto": ${JSON.stringify(newKeysObj, null, 4)}\n${match}`;
    });
  } else {
    let keysString = "\n";
    for(const [k, v] of Object.entries(newKeysObj)) {
      keysString += `    "${k}": ${JSON.stringify(v)},\n`;
    }
    content = content.replace(/"auto":\s*\{/, `"auto": {` + keysString);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

async function run() {
  for (const file of files) {
    const langCode = file.replace('.ts', '').replace('_', '-');
    const filePath = path.join(localesDir, file);
    
    if (langCode === 'ko') {
      if (injectKeys(filePath, keysToTranslate)) {
        console.log(`Successfully injected base Korean to ko.ts`);
      }
      continue;
    }

    let c = fs.readFileSync(filePath, 'utf8');
    if (c.includes('"v2_tonight_vip"')) {
       console.log(`Skipping ${langCode}, already translated.`);
       continue;
    }

    console.log(`Processing ${langCode}...`);
    try {
      const translatedObj = {};
      for (const [k, text] of Object.entries(keysToTranslate)) {
        try {
          const res = await translate(text, { to: langCode });
          translatedObj[k] = res;
        } catch(e) {
          translatedObj[k] = text;
        }
      }
      injectKeys(filePath, translatedObj);
      console.log(`Successfully translated to ${langCode}`);
    } catch(err) {
      console.error(`Error on ${langCode}:`, err);
    }
  }
}
run();
