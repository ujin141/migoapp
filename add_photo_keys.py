#!/usr/bin/env python3
"""
profileSetup 섹션에 사진 최소 2장 관련 키 3개를 추가합니다.
- profileSetup.errPhoto
- profileSetup.photoRequired
- profileSetup.photoAddMore
- profileSetup.photoMinHint
"""

import os
import re

LOCALES_DIR = os.path.join(os.path.dirname(__file__), "src", "i18n", "locales")

# 각 언어별 번역 (구글 번역 기반)
TRANSLATIONS = {
    "ko": {
        "errPhoto":    "사진을 최소 2장 업로드해주세요",
        "photoRequired": "최소 2장 필수",
        "photoAddMore": "{n}장 더 추가",
        "photoMinHint": "프로필 사진을 최소 2장 업로드해야 합니다",
    },
    "en": {
        "errPhoto":    "Please upload at least 2 photos",
        "photoRequired": "Min. 2 required",
        "photoAddMore": "Add {n} more",
        "photoMinHint": "You must upload at least 2 profile photos",
    },
    "ja": {
        "errPhoto":    "写真を最低2枚アップロードしてください",
        "photoRequired": "最低2枚必須",
        "photoAddMore": "あと{n}枚追加",
        "photoMinHint": "プロフィール写真を最低2枚アップロードしてください",
    },
    "zh": {
        "errPhoto":    "请至少上传2张照片",
        "photoRequired": "至少需要2张",
        "photoAddMore": "再添加{n}张",
        "photoMinHint": "您必须至少上传2张个人资料照片",
    },
    "es": {
        "errPhoto":    "Por favor sube al menos 2 fotos",
        "photoRequired": "Mínimo 2 requeridas",
        "photoAddMore": "Añadir {n} más",
        "photoMinHint": "Debes subir al menos 2 fotos de perfil",
    },
    "fr": {
        "errPhoto":    "Veuillez télécharger au moins 2 photos",
        "photoRequired": "Min. 2 requises",
        "photoAddMore": "Ajouter {n} de plus",
        "photoMinHint": "Vous devez télécharger au moins 2 photos de profil",
    },
    "de": {
        "errPhoto":    "Bitte lade mindestens 2 Fotos hoch",
        "photoRequired": "Mind. 2 erforderlich",
        "photoAddMore": "{n} weitere hinzufügen",
        "photoMinHint": "Du musst mindestens 2 Profilfotos hochladen",
    },
    "pt": {
        "errPhoto":    "Por favor, carregue pelo menos 2 fotos",
        "photoRequired": "Mín. 2 obrigatórias",
        "photoAddMore": "Adicionar mais {n}",
        "photoMinHint": "Você deve fazer upload de pelo menos 2 fotos de perfil",
    },
    "ru": {
        "errPhoto":    "Пожалуйста, загрузите не менее 2 фотографий",
        "photoRequired": "Мин. 2 обязательно",
        "photoAddMore": "Добавить ещё {n}",
        "photoMinHint": "Необходимо загрузить не менее 2 фотографий профиля",
    },
    "ar": {
        "errPhoto":    "يرجى تحميل صورتين على الأقل",
        "photoRequired": "2 صور على الأقل مطلوبة",
        "photoAddMore": "أضف {n} أخرى",
        "photoMinHint": "يجب تحميل صورتين على الأقل للملف الشخصي",
    },
    "hi": {
        "errPhoto":    "कृपया कम से कम 2 फ़ोटो अपलोड करें",
        "photoRequired": "न्यूनतम 2 आवश्यक",
        "photoAddMore": "{n} और जोड़ें",
        "photoMinHint": "आपको कम से कम 2 प्रोफ़ाइल फ़ोटो अपलोड करनी होंगी",
    },
    "id": {
        "errPhoto":    "Harap unggah setidaknya 2 foto",
        "photoRequired": "Min. 2 diperlukan",
        "photoAddMore": "Tambahkan {n} lagi",
        "photoMinHint": "Anda harus mengunggah setidaknya 2 foto profil",
    },
    "th": {
        "errPhoto":    "กรุณาอัปโหลดอย่างน้อย 2 รูปภาพ",
        "photoRequired": "ต้องการอย่างน้อย 2 รูป",
        "photoAddMore": "เพิ่มอีก {n} รูป",
        "photoMinHint": "คุณต้องอัปโหลดรูปโปรไฟล์อย่างน้อย 2 รูป",
    },
    "vi": {
        "errPhoto":    "Vui lòng tải lên ít nhất 2 ảnh",
        "photoRequired": "Tối thiểu 2 ảnh bắt buộc",
        "photoAddMore": "Thêm {n} ảnh nữa",
        "photoMinHint": "Bạn phải tải lên ít nhất 2 ảnh hồ sơ",
    },
    "tr": {
        "errPhoto":    "Lütfen en az 2 fotoğraf yükleyin",
        "photoRequired": "En az 2 gerekli",
        "photoAddMore": "{n} tane daha ekle",
        "photoMinHint": "En az 2 profil fotoğrafı yüklemeniz gerekiyor",
    },
    "it": {
        "errPhoto":    "Carica almeno 2 foto",
        "photoRequired": "Min. 2 richieste",
        "photoAddMore": "Aggiungi altre {n}",
        "photoMinHint": "Devi caricare almeno 2 foto del profilo",
    },
    "nl": {
        "errPhoto":    "Upload minimaal 2 foto's",
        "photoRequired": "Min. 2 vereist",
        "photoAddMore": "Voeg {n} meer toe",
        "photoMinHint": "Je moet minimaal 2 profielfoto's uploaden",
    },
    "pl": {
        "errPhoto":    "Prześlij co najmniej 2 zdjęcia",
        "photoRequired": "Min. 2 wymagane",
        "photoAddMore": "Dodaj {n} więcej",
        "photoMinHint": "Musisz przesłać co najmniej 2 zdjęcia profilowe",
    },
    "sv": {
        "errPhoto":    "Ladda upp minst 2 bilder",
        "photoRequired": "Min. 2 krävs",
        "photoAddMore": "Lägg till {n} till",
        "photoMinHint": "Du måste ladda upp minst 2 profilbilder",
    },
    "no": {
        "errPhoto":    "Last opp minst 2 bilder",
        "photoRequired": "Min. 2 påkrevd",
        "photoAddMore": "Legg til {n} til",
        "photoMinHint": "Du må laste opp minst 2 profilbilder",
    },
    "da": {
        "errPhoto":    "Upload mindst 2 billeder",
        "photoRequired": "Min. 2 påkrævet",
        "photoAddMore": "Tilføj {n} mere",
        "photoMinHint": "Du skal uploade mindst 2 profilbilleder",
    },
    "fi": {
        "errPhoto":    "Lataa vähintään 2 kuvaa",
        "photoRequired": "Väh. 2 vaaditaan",
        "photoAddMore": "Lisää {n} lisää",
        "photoMinHint": "Sinun täytyy ladata vähintään 2 profiilikuvaa",
    },
    "hu": {
        "errPhoto":    "Kérjük, tölts fel legalább 2 fotót",
        "photoRequired": "Minimum 2 szükséges",
        "photoAddMore": "Adj hozzá {n} fotót",
        "photoMinHint": "Legalább 2 profilképet kell feltöltened",
    },
    "cs": {
        "errPhoto":    "Prosím nahrajte alespoň 2 fotografie",
        "photoRequired": "Min. 2 povinné",
        "photoAddMore": "Přidat {n} další",
        "photoMinHint": "Musíte nahrát alespoň 2 profilové fotografie",
    },
    "sk": {
        "errPhoto":    "Prosím nahrajte aspoň 2 fotografie",
        "photoRequired": "Min. 2 povinné",
        "photoAddMore": "Pridaj {n} ďalšie",
        "photoMinHint": "Musíte nahrať aspoň 2 profilové fotografie",
    },
    "ro": {
        "errPhoto":    "Vă rugăm să încărcați cel puțin 2 fotografii",
        "photoRequired": "Min. 2 necesare",
        "photoAddMore": "Adaugă {n} mai multe",
        "photoMinHint": "Trebuie să încărcați cel puțin 2 fotografii de profil",
    },
    "bg": {
        "errPhoto":    "Моля, качете поне 2 снимки",
        "photoRequired": "Мин. 2 задължителни",
        "photoAddMore": "Добавете още {n}",
        "photoMinHint": "Трябва да качите поне 2 снимки за профил",
    },
    "hr": {
        "errPhoto":    "Molimo učitajte najmanje 2 fotografije",
        "photoRequired": "Min. 2 obavezne",
        "photoAddMore": "Dodaj još {n}",
        "photoMinHint": "Morate učitati najmanje 2 fotografije profila",
    },
    "uk": {
        "errPhoto":    "Будь ласка, завантажте щонайменше 2 фотографії",
        "photoRequired": "Мін. 2 обов'язково",
        "photoAddMore": "Додати ще {n}",
        "photoMinHint": "Необхідно завантажити щонайменше 2 фотографії профілю",
    },
    "el": {
        "errPhoto":    "Παρακαλώ ανεβάστε τουλάχιστον 2 φωτογραφίες",
        "photoRequired": "Ελάχ. 2 απαιτούνται",
        "photoAddMore": "Προσθήκη {n} ακόμα",
        "photoMinHint": "Πρέπει να ανεβάσετε τουλάχιστον 2 φωτογραφίες προφίλ",
    },
    "he": {
        "errPhoto":    "אנא העלה לפחות 2 תמונות",
        "photoRequired": "מינימום 2 נדרשות",
        "photoAddMore": "הוסף עוד {n}",
        "photoMinHint": "עליך להעלות לפחות 2 תמונות פרופיל",
    },
    "fa": {
        "errPhoto":    "لطفاً حداقل ۲ عکس آپلود کنید",
        "photoRequired": "حداقل ۲ عکس الزامی",
        "photoAddMore": "{n} عکس دیگر اضافه کنید",
        "photoMinHint": "باید حداقل ۲ عکس پروفایل آپلود کنید",
    },
    "ur": {
        "errPhoto":    "براہ کرم کم از کم 2 تصاویر اپلوڈ کریں",
        "photoRequired": "کم از کم 2 ضروری",
        "photoAddMore": "{n} مزید شامل کریں",
        "photoMinHint": "آپ کو کم از کم 2 پروفائل تصاویر اپلوڈ کرنی ہوں گی",
    },
    "bn": {
        "errPhoto":    "অনুগ্রহ করে কমপক্ষে ২টি ছবি আপলোড করুন",
        "photoRequired": "ন্যূনতম ২টি প্রয়োজন",
        "photoAddMore": "আরও {n}টি যোগ করুন",
        "photoMinHint": "আপনাকে কমপক্ষে ২টি প্রোফাইল ছবি আপলোড করতে হবে",
    },
    "hi": {
        "errPhoto":    "कृपया कम से कम 2 फ़ोटो अपलोड करें",
        "photoRequired": "न्यूनतम 2 आवश्यक",
        "photoAddMore": "{n} और जोड़ें",
        "photoMinHint": "आपको कम से कम 2 प्रोफ़ाइल फ़ोटो अपलोड करनी होंगी",
    },
    "ta": {
        "errPhoto":    "குறைந்தது 2 புகைப்படங்களை பதிவேற்றவும்",
        "photoRequired": "குறைந்தது 2 தேவை",
        "photoAddMore": "மேலும் {n} சேர்க்கவும்",
        "photoMinHint": "குறைந்தது 2 சுயவிவர புகைப்படங்களை பதிவேற்ற வேண்டும்",
    },
    "te": {
        "errPhoto":    "దయచేసి కనీసం 2 ఫోటోలు అప్‌లోడ్ చేయండి",
        "photoRequired": "కనీసం 2 అవసరం",
        "photoAddMore": "మరో {n} జోడించండి",
        "photoMinHint": "మీరు కనీసం 2 ప్రొఫైల్ ఫోటోలు అప్‌లోడ్ చేయాలి",
    },
    "ml": {
        "errPhoto":    "ദയവായി കുറഞ്ഞത് 2 ഫോട്ടോകൾ അപ്‌ലോഡ് ചെയ്യുക",
        "photoRequired": "കുറഞ്ഞത് 2 ആവശ്യമാണ്",
        "photoAddMore": "ഇനിയും {n} ചേർക്കുക",
        "photoMinHint": "നിങ്ങൾ കുറഞ്ഞത് 2 പ്രൊഫൈൽ ഫോട്ടോകൾ അപ്‌ലോഡ് ചെയ്യണം",
    },
    "kn": {
        "errPhoto":    "ದಯವಿಟ್ಟು ಕನಿಷ್ಠ 2 ಫೋಟೋಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
        "photoRequired": "ಕನಿಷ್ಠ 2 ಅಗತ್ಯ",
        "photoAddMore": "ಇನ್ನಷ್ಟು {n} ಸೇರಿಸಿ",
        "photoMinHint": "ನೀವು ಕನಿಷ್ಠ 2 ಪ್ರೊಫೈಲ್ ಫೋಟೋಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಬೇಕು",
    },
    "gu": {
        "errPhoto":    "કૃપા કરીને ઓછામાં ઓછી 2 ફોટો અપલોડ કરો",
        "photoRequired": "ન્યૂનતમ 2 જરૂરી",
        "photoAddMore": "વધુ {n} ઉમેરો",
        "photoMinHint": "તમારે ઓછામાં ઓછી 2 પ્રોફાઇલ ફોટો અપલોડ કરવી પડશે",
    },
    "mr": {
        "errPhoto":    "कृपया किमान 2 फोटो अपलोड करा",
        "photoRequired": "किमान 2 आवश्यक",
        "photoAddMore": "आणखी {n} जोडा",
        "photoMinHint": "आपल्याला किमान 2 प्रोफाइल फोटो अपलोड करणे आवश्यक आहे",
    },
    "pa": {
        "errPhoto":    "ਕਿਰਪਾ ਕਰਕੇ ਘੱਟੋ-ਘੱਟ 2 ਫੋਟੋਆਂ ਅਪਲੋਡ ਕਰੋ",
        "photoRequired": "ਘੱਟੋ-ਘੱਟ 2 ਲੋੜੀਂਦੀਆਂ",
        "photoAddMore": "{n} ਹੋਰ ਜੋੜੋ",
        "photoMinHint": "ਤੁਹਾਨੂੰ ਘੱਟੋ-ਘੱਟ 2 ਪ੍ਰੋਫਾਈਲ ਫੋਟੋਆਂ ਅਪਲੋਡ ਕਰਨੀਆਂ ਚਾਹੀਦੀਆਂ ਹਨ",
    },
    "sw": {
        "errPhoto":    "Tafadhali pakia picha angalau 2",
        "photoRequired": "Angalau 2 zinahitajika",
        "photoAddMore": "Ongeza {n} zaidi",
        "photoMinHint": "Lazima upakue picha za wasifu angalau 2",
    },
    "zu": {
        "errPhoto":    "Sicela ulayishe izithombe ezingu-2 okungenani",
        "photoRequired": "Okungenani 2 ziyadingeka",
        "photoAddMore": "Engeza enye {n}",
        "photoMinHint": "Kufanele ulayishe izithombe zephrofayela ezingu-2 okungenani",
    },
    "lt": {
        "errPhoto":    "Prašome įkelti bent 2 nuotraukas",
        "photoRequired": "Min. 2 reikalaujama",
        "photoAddMore": "Pridėti {n} daugiau",
        "photoMinHint": "Turite įkelti bent 2 profilio nuotraukas",
    },
    "lv": {
        "errPhoto":    "Lūdzu, augšupielādējiet vismaz 2 fotoattēlus",
        "photoRequired": "Min. 2 nepieciešami",
        "photoAddMore": "Pievienot vēl {n}",
        "photoMinHint": "Jums jāaugšupielādē vismaz 2 profila fotoattēli",
    },
    "et": {
        "errPhoto":    "Palun laadi üles vähemalt 2 fotot",
        "photoRequired": "Min. 2 nõutav",
        "photoAddMore": "Lisa {n} lisaks",
        "photoMinHint": "Pead üles laadima vähemalt 2 profiilipilti",
    },
    "sl": {
        "errPhoto":    "Prosimo, naložite vsaj 2 fotografiji",
        "photoRequired": "Min. 2 zahtevani",
        "photoAddMore": "Dodaj še {n}",
        "photoMinHint": "Naložiti morate vsaj 2 profilni fotografiji",
    },
    "is": {
        "errPhoto":    "Vinsamlegast hladdu upp að minnsta kosti 2 myndum",
        "photoRequired": "Lágmark 2 krafist",
        "photoAddMore": "Bæta við {n} til viðbótar",
        "photoMinHint": "Þú verður að hlaða upp að minnsta kosti 2 prófílmyndum",
    },
    "ca": {
        "errPhoto":    "Si us plau, puja almenys 2 fotos",
        "photoRequired": "Mínim 2 requerides",
        "photoAddMore": "Afegeix-ne {n} més",
        "photoMinHint": "Has de pujar almenys 2 fotos de perfil",
    },
}

