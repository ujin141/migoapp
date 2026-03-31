import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src', 'pages', 'ProfilePage.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the old StreakBadge at the bottom
content = content.replace(/\s*\{\/\* 스트릭 배지 \*\/\}\s*<div className="px-4 pb-3">\s*<StreakBadge data=\{streakData\} \/>\s*<\/div>/, '');

// 2. Inject it into the profile card header.
// We look for:
//           <div>
//             <h2 className="text-lg font-extrabold text-foreground">{name}</h2>
// And replace the wrapper so we can put the badge on the right side.

const target = `
          <div>
            <h2 className="text-lg font-extrabold text-foreground">{name}</h2>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={12} className="text-primary" />
`;

const replacement = `
          <div className="flex-1 min-w-0 pr-2 flex items-start justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold text-foreground truncate">{name}</h2>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={12} className="text-primary shrink-0" />
`;

// Also we need to inject the badge after the travelDates div closes.
const afterTarget = `
            <div className="flex items-center gap-1 mt-0.5">
              <Calendar size={12} className="text-primary" />
              <span className="text-xs text-muted-foreground">{travelDates}</span>
            </div>
          </div>
`;

const afterReplacement = `
            <div className="flex items-center gap-1 mt-0.5">
              <Calendar size={12} className="text-primary shrink-0" />
              <span className="text-xs text-muted-foreground truncate">{travelDates}</span>
            </div>
            </div>
            <div className="shrink-0 -mt-1 ml-2 scale-90 origin-top-right">
              <StreakBadge data={streakData} />
            </div>
          </div>
`;

if (content.includes(target) && content.includes(afterTarget)) {
   content = content.replace(target, replacement);
   content = content.replace(afterTarget, afterReplacement);
   fs.writeFileSync(file, content, 'utf8');
   console.log("Successfully patched ProfilePage.tsx");
} else {
   console.error("Target content not found in file!");
}
