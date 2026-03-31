import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, 'src', 'i18n', 'locales');

// Translations for the 3 missing payment keys + MigoPlus activation key
// payment.testMode, payment.group, payment.back
// auto.z_MigoPlus활성_1491
const translations = {
  ko: {
    testMode: '테스트 모드 — 실제 결제가 진행되지 않습니다.',
    group: '그룹',
    back: '뒤로',
    migoPlus: '👑 Migo Plus 활성화!'
  },
  en: {
    testMode: 'Test mode — no real payment is charged.',
    group: 'Group',
    back: 'Back',
    migoPlus: '👑 Migo Plus Activated!'
  },
  ja: {
    testMode: 'テストモード — 実際の決済は行われません。',
    group: 'グループ',
    back: '戻る',
    migoPlus: '👑 Migo Plusが有効になりました！'
  },
  zh: {
    testMode: '测试模式 — 不会进行实际付款。',
    group: '群组',
    back: '返回',
    migoPlus: '👑 Migo Plus 已激活！'
  },
  es: {
    testMode: 'Modo de prueba: no se realizará ningún pago real.',
    group: 'Grupo',
    back: 'Volver',
    migoPlus: '👑 ¡Migo Plus activado!'
  },
  fr: {
    testMode: 'Mode test — aucun paiement réel ne sera prélevé.',
    group: 'Groupe',
    back: 'Retour',
    migoPlus: '👑 Migo Plus activé !'
  },
  de: {
    testMode: 'Testmodus — Es wird keine echte Zahlung vorgenommen.',
    group: 'Gruppe',
    back: 'Zurück',
    migoPlus: '👑 Migo Plus aktiviert!'
  },
  pt: {
    testMode: 'Modo de teste — nenhum pagamento real será feito.',
    group: 'Grupo',
    back: 'Voltar',
    migoPlus: '👑 Migo Plus ativado!'
  },
  id: {
    testMode: 'Mode uji — tidak ada pembayaran nyata yang dikenakan.',
    group: 'Grup',
    back: 'Kembali',
    migoPlus: '👑 Migo Plus Aktif!'
  },
  vi: {
    testMode: 'Chế độ thử nghiệm — không có khoản thanh toán thực nào được thực hiện.',
    group: 'Nhóm',
    back: 'Quay lại',
    migoPlus: '👑 Migo Plus đã kích hoạt!'
  },
  th: {
    testMode: 'โหมดทดสอบ — ไม่มีการชำระเงินจริง',
    group: 'กลุ่ม',
    back: 'กลับ',
    migoPlus: '👑 Migo Plus เปิดใช้งานแล้ว!'
  },
  ar: {
    testMode: 'وضع الاختبار — لن يتم إجراء أي دفع حقيقي.',
    group: 'مجموعة',
    back: 'رجوع',
    migoPlus: '👑 تم تفعيل Migo Plus!'
  },
  hi: {
    testMode: 'परीक्षण मोड — कोई वास्तविक भुगतान नहीं किया जाएगा।',
    group: 'समूह',
    back: 'वापस',
    migoPlus: '👑 Migo Plus सक्रिय हो गया!'
  },
  ru: {
    testMode: 'Тестовый режим — реальная оплата не производится.',
    group: 'Группа',
    back: 'Назад',
    migoPlus: '👑 Migo Plus активирован!'
  },
  tr: {
    testMode: 'Test modu — gerçek ödeme yapılmaz.',
    group: 'Grup',
    back: 'Geri',
    migoPlus: '👑 Migo Plus etkinleştirildi!'
  },
  it: {
    testMode: 'Modalità test — nessun pagamento reale verrà addebitato.',
    group: 'Gruppo',
    back: 'Indietro',
    migoPlus: '👑 Migo Plus attivato!'
  },
  nl: {
    testMode: 'Testmodus — er wordt geen echte betaling gedaan.',
    group: 'Groep',
    back: 'Terug',
    migoPlus: '👑 Migo Plus geactiveerd!'
  },
  pl: {
    testMode: 'Tryb testowy — nie zostanie pobrana żadna rzeczywista opłata.',
    group: 'Grupa',
    back: 'Wróć',
    migoPlus: '👑 Migo Plus aktywowany!'
  },
  sv: {
    testMode: 'Testläge — ingen riktig betalning görs.',
    group: 'Grupp',
    back: 'Tillbaka',
    migoPlus: '👑 Migo Plus aktiverat!'
  },
  da: {
    testMode: 'Testtilstand — ingen rigtig betaling opkræves.',
    group: 'Gruppe',
    back: 'Tilbage',
    migoPlus: '👑 Migo Plus aktiveret!'
  },
  no: {
    testMode: 'Testmodus — ingen ekte betaling trekkes.',
    group: 'Gruppe',
    back: 'Tilbake',
    migoPlus: '👑 Migo Plus aktivert!'
  },
  fi: {
    testMode: 'Testitila — todellista maksua ei tehdä.',
    group: 'Ryhmä',
    back: 'Takaisin',
    migoPlus: '👑 Migo Plus aktivoitu!'
  },
  cs: {
    testMode: 'Testovací režim — žádná skutečná platba nebude provedena.',
    group: 'Skupina',
    back: 'Zpět',
    migoPlus: '👑 Migo Plus aktivován!'
  },
  ro: {
    testMode: 'Mod test — nu se va efectua nicio plată reală.',
    group: 'Grup',
    back: 'Înapoi',
    migoPlus: '👑 Migo Plus activat!'
  },
  hu: {
    testMode: 'Teszt mód — nem történik valódi fizetés.',
    group: 'Csoport',
    back: 'Vissza',
    migoPlus: '👑 Migo Plus aktiválva!'
  },
  el: {
    testMode: 'Λειτουργία δοκιμής — δεν πραγματοποιείται πραγματική πληρωμή.',
    group: 'Ομάδα',
    back: 'Πίσω',
    migoPlus: '👑 Migo Plus ενεργοποιήθηκε!'
  },
  bg: {
    testMode: 'Тестов режим — не се извършва реално плащане.',
    group: 'Група',
    back: 'Назад',
    migoPlus: '👑 Migo Plus активиран!'
  },
  uk: {
    testMode: 'Тестовий режим — реальна оплата не здійснюється.',
    group: 'Група',
    back: 'Назад',
    migoPlus: '👑 Migo Plus активовано!'
  },
  he: {
    testMode: 'מצב בדיקה — לא יתבצע תשלום אמיתי.',
    group: 'קבוצה',
    back: 'חזרה',
    migoPlus: '👑 Migo Plus הופעל!'
  },
  bn: {
    testMode: 'পরীক্ষা মোড — কোনো প্রকৃত অর্থপ্রদান করা হবে না।',
    group: 'গ্রুপ',
    back: 'ফিরে যান',
    migoPlus: '👑 Migo Plus সক্রিয় হয়েছে!'
  },
  ta: {
    testMode: 'சோதனை பயன்முறை — உண்மையான கட்டணம் எதுவும் வசூலிக்கப்படாது.',
    group: 'குழு',
    back: 'திரும்பு',
    migoPlus: '👑 Migo Plus செயல்படுத்தப்பட்டது!'
  },
  te: {
    testMode: 'పరీక్ష మోడ్ — నిజమైన చెల్లింపు జరగదు.',
    group: 'సమూహం',
    back: 'వెనుకకు',
    migoPlus: '👑 Migo Plus సక్రియం అయింది!'
  },
  kn: {
    testMode: 'ಪರೀಕ್ಷಾ ಮೋಡ್ — ನೈಜ ಪಾವತಿ ಮಾಡಲಾಗುವುದಿಲ್ಲ.',
    group: 'ಗುಂಪು',
    back: 'ಹಿಂದೆ',
    migoPlus: '👑 Migo Plus ಸಕ್ರಿಯಗೊಂಡಿದೆ!'
  },
  ml: {
    testMode: 'ടെസ്റ്റ് മോഡ് — യഥാർത്ഥ പേയ്‌മെന്റ് ഒന്നും ഈടാക്കില്ല.',
    group: 'ഗ്രൂപ്പ്',
    back: 'തിരികെ',
    migoPlus: '👑 Migo Plus സജീവമായി!'
  },
  gu: {
    testMode: 'ટેસ્ટ મોડ — કોઈ વાસ્તવિક ચુકવણી કરવામાં આવશે નહીં.',
    group: 'જૂથ',
    back: 'પાછળ',
    migoPlus: '👑 Migo Plus સক્રિય થઈ ગઈ!'
  },
  mr: {
    testMode: 'चाचणी मोड — कोणतेही वास्तविक पेमेंट केले जाणार नाही.',
    group: 'गट',
    back: 'मागे',
    migoPlus: '👑 Migo Plus सक्रिय झाला!'
  },
  pa: {
    testMode: 'ਟੈਸਟ ਮੋਡ — ਕੋਈ ਅਸਲ ਭੁਗਤਾਨ ਨਹੀਂ ਕੀਤਾ ਜਾਵੇਗਾ।',
    group: 'ਸਮੂਹ',
    back: 'ਵਾਪਸ',
    migoPlus: '👑 Migo Plus ਸਰਗਰਮ ਹੋ ਗਿਆ!'
  },
  fa: {
    testMode: 'حالت آزمایشی — هیچ پرداخت واقعی انجام نمی‌شود.',
    group: 'گروه',
    back: 'بازگشت',
    migoPlus: '👑 Migo Plus فعال شد!'
  },
  ur: {
    testMode: 'ٹیسٹ موڈ — کوئی حقیقی ادائیگی نہیں کی جائے گی۔',
    group: 'گروپ',
    back: 'واپس',
    migoPlus: '👑 Migo Plus فعال ہو گیا!'
  },
  sw: {
    testMode: 'Hali ya majaribio — hakuna malipo halisi yatakayochajiwa.',
    group: 'Kikundi',
    back: 'Rudi',
    migoPlus: '👑 Migo Plus imeamilishwa!'
  },
  zu: {
    testMode: 'Imodi yokuhlola — akukho inkokhelo yangempela ezonyezwa.',
    group: 'Iqembu',
    back: 'Buyela',
    migoPlus: '👑 Migo Plus isenziwe isebenze!'
  },
  ca: {
    testMode: 'Mode de prova: no es cobrarà cap pagament real.',
    group: 'Grup',
    back: 'Enrere',
    migoPlus: '👑 Migo Plus activat!'
  },
  hr: {
    testMode: 'Testni način — neće biti naplaćeno stvarno plaćanje.',
    group: 'Grupa',
    back: 'Natrag',
    migoPlus: '👑 Migo Plus aktiviran!'
  },
  sk: {
    testMode: 'Testovací režim — žiadna skutočná platba sa neuskutoční.',
    group: 'Skupina',
    back: 'Späť',
    migoPlus: '👑 Migo Plus aktivovaný!'
  },
  sl: {
    testMode: 'Testni način — ne bo zaračunano nobeno resnično plačilo.',
    group: 'Skupina',
    back: 'Nazaj',
    migoPlus: '👑 Migo Plus aktiviran!'
  },
  lv: {
    testMode: 'Testa režīms — faktisks maksājums netiks iekasēts.',
    group: 'Grupa',
    back: 'Atpakaļ',
    migoPlus: '👑 Migo Plus aktivizēts!'
  },
  lt: {
    testMode: 'Bandomasis režimas — realus mokėjimas nebus imamas.',
    group: 'Grupė',
    back: 'Atgal',
    migoPlus: '👑 Migo Plus aktyvuotas!'
  },
  et: {
    testMode: 'Testrežiim — reaalset makset ei võeta.',
    group: 'Grupp',
    back: 'Tagasi',
    migoPlus: '👑 Migo Plus aktiveeritud!'
  },
  is: {
    testMode: 'Prófunarhamur — engin raunveruleg greiðsla verður innheimt.',
    group: 'Hópur',
    back: 'Til baka',
    migoPlus: '👑 Migo Plus virkjað!'
  }
};

