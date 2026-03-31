/**
 * build_en.mjs
 * Builds en.ts from ko.ts:
 * 1. For keys in KNOWN_TRANSLATIONS (named namespace keys like nav, splash, etc.) - use hardcoded English
 * 2. For 'auto' namespace x-keys and z_autoz keys - use ENGLISH_OVERRIDES lookup
 * 3. For remaining auto keys - keep the value as-is (many are already English, numbers, emojis)
 * 
 * Strategy: Replace Korean text with English where known, preserve non-Korean values
 */
import fs from 'fs';

const ko = fs.readFileSync('./src/i18n/locales/ko.ts', 'utf8');

// Named namespace English translations
const NAMED_NS = {
  nav: {
    match: "Match", discover: "Discover", map: "Map", chat: "Chat", profile: "Profile"
  },
  splash: {
    tagline: "Find your next travel companion"
  },
  onboarding: {
    slide1Title: "Find Travel Companions",
    slide1Desc: "Match with travelers worldwide\nand start your journey together",
    slide2Title: "Real-time Travel Groups",
    slide2Desc: "Join various travel groups\nand create your own",
    slide3Title: "Safe & Fun Meetups",
    slide3Desc: "Meet verified travelers\nfor a safer travel experience",
    skip: "Skip", next: "Next", start: "Get Started"
  },
  login: {
    title: "Welcome to Migo", subtitle: "Meet your next travel companion",
    googleLogin: "Continue with Google", appleLogin: "Continue with Apple",
    emailLogin: "Continue with Email", terms: "By continuing, you agree to our",
    termsLink: "Terms", privacyLink: "Privacy Policy", and: "and",
    emailPlaceholder: "Enter your email", passwordPlaceholder: "Enter your password",
    loginBtn: "Log In", signupBtn: "Sign Up", forgotPassword: "Forgot password?",
    noAccount: "Don't have an account?", hasAccount: "Already have an account?"
  },
  profile: {
    edit: "Edit Profile", save: "Save", cancel: "Cancel",
    name: "Name", age: "Age", bio: "Bio", location: "Location",
    nationality: "Nationality", travelStyle: "Travel Style",
    photos: "Photos", addPhoto: "Add Photo",
    verification: "Verification", verified: "Verified",
    settings: "Settings", logout: "Log Out",
    deleteAccount: "Delete Account"
  },
  match: {
    title: "Match", like: "Like", pass: "Pass", superLike: "Super Like",
    matched: "It's a Match!", startChat: "Start Chatting",
    keepSwiping: "Keep Swiping", noMore: "No more profiles",
    filters: "Filters", distance: "Distance", age: "Age"
  },
  chat: {
    title: "Chats", searchPlaceholder: "Search conversations...",
    noChats: "No conversations yet", online: "Online", offline: "Offline",
    typing: "Typing...", deleteChat: "Delete conversation",
    translateFail: "Translation failed", sendFail: "Failed to send",
    unknownLocation: "Unknown location", locationPermErr: "Location permission denied"
  },
  alert: {
    t1Title: "Liked! 💚", t2Title: "Already matched!", t3Title: "Super Like sent! ⭐",
    t4Title: "Filters saved", t5Title: "Profile saved",
    t6Title: "Profile photo updated", t7Title: "Login required",
    t8Title: "Profile not found", t9Title: "Login failed",
    t10Title: "Login failed", t11Title: "Check-in complete",
    t12Title: "Check-out complete", t13Title: "Check-in failed",
    t14Title: "Error", t15Title: "Success",
    t16Title: "Error", t17Title: "Notification sent",
    t18Title: "Error", t19Title: "Saved",
    t20Title: "Error", t21Title: "Saved",
    t22Title: "📍 Location shared", t23Title: "Location not supported",
    t24Title: "Please fill in all fields", t25Title: "Schedule shared",
    t26Title: "Please fill in all fields", t27Title: "Meet proposal sent",
    t28Title: "Please select a reason", t29Title: "Report submitted",
    t29Desc: "We will review it within 24 hours.",
    t30Title: "Conversation deleted",
    t31Title: "Streak bonus! 🔥", t32Title: "Checked in!",
    t33Title: "Error", t34Title: "Processing...",
    t40Title: "Post submitted", t41Title: "Post deleted",
    t42Title: "Comment submitted", t43Title: "Error"
  },
  interest: {
    photo: "photo", food: "food", photoTrip: "photo trip",
    foodTour: "food tour", activity: "activity", nature: "nature",
    luxury: "luxury", local: "local", longTerm: "long term"
  },
  admin: {
    chatMonitor: "Chat Room Monitoring",
    chatMonitorDesc: "Manage active travel group chat rooms",
    refresh: "Refresh", allRooms: "Total Rooms", activeRooms: "Active Rooms",
    totalMembers: "Total Members", all: "All", active: "Active", inactive: "Inactive",
    unknown: "Unknown", noTitle: "No title",
    deactivateRoomConfirm: "Are you sure you want to deactivate this chat room?",
    deactivateRoom: "Deactivate room", viewMsg: "View messages",
    noRooms: "No chat rooms found", noMsg: "No messages found",
    persons: " members", creator: "Host:", today: "Today",
    daysAgoFormat: "{{days}} days ago", memberJoined: " members joined",
    newUser: "New Users", newGroup: "New Groups", newSignup: "New Signups"
  }
};