# 기본값 (위에 없는 언어는 영어 사용)
DEFAULT = TRANSLATIONS["en"]

def get_translation(lang, key):
    return TRANSLATIONS.get(lang, DEFAULT).get(key, DEFAULT[key])

def escape_ts(s):
    return s.replace("\\", "\\\\").replace('"', '\\"')

def process_file(filepath, lang):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 이미 키가 있으면 스킵
    if '"errPhoto"' in content or '"photoRequired"' in content:
        print(f"  SKIP (already exists): {lang}")
        return

    # "langDefault" 키 뒤에 삽입 (profileSetup 섹션의 마지막 키로 알려진)
    # 없으면 "start" 뒤에, 그것도 없으면 profileSetup 닫는 } 앞에
    err_photo    = escape_ts(get_translation(lang, "errPhoto"))
    photo_req    = escape_ts(get_translation(lang, "photoRequired"))
    photo_add    = escape_ts(get_translation(lang, "photoAddMore").replace("{n}", "{{n}}"))
    photo_hint   = escape_ts(get_translation(lang, "photoMinHint"))

    new_keys = (
        f'    "errPhoto": "{err_photo}",\n'
        f'    "photoRequired": "{photo_req}",\n'
        f'    "photoAddMore": "{photo_add}",\n'
        f'    "photoMinHint": "{photo_hint}",\n'
    )

    # langDefault 뒤에 삽입 시도
    anchor = '"langDefault"'
    if anchor in content:
        # langDefault 줄 끝 찾기
        idx = content.index(anchor)
        line_end = content.index("\n", idx)
        content = content[:line_end+1] + new_keys + content[line_end+1:]
        print(f"  OK (after langDefault): {lang}")
    else:
        # "start" 키 뒤 삽입
        anchor2 = '"start"'
        if anchor2 in content:
            # profileSetup 섹션 안에 있는 "start" 위치 찾기
            idx = content.index('"profileSetup"')
            start_idx = content.index(anchor2, idx)
            line_end = content.index("\n", start_idx)
            content = content[:line_end+1] + new_keys + content[line_end+1:]
            print(f"  OK (after start): {lang}")
        else:
            print(f"  WARN: anchor not found for {lang}, skipping")
            return

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

def main():
    files = sorted(os.listdir(LOCALES_DIR))
    for fname in files:
        if not fname.endswith(".ts"):
            continue
        lang = fname.replace(".ts", "")
        fpath = os.path.join(LOCALES_DIR, fname)
        print(f"Processing {lang}...")
        process_file(fpath, lang)
    print("\nDone!")

if __name__ == "__main__":
    main()
