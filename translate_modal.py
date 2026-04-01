import os
import time
import json
from googletrans import Translator

LANGUAGES = [
    "ko", "en", "ja", "zh", "es", "fr", "de", "pt", "id", "vi", "th",
    "ar", "hi", "ru", "tr", "it", "nl", "pl", "sv", "da", "no", "fi",
    "cs", "ro", "hu", "el", "bg", "uk", "he", "bn", "ta", "te", "kn",
    "ml", "gu", "mr", "pa", "fa", "ur", "sw", "zu", "ca", "hr", "sk",
    "sl", "lv", "lt", "et", "is"
]

# Map googletrans codes if needed
CODE_MAP = {
    "zh": "zh-cn",
    "he": "iw" # googletrans sometimes uses iw for hebrew
}

BASE_STRINGS = {
    "dailyLikes": "Daily Likes",
    "free10": "10 likes",
    "unlimited": "Unlimited",
    "superLikes": "Super Likes",
    "free3": "3 per day",
    "whoLikedMe": "Who Liked Me",
    "hidden": "Hidden",
    "allPublic": "All Public",
    "profileBoost": "Profile Boost",
    "onePerMonth": "1 per month",
    "advFilter": "Advanced Filters",
    "basicOnly": "Basic only",
    "mbtiEtc": "MBTI, etc.",
    "globalMatch": "Global Match",
    "localOnly": "Local only",
    "worldwide": "Worldwide",
    "travelDNA": "Travel DNA Report",
    "dnaFull": "Full 5D analysis",
    "imHere": "I'm Here Featured",
    "standard": "Standard",
    "pinned": "Pinned to top",
    "readReceipt": "Read Receipts",
    "readCheck": "Read check",
    "hideLocation": "Hide Location",
    "approxLoc": "Approx region",
    "advSafety": "Adv. Safety Center",
    "basic": "Basic",
    "emergency": "Emergency contacts",
    "premiumGroups": "Premium Groups",
    "plusBadge": "Plus Badge",
    "profileDisplay": "Profile display",
    "removeAds": "Remove Ads",
    "hasAds": "Has ads",
    "noAds": "No ads",
    "dnaDesc": "Optimum matching using 5D personality analysis",
    "imHereDesc": "Stand out natively to travelers right now!",
    "likedDesc": "See who liked you first and match instantly",
    "globalDesc": "Connect with local travelers worldwide",
    "month1": "1 month",
    "perMonth": "month",
    "month3": "3 months",
    "popular": "Popular",
    "month12": "12 months",
    "bestValue": "Best Value",
    "total": "Total ",
    "currentlyPlus": "Currently active Plus Plan",
    "try7Days": "Try 7 days free, then ",
    "start": " start",
    "cancelAnytime": "Cancel anytime",
    "unlimitedCompanions": "Unlimited travel companions",
    "freeTrial": "✨ 7-day free trial",
    "newFeatures": "✨ New Features",
    "compare": "📊 Free vs Plus",
    "moreFeatures": " more features",
    "featuresTitle": "Features",
    "freeTitle": "Free",
    "likedMeTitle": "Liked Me List",
    "loginNeeded": "Login is required.",
    "plusActive": "Migo Plus Activated",
    "plusActiveDesc": "You can now use all premium features!"
}

# we'll build a massive string with delimiter ' ||| '
# so we only make 1 translate call per language
keys = list(BASE_STRINGS.keys())
values = list(BASE_STRINGS.values())
text_to_translate = " ||| ".join(values)

translator = Translator()
result_dict = {}

