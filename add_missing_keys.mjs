import fs from 'fs';

const ko = fs.readFileSync('./src/i18n/locales/ko.ts', 'utf8');
const en = fs.readFileSync('./src/i18n/locales/en.ts', 'utf8');

// x4000~x4199 keys from ko.ts
const koKeys = {};
const re = /"(x4\d{3}|t50\d{2}|m\d+|p\d+)"\s*:\s*"([^"]+)"/g;
let m;
while ((m = re.exec(ko)) !== null) {
  koKeys[m[1]] = m[2];
}

// English translations for the visible Korean in screenshots
const ENGLISH_OVERRIDES = {
  // Nearby page
  "x4040": "Nearby Travelers",
  "x4041": "travelers nearby!",
  "x4042": "Updates in real-time",
  "x4043": "Local",
  "x4044": "Online",
  "x4045": "No nearby travelers in this category",
  "x4046": "Try changing filters or check back later",
  "x4047": "Food & Dining",
  "x4048": "Sightseeing",
  "x4049": "Business",
  "x4050": "Local Friends",
  "x4051": "Tokyo, Shinjuku",
  "x4052": "Food & Dining",
  "x4053": "Food",
  "x4054": "Solo Travel",
  "x4055": "Night View",
  "x4056": "On a Tokyo ramen tour!",
  "x4057": "Yuri",
  "x4058": "Tokyo, Harajuku",
  "x4059": "Sightseeing",
  "x4060": "Shopping",
  "x4061": "Aesthetic Cafe",
  "x4062": "Nice to meet you 🙌",
  "x4063": "Tokyo, Shibuya",
  "x4064": "Business",
  "x4065": "Networking",
  "x4066": "Attending a Tech conference",
  "x4067": "Sakura",
  "x4068": "Tokyo resident",
  "x4069": "Local Friends",
  "x4070": "Local Food",
  "x4071": "Hidden Spots",
  "x4072": "I'll show you Tokyo as a local!",
  "x4073": "Tokyo, Akihabara",
  "x4074": "Sightseeing",
  "x4075": "Anime",
  "x4076": "Figures",
  "x4077": "Anime pilgrimage 🎌",
  "x4078": "Tokyo Station",
  "x4079": "Food & Dining",
  "x4080": "Sushi",
  "x4081": "Yakitori",
  "x4082": "Trying all Japanese food",
  "x4083": "Nearby",
  "x4084": "Food & Dining",
  "x4085": "Sightseeing",
  "x4086": "Business",
  "x4087": "Local Friends",
  "x4088": "Local Friends",
  "x4089": "Sightseeing",
  "x4090": "All",
  "x4091": "💚 Liked!",
  "x4092": "I want to do this now!",
  "x4093": "I want to do this now (Travel Mission)",
  "x4094": "e.g. Looking for someone to eat dinner with tonight 🍜",
  "x4095": "MIGO Stamp Passport (Countries Visited)",
  "x4096": "Add countries visited worldwide",
  "x4097": "Traveler ✈️",
  "x4098": "Local Guide 🌴",
  "x4099": "My Travel Goal (Mission)",
  "x4100": "e.g. Anyone want to hit the night market together! 🍜",
  "x4101": "This purchase is for testing and no actual payment will be made.",
  "x4102": "Payment integration will be set up when the live service launches.",
  "x4103": "Cancel",
  "x4104": "Purchase",
  "x4105": "Subscription Plans & Item Purchase",
  "x4106": "The quality of travel companions",
  "x4107": "More connections,",
  "x4108": "Better travel 🌏",
  "x4109": "Upgrade to premium and",
  "x4110": "meet the best travel partner",
  "x4111": "Popular",
  "x4112": "Forever Free",
  "x4113": "10 likes per day",
  "x4114": "Basic profile viewing",
  "x4115": "Check Travel DNA compatibility",
  "x4116": "Browse group trips",
  "x4117": "/ month",
  "x4118": "Popular",
  "x4119": "Unlimited likes",
  "x4120": "Super Like 5x/month",
  "x4121": "Boost 1x/month",
  "x4122": "See who liked me",
  "x4123": "Global filter",
  "x4124": "No ads",
  "x4125": "/ month",
  "x4126": "Best Value",
  "x4127": "Includes all Plus benefits",
  "x4128": "Unlimited Super Likes",
  "x4129": "Boost 5x/month",
  "x4130": "Passport verification priority",
  "x4131": "Unlimited AI itinerary generation",
  "x4132": "Companion review badge highlight",
  "x4133": "Premium profile theme",
  "x4134": "Dedicated customer support",
  "x4135": "5 Super Likes",
  "x4136": "Delivered with special notification",
  "x4137": "5",
  "x4138": "15 Super Likes",
  "x4139": "More special connection opportunities",
  "x4140": "15",
  "x4141": "1 Boost",
  "x4142": "Profile shown at top for 30 minutes",
  "x4143": "30 min",
  "x4144": "5 Boosts",
  "x4145": "Experience maximum exposure effect",
  "x4146": "5x",
  "x4147": "Traveler Verified Badge",
  "x4148": "Trust UP! Eye-catching verification mark",
  "x4149": "Premium Profile Theme",
  "x4150": "Stand out with a special profile background",
  "x4151": "Traveler Starter Pack",
  "x4152": "10 Super Likes + 2 Boosts bundle",
  "x4153": "Nearby Travelers (7 days)",
  "x4154": "Connect with travelers in the same city now",
  "x4155": "7 days",
  "x4156": "Test purchase before live service launch.",
  "x4157": "💎 Subscription Plan",
  "x4158": "🛒 Item Purchase",
  "x4159": "Upgrade to Plus",
  "x4160": "Upgrade to Premium",
  "x4161": "Review Complete! 🎉",
  "x4162": "Your travel review with has been submitted.",
  "x4163": "Honest reviews create a better travel culture 💚",
  "x4164": "Find next travel partner →",
  "x4165": "Back to chat",
  "x4166": "Travel Companion Review",
  "x4167": "How was your trip?",
  "x4168": "Next",
  "x4169": "Select up to 5",
  "x4170": "Back",
  "x4171": "Next",
  "x4172": "Want to leave more feedback?",
  "x4173": "Optional",
  "x4174": "Back",
  "x4175": "Submit Review",
  "x4176": "Punctual ⏰",
  "x4177": "Easy to communicate 💬",
  "x4178": "Very considerate 💚",
  "x4179": "Great at planning 🗺️",
  "x4180": "Funny and fun 😄",
  "x4181": "Honest about costs 💰",
  "x4182": "Good at finding places 🔍",
  "x4183": "Would travel again ✈️",
  "x4184": "Similar food taste 🍜",
  "x4185": "Safety-conscious 🛡️",
  "x4186": "Not punctual ⏰",
  "x4187": "Communication was difficult 💬",
  "x4188": "Unclear about cost sharing 💰",
  "x4189": "Plans changed too often 📋",
  "x4190": "Didn't respect personal time 🚫",
  "x4191": "Disappointing",
  "x4192": "Not great",
  "x4193": "Okay",
  "x4194": "Good!",
  "x4195": "Amazing!!",
  "x4196": "Travel Partner",
  "x4197": "This trip",
  "x4198": ">What point",
  "x4199": "Was it disappointing?",
};