// English overrides for x4xxx, z_autoz, t50xx keys (auto namespace)
const AUTO_EN = {
  // Nearby page
  "x4040": "Nearby Travelers",
  "x4041": "travelers nearby!",
  "x4042": "Updating in real-time",
  "x4043": "Local",
  "x4044": "Online",
  "x4045": "No nearby travelers in this filter",
  "x4046": "Try different filters or check back later",
  "x4047": "Food & Dining",
  "x4048": "Sightseeing",
  "x4049": "Business",
  "x4050": "Local Friends",
  "x4051": "Tokyo, Shinjuku",
  "x4052": "Food & Dining",
  "x4053": "Food",
  "x4054": "Solo Travel",
  "x4055": "Night Views",
  "x4056": "On a Tokyo ramen tour!",
  "x4057": "Yuri",
  "x4058": "Tokyo, Harajuku",
  "x4059": "Sightseeing",
  "x4060": "Shopping",
  "x4061": "Aesthetic Cafes",
  "x4062": "Nice to meet you! 🙌",
  "x4063": "Tokyo, Shibuya",
  "x4064": "Business",
  "x4065": "Networking",
  "x4066": "Attending a tech conference",
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
  "x4089": "Traveler",
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
  "x4162": "Your travel review has been submitted.",
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
  "x4173": "(Optional)",
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
  // Profile page
  "x4006": "Leave review",
  "x4007": "This destination",
  // MatchPage banner / DM limit
  "t5001": "Today's likes used up! Come back tomorrow 🌟",
  "t5002": "Superlike! ⭐",
  "t5003": "Profile boost activated 🚀",
  "t5004": "Like cancelled",
  "t5005": "Already matched! Check your chats.",
  "t5006": "{{v0}} notifications unmuted",
  "t5007": "{{v0}} notifications muted",
  "t5008": "Free messages {{v0}}/{{v1}} - Unlimited with Plus",
  "t5034": "You matched with {{v0}}!",
  // GPS / nearby keys
  "p11": "📍 My current location\n{{loc}}\nhttps://maps.google.com/?q={{lat}},{{lng}}",
  "p12": "🗺️ Travel schedule shared\nWhen: {{date}}\nPlan: {{text}}",
  "p13": "📅 Meet proposal\nDate: {{date}}\nPlace: {{place}}",
  "p30": "{{dist}}m away",
  "p31": "Around {{city}} · Real-time updates",
  // Match page banner
  "m2001": "✈️ Travel tips for today",
  "m2002": "🔥 Hot destinations",
  // Plus modal feature comparison items
  "z_autoz하루라이크_1315": "Daily Likes",
  "z_autoz10개14_1316": "10",
  "z_autoz무제한14_1317": "Unlimited ♾️",
  "z_autoz슈퍼라이크_1318": "Super Like",
  "z_autoz3회주14_1319": "3/week",
  "z_autoz무제한14_1320": "Unlimited ⭐",
  "z_autoz나를좋아한_1321": "See who liked me",
  "z_autoz숨김145_1322": "❌ Hidden",
  "z_autoz전체공개1_1323": "✅ Visible",
  "z_autoz프로필부스_1324": "Profile Boost",
  "z_autoz1회월제공_1325": "1/month",
  "z_autoz상세필터1_1326": "Advanced Filter",
  "z_autoz기본만14_1327": "Basic only",
  "z_autozMBTI예_1328": "MBTI · Budget · Style",
  "z_autoz글로벌매칭_1329": "Global Matching",
  "z_autoz현지만14_1330": "Local only",
  "z_autoz전세계여행_1331": "Worldwide travelers",
  "z_autoz여행DNA_1332": "Travel DNA Report",
  "z_autoz5차원풀분_1333": "✅ 5-dimension analysis",
  "z_autoz지금여기있_1334": "Now Here Featured",
  "z_autoz일반노출1_1335": "Normal exposure",
  "z_autoz최상단고정_1336": "Top pinned 🔴",
  "z_autoz채팅읽음확_1337": "Chat read receipts",
  "z_autoz읽음체크1_1338": "✅ Read check",
  "z_autoz위치숨기기_1339": "Hide location",
  "z_autoz대략위치만_1340": "✅ Approximate only",
  "z_autoz고급안전체_1341": "Advanced safety check-in",
  "z_autoz기본147_1342": "Basic",
  "z_autoz비상연락처_1343": "Emergency contact auto-notify",
  "z_autoz프리미엄그_1344": "Join Premium Groups",
  "z_autoz무제한14_1345": "✅ Unlimited",
  "z_autozPlus뱃_1346": "Plus Badge",
  "z_autoz프로필표시_1347": "👑 Profile display",
  "z_autoz광고제거1_1348": "Remove Ads",
  "z_autoz광고있음1_1349": "Ads shown",
  "z_autoz광고없음1_1350": "✅ Ad-free",
  // Chat DM limit banner
  "z_autoz오늘메시지_879": "Today's message limit reached 🔒",
  "z_autoz업그레이드_881": "Upgrade",
  "z_autoz알림끔47_882": "Muted",
  "z_autoz오프라인4_883": "Offline",
  "z_autoz프로필보기_884": "View profile",
  "z_autoz알림켜기4_885": "Unmute notifications 🔔",
  "z_autoz알림끄기4_886": "Mute notifications 🔕",
  "z_autoz신고하기4_887": "Report",
  "z_autoz긴급SOS_888": "Emergency SOS",
  "z_autoz자동번역4_889": "Auto-translate",
  "z_autoz현재위치공_890": "📍 My current location",
  "z_autoz내현재위치_891": "📍 My current location",
  "z_autoz위치알수없_892": "Unknown location",
  "z_autoz지도열기4_893": "Open map →",
  "z_autoz만남제안4_894": "📅 Meet proposal",
  "z_autoz만남제안4_895": "📅 Meet proposal",
  "z_autoz날짜493_896": "Date: ",
  "z_autoz장소494_897": "Place: ",
  "z_autoz여행일정공_898": "🗺️ Travel schedule shared",
  "z_autoz우리의일정_899": "Our schedule",
  "z_autoz일시497_900": "When: ",
  "z_autoz내용498_901": "Plan: ",
  "z_autoz읽음499_902": "Read",
  "z_autoz번역중50_903": "Translating...",
  "z_autoz원문보기5_904": "View original",
  "z_autoz번역됨50_906": "Translated (",
  "z_autoz오늘메시지_907": "Today's message limit reached 🔒",
  "z_autozPlus로_908": "Upgrade to Plus for unlimited conversations.",
  "z_autoz위치506_909": "Location",
  "z_autoz제안507_910": "MeetUp",
  "z_autoz일정공유5_911": "Schedule",
  "z_autozPlus로_912": "🔒 Upgrade to Plus to continue chatting.",
  "z_autoz알림이꺼진_913": "🔕 Notifications off.",
  "z_autoz메시지입력_914": "Type a message...",
  "z_autoz만남제안5_915": "📅 MeetUp Proposal",
  "z_autoz날짜513_916": "Date",
  "z_autoz장소514_917": "Place",
  "z_autoz예카오산로_918": "e.g. Khao San Road entrance",
  "z_autoz제안보내기_919": "Send Proposal",
  "z_autoz일정공유하_920": "Share Schedule",
  "z_autoz언제할까요_921": "When?",
  "z_autoz예5월12_922": "e.g. May 12 at 2 PM",
  "z_autoz어떤일정인_923": "What's the plan?",
  "z_autoz예n카페투_924": "e.g.\\n- Cafe tour\\n- Night market",
  "z_autoz채팅방에일_925": "Share schedule to chat room",
  "z_autoz신고하기5_926": "Report",
  "z_autoz님을신고하_927": " - please select a reason",
  "z_autoz부적절한언_928": "Inappropriate language",
  "z_autoz스팸광고5_929": "Spam/Ads",
  "z_autoz허위프로필_930": "Fake profile",
  "z_autoz불쾌한내용_931": "Offensive content",
  "z_autoz기타529_932": "Other",
  // Match page / swipe banner
  "z_autoz잠시후다시_872": "Please try again later",
  // NowMoments & match tips
  "z_autoz여행자가있_1068": "New match! 🎉",
  "z_autoz새그룹멤버_1070": "👥 New group member",
  "z_autoz스트릭이끊_1072": "🔥 Streak about to break!",
  // Plus modal header/tabs
  "z_autoz여행동행의_1361": "Unlimited travel companions",
  "z_autoz7일무료체_1362": "7-day free trial",
  "z_autoz새기능14_1363": "✨ New Features",
  "z_autoz무료vsP_1364": "📊 Free vs Plus",
  "z_autoz개더무료v_1365": "More → Check 'Free vs Plus' tab",
  "z_autoz기능149_1366": "Feature",
  "z_autoz무료149_1367": "Free",
  "z_autoz총1500_1368": "Total",
  "z_autoz현재Plu_1369": "Currently on Plus subscription",
  "z_autoz7일무료후_1370": "After 7-day free trial",
  "z_autoz시작150_1371": "Start",
  "z_autoz언제든지취_1372": "Cancel anytime · Auto-renews · First 7 days free",
  // Subscription/pricing items
  "z_autoz여행DNA_1351": "Travel DNA Report",
  "z_autoz5차원성향_1352": "5D personality analysis for ideal companion matching",
  "z_autoz지금여기있_1353": "Now Here! Priority exposure",
  "z_autoz내가좋아요_1354": "Received Likes List",
  "z_autoz먼저라이크_1355": "Instantly see & match people who liked you first",
  "z_autoz글로벌매칭_1356": "Global Matching",
  "z_autoz전세계어디_1357": "Connect with local travelers anywhere in the world",
  "z_autoz로그인이필_1358": "Login required",
  "z_autozMigoP_1359": "👑 Migo Plus Activated!",
  "z_autoz모든프리미_1360": "All premium features are now available.",
  // Nearby "now here" banner
  "z_지금_135": "Now in ",
  "z_에_136": "",
  "z_명_137": " ",
};