KO_STRINGS = {
    "dailyLikes": "하루 라이크", "free10": "10개", "unlimited": "무제한",
    "superLikes": "슈퍼라이크", "free3": "3회/일",
    "whoLikedMe": "나를 좋아한 사람", "hidden": "숨김", "allPublic": "전체 공개",
    "profileBoost": "프로필 부스트", "onePerMonth": "1회/월 제공",
    "advFilter": "상세 필터", "basicOnly": "기본만", "mbtiEtc": "MBTI 등",
    "globalMatch": "글로벌 매칭", "localOnly": "현지만", "worldwide": "전 세계 여행",
    "travelDNA": "여행 DNA 리포트", "dnaFull": "5차원 풀 분석",
    "imHere": "지금 여기있어요", "standard": "일반 노출", "pinned": "최상단 고정",
    "readReceipt": "채팅 읽음 확인", "readCheck": "읽음 체크",
    "hideLocation": "위치 숨기기", "approxLoc": "대략 위치만",
    "advSafety": "고급 안전 센터", "basic": "기본", "emergency": "비상 연락처",
    "premiumGroups": "프리미엄 그룹",
    "plusBadge": "Plus 뱃지", "profileDisplay": "프로필 표시",
    "removeAds": "광고 제거", "hasAds": "광고 있음", "noAds": "광고 없음",
    "dnaDesc": "5차원 성향 분석으로 최적의 동행자 매칭",
    "imHereDesc": "지금 여기있어요! 가장 먼저 노출",
    "likedDesc": "먼저 라이크한 사람을 바로 확인·매칭",
    "globalDesc": "전 세계 어디서든 현지 여행자와 연결",
    "month1": "1개월", "perMonth": "월", "month3": "3개월", "popular": "인기",
    "month12": "12개월", "bestValue": "최대 할인", "total": "총 ",
    "currentlyPlus": "현재 Plus 플랜 이용 중", "try7Days": "7일 무료 체험 후 ",
    "start": " 시작", "cancelAnytime": "언제든지 취소할 수 있습니다.",
    "unlimitedCompanions": "여행 동행의 모든 것을 무제한으로", "freeTrial": "✨ 7일 무료 체험",
    "newFeatures": "✨ 새 기능", "compare": "📊 무료 vs Plus", "moreFeatures": "개 더보기",
    "featuresTitle": "기능", "freeTitle": "Free", "likedMeTitle": "내가 좋아요 받은 목록",
    "loginNeeded": "로그인이 필요합니다.",
    "plusActive": "Migo Plus 활성화",
    "plusActiveDesc": "모든 프리미엄 기능을 사용할 수 있습니다!"
}

result_dict["ko"] = KO_STRINGS
result_dict["en"] = BASE_STRINGS

print("Starting translations...")
for lang in LANGUAGES:
    if lang in ["ko", "en"]: continue
    
    g_lang = CODE_MAP.get(lang, lang)
    try:
        res = None
        for _ in range(3):
            try:
                res = translator.translate(text_to_translate, dest=g_lang, src='en')
                if res and "|||" in res.text:
                    break
            except Exception as e:
                time.sleep(1)
        
        if res and res.text:
            translated_parts = [part.strip() for part in res.text.split("|||")]
            lang_dict = {}
            if len(translated_parts) == len(keys):
                for i, k in enumerate(keys):
                    lang_dict[k] = translated_parts[i]
            else:
                lang_dict = BASE_STRINGS
                print(f"[{lang}] Fallback to base strings due to split mismatch {len(translated_parts)} != {len(keys)}")
                
            result_dict[lang] = lang_dict
        else:
            result_dict[lang] = BASE_STRINGS
            print(f"[{lang}] Fallback to base strings (No text)")
    except Exception as e:
        print(f"Failed {lang}: {e}")
        result_dict[lang] = BASE_STRINGS
        
    print(f"Translated {lang}")
    time.sleep(0.5)

ts_content = f"export const MIGO_PLUS_TRANSLATIONS: Record<string, Record<string, string>> = {json.dumps(result_dict, ensure_ascii=False, indent=2)};\n"

export_file_path = "src/i18n/migoPlusLocales.ts"
with open(export_file_path, "w", encoding="utf-8") as f:
    f.write(ts_content)

print(f"Sucessfully wrote translations to {export_file_path}")
