import fs from 'fs';

const en = fs.readFileSync('./src/i18n/locales/en.ts', 'utf8');
const hasKorean = s => /[\uAC00-\uD7A3]/.test(s);

// Check keys visible in screenshots
const checkKeys = [
  'x4040','x4041','x4042','x4043','x4044','x4045','x4046',
  'x4047','x4048','x4049','x4050','x4051','x4052','x4053',
  'x4054','x4055','x4056','x4083','x4084','x4085','x4086',
  'x4087','x4088','x4089','x4090','x4091','x4092',
  // Chat DM limit banner keys
  'z_autoz오늘메시지_879','z_tmpl_477','z_tmpl_880',
  // Plus modal comparison keys (from screenshots)
  'z_autoz하루라이크_1315','z_autoz10개14_1316','z_autoz무제한14_1317',
  'z_autoz슈퍼라이크_1318','z_autoz3회주14_1319','z_autoz무제한14_1320',
  'z_autoz나를좋아한_1321',
];

console.log('=== KOREAN VALUES IN en.ts ===');
for (const k of checkKeys) {
  const re = new RegExp('"' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '":\\s*"([^"]+)"');
  const m = en.match(re);
  if (m) {
    const val = m[1];
    if (hasKorean(val)) {
      console.log('KOREAN: ' + k + ' = ' + val);
    } else {
      console.log('OK: ' + k + ' = ' + val.substring(0,50));
    }
  } else {
    console.log('MISSING: ' + k);
  }
}
