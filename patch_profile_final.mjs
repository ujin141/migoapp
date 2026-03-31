import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src', 'pages', 'ProfilePage.tsx');
let content = fs.readFileSync(file, 'utf8');

// Normalize CRLF to LF for reliable replacing
content = content.replace(/\r\n/g, '\n');

const bottomBadge = `      {/* 활동 리포트 */}
      <ActivityReport />

      {/* 스트릭 배지 */}
      <div className="px-4 pb-3">
        <StreakBadge data={streakData} />
      </div>`;

const bottomBadgeReplacement = `      {/* 활동 리포트 */}
      <ActivityReport />`;

content = content.replace(bottomBadge, bottomBadgeReplacement);

const topHeader = `        <div className="flex items-center gap-4">
          <div className="relative">
            {photoUrl ? <img src={photoUrl} alt="" className="w-20 h-20 rounded-2xl object-cover" onError={e => {
            // 로드 실패 시 숨기지 말고 gradient 배경+이름 첫 글자 fallback
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement?.querySelector('.photo-fallback')?.setAttribute('style', 'display:flex');
          }} /> : null}
            <div className="photo-fallback w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-black" style={{
            display: photoUrl ? 'none' : 'flex'
          }}>
              {name.charAt(0) || "M"}
            </div>
            {/* hidden file input */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
            const file = e.target.files?.[0];
            if (file) uploadPhoto(file);
            e.target.value = ""; // reset so same file can be reselected
          }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full gradient-primary flex items-center justify-center shadow-card transition-transform active:scale-90 disabled:opacity-60">
              {uploading ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera size={12} className="text-primary-foreground" />}
            </button>
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-foreground">{name}</h2>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={12} className="text-primary" />`;

const topHeaderReplacement = `        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {photoUrl ? <img src={photoUrl} alt="" className="w-20 h-20 rounded-2xl object-cover" onError={e => {
            // 로드 실패 시 숨기지 말고 gradient 배경+이름 첫 글자 fallback
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement?.querySelector('.photo-fallback')?.setAttribute('style', 'display:flex');
          }} /> : null}
            <div className="photo-fallback w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-black" style={{
            display: photoUrl ? 'none' : 'flex'
          }}>
              {name.charAt(0) || "M"}
            </div>
            {/* hidden file input */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
            const file = e.target.files?.[0];
            if (file) uploadPhoto(file);
            e.target.value = ""; // reset so same file can be reselected
          }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full gradient-primary flex items-center justify-center shadow-card transition-transform active:scale-90 disabled:opacity-60">
              {uploading ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera size={12} className="text-primary-foreground" />}
            </button>
          </div>
          <div className="flex-1 min-w-0 pr-1 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold text-foreground truncate">{name}</h2>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={12} className="text-primary shrink-0" />`;

const middleHeader = `            <div className="flex items-center gap-1 mt-0.5">
              <Calendar size={12} className="text-primary" />
              <span className="text-xs text-muted-foreground">{travelDates}</span>
            </div>
          </div>
        </div>`;

const middleHeaderReplacement = `            <div className="flex items-center gap-1 mt-0.5">
              <Calendar size={12} className="text-primary shrink-0" />
              <span className="text-xs text-muted-foreground truncate">{travelDates}</span>
            </div>
            </div>
            <div className="shrink-0 -mt-1 scale-[0.85] origin-top-right whitespace-nowrap">
              <StreakBadge data={streakData} />
            </div>
          </div>
        </div>`;

content = content.replace(topHeader, topHeaderReplacement);
content = content.replace(middleHeader, middleHeaderReplacement);

fs.writeFileSync(file, content, 'utf8');
console.log("Successfully patched using exact LF matches");