const files = readdirSync(localesDir).filter(f => f.endsWith('.ts'));

let updated = 0;
let skipped = 0;

for (const file of files) {
  const lang = file.replace('.ts', '');
  const t = translations[lang];
  
  if (!t) {
    console.log(`⚠️  No translations defined for: ${lang}`);
    skipped++;
    continue;
  }

  const filePath = join(localesDir, file);
  let content = readFileSync(filePath, 'utf-8');
  let changed = false;

  // ── 1. payment.testMode ──
  if (!content.includes('"testMode"')) {
    // Insert after "noMethod" line in payment section
    const noMethodPattern = /(["']noMethod["']\s*:\s*["'][^"']*["'])/;
    if (noMethodPattern.test(content)) {
      content = content.replace(
        noMethodPattern,
        `$1,\n    "testMode": "${t.testMode}",\n    "group": "${t.group}",\n    "back": "${t.back}"`
      );
      changed = true;
      console.log(`✅ Added payment.testMode/group/back to ${lang}.ts`);
    } else {
      console.log(`⚠️  Could not find noMethod in ${lang}.ts`);
    }
  } else {
    console.log(`⏭️  ${lang}.ts already has testMode`);
  }

  // ── 2. auto.z_MigoPlus활성_1491 ──
  // Check for both unicode-escaped and raw versions
  const hasKey1491 = content.includes('_1491') || content.includes('MigoPlus\\u');
  if (!hasKey1491) {
    // Insert after z_autozMigoP_1359 line
    const migoPattern = /(["']z_autozMigoP_1359["']\s*:\s*["'][^"']*["'])/;
    if (migoPattern.test(content)) {
      content = content.replace(
        migoPattern,
        `$1,\n    "z_MigoPlus\\uD65C\\uC131_1491": "${t.migoPlus}"`
      );
      changed = true;
      console.log(`✅ Added z_MigoPlus활성_1491 to ${lang}.ts`);
    } else {
      console.log(`⚠️  Could not find z_autozMigoP_1359 in ${lang}.ts`);
    }
  } else {
    console.log(`⏭️  ${lang}.ts already has _1491`);
  }

  if (changed) {
    writeFileSync(filePath, content, 'utf-8');
    updated++;
  }
}

console.log(`\n📊 Done: ${updated} files updated, ${skipped} skipped.`);
