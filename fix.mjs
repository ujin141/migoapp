import fs from 'fs';

let content = fs.readFileSync('src/pages/AdminPage.tsx', 'utf8');

const target = `          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest md:flex-1">Admin Console</p>
          </div>
          <div className="md:hidden">
            <button onClick={() => setAuthed(false)} className="px-3 py-2 rounded-xl text-xs text-muted-foreground hover:bg-muted transition-colors flex items-center gap-2">
              <Lock size={12} /> Logout
            </button>
          
        </div>`;

const replacement = `          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest md:flex-1">Admin Console</p>
          </div>
          <div className="md:hidden">
            <button onClick={() => setAuthed(false)} className="px-3 py-2 rounded-xl text-xs text-muted-foreground hover:bg-muted transition-colors flex items-center gap-2">
              <Lock size={12} /> Logout
            </button>
          </div>
        </div>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/pages/AdminPage.tsx', content, 'utf8');
  console.log("Success");
} else {
  console.log("Target not found");
}
