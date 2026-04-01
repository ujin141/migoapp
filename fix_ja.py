import json
import re

ja_dict = {
  "dailyLikes": "デイリーライク",
  "free10": "10個",
  "unlimited": "無制限",
  "superLikes": "スーパーライク",
  "free3": "1日3回",
  "whoLikedMe": "足あと（いいねしてくれた人）",
  "hidden": "非公開",
  "allPublic": "全体公開",
  "profileBoost": "プロフィールブースト",
  "onePerMonth": "月1回提供",
  "advFilter": "詳細フィルター",
  "basicOnly": "基本のみ",
  "mbtiEtc": "MBTIなど",
  "globalMatch": "グローバルマッチング",
  "localOnly": "現地のみ",
  "worldwide": "世界中",
  "travelDNA": "旅行DNAレポート",
  "dnaFull": "5次元フル分析",
  "imHere": "今ここにいます",
  "standard": "一般表示",
  "pinned": "最上部固定",
  "readReceipt": "既読確認",
  "readCheck": "既読チェック",
  "hideLocation": "位置情報を隠す",
  "approxLoc": "大まかな位置のみ",
  "advSafety": "高度な安全センター",
  "basic": "基本",
  "emergency": "緊急連絡先",
  "premiumGroups": "プレミアムグループ",
  "plusBadge": "Plusバッジ",
  "profileDisplay": "プロフィール表示",
  "removeAds": "広告非表示",
  "hasAds": "広告あり",
  "noAds": "広告なし",
  "dnaDesc": "5次元傾向分析で最適な同行者をマッチング",
  "imHereDesc": "今ここにいます！旅行者に最優先で表示",
  "likedDesc": "いいねしてくれた人をすぐに確認・マッチング",
  "globalDesc": "世界中の現地旅行者と繋がる",
  "month1": "1ヶ月",
  "perMonth": "月",
  "month3": "3ヶ月",
  "popular": "人気",
  "month12": "12ヶ月",
  "bestValue": "最大割引",
  "total": "合計 ",
  "currentlyPlus": "現在Plusプラン利用中",
  "try7Days": "7日間の無料体験後 ",
  "start": " 開始",
  "cancelAnytime": "いつでもキャンセル可能です",
  "unlimitedCompanions": "旅行の同行者を無制限に探せる",
  "freeTrial": "✨ 7日間無料体験",
  "newFeatures": "✨ 新機能",
  "compare": "📊 無料 vs Plus",
  "moreFeatures": " 個の機能",
  "featuresTitle": "機能",
  "freeTitle": "無料",
  "likedMeTitle": "いいねされたリスト",
  "loginNeeded": "ログインが必要です。",
  "plusActive": "Migo Plus有効化",
  "plusActiveDesc": "すべてのプレミアム機能を利用できます！"
}

file_path = "src/i18n/migoPlusLocales.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# The file contains 'export const MIGO_PLUS_TRANSLATIONS: Record<string, Record<string, string>> = { JSON };'
json_str = content[content.find('{'):content.rfind('}')+1]
try:
    data = json.loads(json_str)
    data["ja"] = ja_dict
    new_content = f"export const MIGO_PLUS_TRANSLATIONS: Record<string, Record<string, string>> = {json.dumps(data, ensure_ascii=False, indent=2)};\n"
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Fixed Japanese translations.")
except Exception as e:
    print(f"Error parsing json: {e}")