// Find where auto namespace closes in en.ts
const autoIdx = en.indexOf('"auto"');
if (autoIdx === -1) {
  console.error('auto namespace not found in en.ts');
  process.exit(1);
}
let depth = 0;
let autoOpen = en.indexOf('{', autoIdx);
let autoClose = autoOpen;
for (let i = autoOpen; i < en.length; i++) {
  if (en[i] === '{') depth++;
  else if (en[i] === '}') { depth--; if (depth === 0) { autoClose = i; break; } }
}

const autoBlock = en.substring(autoOpen + 1, autoClose);

// Find keys missing from en.ts auto namespace
const toAdd = [];
for (const [k, v] of Object.entries(ENGLISH_OVERRIDES)) {
  if (!autoBlock.includes('"' + k + '"')) {
    toAdd.push(`    "${k}": "${v.replace(/"/g, '\\"')}"`);
  }
}

if (toAdd.length > 0) {
  const insertion = ',\n' + toAdd.join(',\n') + '\n  ';
  const newEn = en.substring(0, autoClose) + insertion + en.substring(autoClose);
  fs.writeFileSync('./src/i18n/locales/en.ts', newEn, 'utf8');
  console.log(`Added ${toAdd.length} keys to en.ts auto namespace`);
} else {
  console.log('All keys already present in en.ts');
}

// Now sync the same English values to ALL non-ko locale files
import { readdirSync } from 'fs';
const files = readdirSync('./src/i18n/locales').filter(f => f.endsWith('.ts') && f !== 'ko.ts' && f !== 'en.ts');

let syncCount = 0;
for (const file of files) {
  const fp = './src/i18n/locales/' + file;
  let content = fs.readFileSync(fp, 'utf8');
  
  const aIdx = content.indexOf('"auto"');
  if (aIdx === -1) continue;
  
  let d = 0;
  let aOpen = content.indexOf('{', aIdx);
  let aClose = aOpen;
  for (let i = aOpen; i < content.length; i++) {
    if (content[i] === '{') d++;
    else if (content[i] === '}') { d--; if (d === 0) { aClose = i; break; } }
  }
  
  const aBlock = content.substring(aOpen + 1, aClose);
  const fileMissing = [];
  for (const [k, v] of Object.entries(ENGLISH_OVERRIDES)) {
    if (!aBlock.includes('"' + k + '"')) {
      fileMissing.push(`    "${k}": "${v.replace(/"/g, '\\"')}"`);
    }
  }
  
  if (fileMissing.length > 0) {
    const ins = ',\n' + fileMissing.join(',\n') + '\n  ';
    content = content.substring(0, aClose) + ins + content.substring(aClose);
    fs.writeFileSync(fp, content, 'utf8');
    syncCount++;
  }
}
console.log(`Synced ${toAdd.length} new keys to ${syncCount} locale files`);
