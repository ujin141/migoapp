import fs from 'fs';
import path from 'path';

const koPath = path.join(process.cwd(), 'src', 'i18n', 'locales', 'ko.ts');
let koStr = fs.readFileSync(koPath, 'utf8');
const koObj = (new Function('return (' + koStr.substring(koStr.indexOf('{'), koStr.lastIndexOf('}') + 1) + ')'))();

const enPath = path.join(process.cwd(), 'src', 'i18n', 'locales', 'en.ts');
let enStr = fs.readFileSync(enPath, 'utf8');
const enObj = (new Function('return (' + enStr.substring(enStr.indexOf('{'), enStr.lastIndexOf('}') + 1) + ')'))();

function getObj(file) {
  try {
    let s = fs.readFileSync(file, 'utf8');
    return (new Function('return (' + s.substring(s.indexOf('{'), s.lastIndexOf('}') + 1) + ')'))();
  } catch(e) { return {}; }
}
const oldKo = getObj('old_ko.ts');
const oldKo2 = getObj('old_ko2.ts');

const missingStr = fs.readFileSync('find_missing_keys.mjs', 'utf8'); // We won't use this, let's just use the known array:

const rawKeys = [
  "profile.subDesc", "profile.datePlaceholder", "profile.notifSaved", "profile.everyone", "profile.everyoneDesc", "profile.privacySaved",
  "profile.faq2q", "profile.faq2a", "profile.faq3q", "profile.faq3a", "profile.faq4q", "profile.faq4a", "profile.faq5q", "profile.faq5a",
  "profile.logoutDesc", "profile.cancel", "profile.matchList", "profile.noMatches", "profile.matchBadge", "profile.myTrips",
  "profile.statusOngoing", "profile.statusUpcoming", "profile.withdrawConfirmTitle", "profile.withdrawConfirmDesc1", "profile.withdrawConfirmDesc2",
  "profile.withdrawConfirm", "profile.termsTitle", "profile.termsEffective", "profile.terms1Title", "profile.terms1Content",
  "profile.terms2Title", "profile.terms2Content", "profile.terms3Title", "profile.terms3Content", "profile.terms4Title",
  "profile.terms4Content", "profile.terms5Title", "profile.terms5Content", "profile.terms6Title", "profile.terms6Content",
  "profile.terms7Title", "profile.terms7Content", "profile.terms8Title", "profile.terms8Content", "profile.terms9Title",
  "profile.terms9Content", "profile.terms10Title", "profile.terms10Content", "profile.companyInfo", "profile.companyName",
  "profile.ceo", "profile.managerName", "profile.email", "profile.privacyEffective", "profile.privacyIntro", "profile.privacy1Title",
  "profile.privacy1Content", "profile.privacy2Title", "profile.privacy2Content", "profile.privacy3Title", "profile.privacy3Content",
  "profile.privacy4Title", "profile.privacy4Content", "profile.privacy5Title", "profile.privacy5Content", "profile.privacy6Title",
  "profile.privacy6Content", "profile.privacy7Title", "profile.privacy7Content", "profile.privacy8Title", "profile.privacy8Content",
  "profile.privacyManager", "profile.ossIntro", "profile.ossOutro", "profileSetup.step5Title", "profileSetup.step5Sub",
  "profileSetup.errBio", "profileSetup.errStyle", "profileSetup.errRegion", "profileSetup.doneTitle", "profileSetup.doneDesc",
  "profileSetup.errSave", "profileSetup.errSaveDesc", "profileSetup.photoHint1", "profileSetup.photoHint2", "profileSetup.photoHint3",
  "profileSetup.bioLabel", "profileSetup.bioPlaceholder", "profileSetup.destLabel", "profileSetup.destPlaceholder",
  "profileSetup.dateLabel", "profileSetup.datePlaceholder", "profileSetup.maxFive", "profileSetup.regionsLabel", "profileSetup.multi",
  "profileSetup.langLabel", "profileSetup.selectAll", "profileSetup.preview", "profileSetup.me", "profileSetup.verified",
  "profileSetup.noBio", "profileSetup.mbtiSelect", "profileSetup.selectedMbti", "profileSetup.mbtiNotice", "profileSetup.start",
  "trip.colorRose", "trip.colorOrange", "trip.colorIndigo", "trip.colorEmerald", "trip.colorPurple", "trip.colorSky", "trip.fillAll",
  "trip.dateError", "trip.newTrip", "trip.destination", "trip.destPlaceholder", "trip.startDate", "trip.endDate", "trip.emoji",
  "trip.color", "trip.addBtn", "trip.anonymous", "trip.deleted", "trip.subtitle", "trip.tabMine", "trip.tabOverlap", "trip.noTrips",
  "trip.overlapTitle", "trip.overlapDesc", "trip.monthAvail", "trip.availNone", "trip.availOne", "trip.availTwo", "trip.availMany",
  "verif.phoneDesc", "verif.phoneBadge", "verif.emailLabel", "verif.emailDesc", "verif.emailBadge", "verif.idLabel", "verif.idDesc",
  "verif.idBadge", "verif.snsLabel", "verif.snsDesc", "verif.snsBadge", "verif.reviewLabel", "verif.reviewDesc", "verif.reviewBadge",
  "verif.scoreHighest", "verif.scoreHigh", "verif.scoreVerified", "verif.scoreBasic", "verif.scoreNone", "verif.next",
  "verif.timeoutError", "verif.otpError", "voice.connecting", "voiceCall.user", "voice.connected", "voice.ended", "voiceCall.speaker",
  "alert.login.passwordConfirm", "alert.login.passwordConfirmPlaceholder", "login.passwordConfirm", "login.passwordConfirmPlaceholder"
];

const recovered = {};

function tryGet(obj, strKey) {
  if (obj[strKey]) return obj[strKey];
  const parts = strKey.split('.');
  let cur = obj;
  for (const p of parts) { cur = cur ? cur[p] : undefined; }
  return cur;
}

for (const k of rawKeys) {
  let val = tryGet(oldKo, k) || tryGet(oldKo2, k);
  if (val) {
    recovered[k] = val;
  } else {
    // Failsafe: grab english to translate manually
    let enVal = tryGet(enObj, k);
    if (enVal) recovered[k] = "EN_FALLBACK:" + enVal;
    else recovered[k] = "UNKNOWN";
  }
}

fs.writeFileSync('recovered_nodes.json', JSON.stringify(recovered, null, 2));
console.log("Written " + Object.keys(recovered).length + " nodes to recovered_nodes.json");
