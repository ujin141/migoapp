import fs from 'fs';

let content = fs.readFileSync('src/pages/AdminPage.tsx', 'utf8');

content = content.replace(
  '<div className="min-h-screen bg-background flex">',
  '<div className="min-h-screen bg-background flex flex-col md:flex-row">'
);

content = content.replace(
  '<aside className="w-60 shrink-0 bg-card border-r border-border flex flex-col sticky top-0 h-screen overflow-y-auto">',
  '<aside className="w-full md:w-60 shrink-0 bg-card border-b md:border-b-0 md:border-r border-border flex flex-col md:sticky top-0 md:h-screen overflow-x-auto md:overflow-y-auto">'
);

content = content.replace(
  '<div className="px-5 py-5 border-b border-border">',
  '<div className="px-5 py-5 border-b border-border flex justify-between items-center md:block min-w-max">'
);

content = content.replace(
  '<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Admin Console</p>',
  '<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest md:flex-1">Admin Console</p>\n          </div>\n          <div className="md:hidden">\n            <button onClick={() => setAuthed(false)} className="px-3 py-2 rounded-xl text-xs text-muted-foreground hover:bg-muted transition-colors flex items-center gap-2">\n              <Lock size={12} /> Logout\n            </button>\n          '
);

content = content.replace(
  '<img src={siteLogo} alt="Migo" className="h-9 object-contain mb-1" />',
  '<div>\n            <img src={siteLogo} alt="Migo" className="h-9 object-contain mb-1" />'
);

content = content.replace(
  '<nav className="flex-1 px-3 py-4 space-y-0.5">',
  '<nav className="flex md:flex-col px-3 py-2 md:py-4 gap-1 md:gap-0.5 overflow-x-auto overflow-y-hidden md:overflow-visible">'
);

content = content.replace(
  '<button key={item.id} onClick={() => setSection(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
  '<button key={item.id} onClick={() => setSection(item.id)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shrink-0 md:w-full'
);

content = content.replace(
  '<span className="flex-1 text-left">{item.label}</span>',
  '<span className="md:flex-1 text-left">{item.label}</span>'
);

content = content.replace(
  '<div className="px-3 py-4 border-t border-border">',
  '<div className="hidden md:flex flex-col px-3 py-4 border-t border-border mt-auto">'
);

content = content.replace(
  '<main className="flex-1 overflow-auto p-8 min-w-0">',
  '<main className="flex-1 overflow-auto p-4 md:p-8 min-w-0">'
);

fs.writeFileSync('src/pages/AdminPage.tsx', content, 'utf8');
console.log('patched');
