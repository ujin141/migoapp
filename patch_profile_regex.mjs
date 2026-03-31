import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src', 'pages', 'ProfilePage.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove bottom StreakBadge
content = content.replace(
  /\{\/\* 스트릭 배지 \*\/\}\r?\n\s*<div className="px-4 pb-3">\r?\n\s*<StreakBadge data=\{streakData\} \/>\r?\n\s*<\/div>\r?\n/g,
  ''
);

// 2. Replace top container opening
content = content.replace(
  /<div>\r?\n\s*<h2 className="text-lg font-extrabold text-foreground">\{name\}<\/h2>\r?\n\s*<div className="flex items-center gap-1 mt\.0\.5">\r?\n\s*<MapPin size=\{12\} className="text-primary" \/>/g,
`<div className="flex-1 min-w-0 pr-1 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold text-foreground truncate">{name}</h2>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={12} className="text-primary shrink-0" />`
);

// 3. Replace top container closing
content = content.replace(
  /<div className="flex items-center gap-1 mt\.0\.5">\r?\n\s*<Calendar size=\{12\} className="text-primary" \/>\r?\n\s*<span className="text-xs text-muted-foreground">\{travelDates\}<\/span>\r?\n\s*<\/div>\r?\n\s*<\/div>\r?\n\s*<\/div>/g,
`<div className="flex items-center gap-1 mt-0.5">
              <Calendar size={12} className="text-primary shrink-0" />
              <span className="text-xs text-muted-foreground truncate">{travelDates}</span>
            </div>
            </div>
            <div className="shrink-0 -mt-1 scale-[0.85] origin-top-right">
              <StreakBadge data={streakData} />
            </div>
          </div>
        </div>`
);

fs.writeFileSync(file, content, 'utf8');
console.log("Patched ProfilePage.tsx using RegEx");
