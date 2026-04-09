/**
 * inject_en_profilepage.mjs
 * Reads the profilePage section from ko.ts and injects an English version into en.ts
 * Also checks other critical nested sections missing in en.ts
 */
import fs from 'fs';

// Read the profilePage section from ko.ts for structure reference
const koContent = fs.readFileSync('./src/i18n/locales/ko.ts', 'utf8');

// Extract profilePage section from ko.ts
function extractSection(content, sectionName) {
  const startIdx = content.indexOf(`"${sectionName}": {`);
  if (startIdx === -1) return null;
  
  let depth = 0;
  let i = content.indexOf('{', startIdx);
  const sectionStart = i;
  
  while (i < content.length) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        return content.substring(sectionStart, i + 1);
      }
    }
    i++;
  }
  return null;
}

// English profilePage translation (comprehensive)
const enProfilePage = `  "profilePage": {
    "photoChanged": "Profile photo updated!",
    "uploadFail": "Photo upload failed.",
    "saved": "Profile saved!",
    "tripStatus": {
      "active": "Active",
      "upcoming": "Upcoming",
      "completed": "Completed"
    },
    "features": {
      "trips": {
        "label": "Trip Planner",
        "desc": "Plan and manage your trips"
      },
      "calendar": {
        "label": "Travel Calendar",
        "desc": "Manage your travel schedule"
      },
      "diary": {
        "label": "Travel Diary",
        "desc": "Record your travel memories"
      },
      "market": {
        "label": "Migo Market",
        "desc": "Book tours and experiences"
      },
      "trust": {
        "label": "Trust Score",
        "desc": "Build your travel reputation"
      },
      "sos": {
        "label": "Safety Check-in",
        "desc": "SOS emergency notifications"
      }
    },
    "settings": {
      "notif": {
        "label": "Push Notifications",
        "desc": "Manage notification settings"
      },
      "chat": {
        "label": "Chat Settings",
        "desc": "Manage chat preferences"
      },
      "faqDesc": "Frequently asked questions",
      "helpDesc": "View Migo feature guide again"
    },
    "verified": "Verified",
    "upgradeTitle": "Upgrade to Plus",
    "boostFree": "Boost available ({{count}} left)",
    "boostOn": "Boosting ({{count}} left)",
    "boostNone": "Boost (Plus only)",
    "stats": {
      "matched": "Matched",
      "trips": "Trips",
      "meetings": "Meetings",
      "posts": "Posts"
    },
    "myPosts": "My Posts",
    "noPosts": "No posts yet",
    "goPost": "Start posting",
    "version": "Version Info",
    "refundPolicy": "Refund Policy",
    "licenseTitle": "Open Source Licenses",
    "profileEdit": "Edit Profile",
    "profilePhoto": "Profile Photo",
    "photoHint": "Use a clear front-facing photo",
    "labelName": "Name",
    "labelLocation": "Current Location",
    "labelDates": "Travel Dates",
    "labelBio": "Bio",
    "tagPlaceholder": "Add interest tag",
    "faq": {
      "title": "FAQ"
    },
    "menu": {
      "helpDesc": "View Migo feature guide again"
    }
  }`;

// Also check for other missing nested sections in en.ts
const enContent = fs.readFileSync('./src/i18n/locales/en.ts', 'utf8');

// Check which top-level sections ko has that en doesn't
const koTopLevelSections = [];
const koSectionRegex = /"(\w+)"\s*:\s*\{/g;
let match;
while ((match = koSectionRegex.exec(koContent)) !== null) {
  // Only first-level sections (roughly - check context)
  const before = koContent.substring(Math.max(0, match.index - 5), match.index);
  if (before.includes('\n') || match.index < 100) {
    koTopLevelSections.push(match[1]);
  }
}

console.log('Ko top level sections found:', koTopLevelSections.length);

// Check en.ts for profilePage
if (enContent.includes('"profilePage"')) {
  console.log('en.ts already has profilePage - skipping');
} else {
  // Inject profilePage before the closing of en object
  // Find the last key-value pair before }; at end
  const enLines = enContent.split('\n');
  
  // Find the line with the closing }; of the main object
  let insertIdx = -1;
  for (let i = enLines.length - 1; i >= 0; i--) {
    if (enLines[i].trim() === '};' || enLines[i].trim() === '}') {
      // Find the last '}' or ',' before this
      for (let j = i - 1; j >= 0; j--) {
        const trimmed = enLines[j].trim();
        if (trimmed.length > 0 && !trimmed.startsWith('//')) {
          // Add comma if not ending with comma
          if (!trimmed.endsWith(',') && !trimmed.endsWith('{')) {
            enLines[j] = enLines[j] + ',';
          }
          insertIdx = j + 1;
          break;
        }
      }
      break;
    }
  }
  
  if (insertIdx > 0) {
    enLines.splice(insertIdx, 0, enProfilePage);
    const newContent = enLines.join('\n');
    fs.writeFileSync('./src/i18n/locales/en.ts', newContent, 'utf8');
    console.log('✅ Injected profilePage section into en.ts');
  } else {
    console.error('Could not find insertion point in en.ts');
  }
}