// Build en.ts: start with named namespaces, then add the auto namespace
// by copying ko.ts auto namespace and replacing values per AUTO_EN

// Extract auto namespace from ko.ts
const koAutoMatch = ko.match(/"auto"\s*:\s*\{/);
if (!koAutoMatch) {
  console.error('No auto namespace in ko.ts');
  process.exit(1);
}

let autoStart = ko.indexOf('"auto"');
let braceOpen = ko.indexOf('{', autoStart);
let depth = 0, autoEnd = braceOpen;
for (let i = braceOpen; i < ko.length; i++) {
  if (ko[i] === '{') depth++;
  else if (ko[i] === '}') { depth--; if (depth === 0) { autoEnd = i; break; } }
}
const koAutoContent = ko.substring(braceOpen + 1, autoEnd);

// Replace Korean values in auto namespace using AUTO_EN overrides
// Also replace any remaining Korean strings with empty English fallback
let enAutoContent = koAutoContent;
const hasKorean = s => /[\uAC00-\uD7A3]/.test(s);

// Apply ALL known overrides
for (const [key, val] of Object.entries(AUTO_EN)) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('("' + escapedKey + '"\\s*:\\s*")[^"]*(")', 'g');
  enAutoContent = enAutoContent.replace(re, `$1${val.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}$2`);
}

// Count remaining Korean strings (for info)
const koMatches = enAutoContent.match(/:\s*"[^"]*[\uAC00-\uD7A3][^"]*"/g) || [];
console.log(`Remaining auto namespace Korean strings: ${koMatches.length}`);
// Show a sample of remaining Korean keys
const koSample = koMatches.slice(0, 10);
koSample.forEach(m => console.log(' ', m.trim().substring(0, 80)));

// Build named namespaces section
let namedSection = '';
for (const [ns, keys] of Object.entries(NAMED_NS)) {
  namedSection += `  "${ns}": {\n`;
  for (const [k, v] of Object.entries(keys)) {
    namedSection += `    "${k}": "${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}",\n`;
  }
  namedSection = namedSection.replace(/,\n$/, '\n');
  namedSection += `  },\n`;
}

// Build full en.ts
const enTs = `const en = {\n${namedSection}  "auto": {\n${enAutoContent}\n  }\n};\nexport default en;\n`;

fs.writeFileSync('./src/i18n/locales/en.ts', enTs, 'utf8');
console.log('en.ts written successfully');
console.log('Total size:', enTs.length, 'bytes');
