const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'src/pages/TripMatchPage.tsx');
let content = fs.readFileSync(p, 'utf8');

// 1. Imports
content = content.replace(
  'import { Settings2, ArrowLeft, RefreshCw, X, Shield, Gift, Zap, MapPin, Search } from "lucide-react";',
  'import { Settings2, ArrowLeft, RefreshCw, X, Shield, Gift, Zap, MapPin, Search, Languages, Share2, Calendar, Users, Clock } from "lucide-react";'
);
if (!content.includes('translateText')) {
  content = content.replace(
    'import { getChosung } from "@/lib/chosungUtils";',
    'import { getChosung } from "@/lib/chosungUtils";\nimport { translateText } from "@/lib/translateService";\nimport { TIER_LOCALES } from "@/i18n/tierLocales";'
  );
}

// 2. States and handleTranslate
if (!content.includes('detailGroup')) {
  content = content.replace(
    'const [isSearching, setIsSearching] = useState(false);',
    `const [isSearching, setIsSearching] = useState(false);

  const [detailGroup, setDetailGroup] = useState<TripGroup | null>(null);
  const [translateMap, setTranslateMap] = useState<Record<string, string>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const handleTranslate = useCallback(async (text: string, key: string) => {
    if (translateMap[key]) {
      setTranslateMap(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    setLoadingMap(prev => ({ ...prev, [key]: true }));
    try {
      const targetLang = i18n.language.split("-")[0] || "en";
      const res = await translateText({ text, targetLang: targetLang as any });
      setTranslateMap(prev => ({ ...prev, [key]: res }));
    } finally {
      setLoadingMap(prev => ({ ...prev, [key]: false }));
    }
  }, [i18n.language, translateMap]);`
  );
}

// 3. MatchCard onClickCard prop
content = content.replace(
  '<MatchCard \n                    key={result.group.id} \n                    result={result}',
  '<MatchCard \n                    key={result.group.id} \n                    result={result} \n                    onClickCard={(group) => setDetailGroup(group)}'
);

// 4. Update the pricing tier label to be localized
content = content.replace(
  '<div className="text-[10px] font-bold text-muted-foreground">{cfg.label}</div>',
  '<div className="text-[10px] font-bold text-muted-foreground">{TIER_LOCALES[i18n.language.split("-")[0] || "en"]?.tier?.[cfg.tier]?.label || cfg.label}</div>'
);

// 5. Append the overlay at the end right before the last closing tags
const modalCode = `
      {/* ── Group Detail Modal ── */}
      <AnimatePresence>
        {detailGroup && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed inset-0 z-50 bg-background overflow-y-auto"
          >
            <div className="px-5 pt-12 pb-32">
              <button
                onClick={() => setDetailGroup(null)}
                className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
              >
                <ArrowLeft size={16} />{t("auto.z_autoz목록으로3_766", {defaultValue: "Go Back"})}
              </button>

              <div className="bg-card rounded-2xl p-4 shadow-card mb-4 border border-border/40">
                <div className="flex items-center gap-3 mb-3">
                  {detailGroup.hostPhoto ? (
                    <img
                      src={detailGroup.hostPhoto}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {detailGroup.hostName?.[0] || "M"}
                    </div>
                  )}
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-extrabold text-foreground break-words whitespace-pre-wrap">
                      {translateMap[\`groupTitle_\${detailGroup.id}\`] || detailGroup.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{detailGroup.hostName}</p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">
                  {translateMap[\`groupDesc_\${detailGroup.id}\`] || detailGroup.description}
                </p>
                
                {detailGroup.description && (
                  <div className="mt-3 pt-3 border-t border-border/40">
                    <button 
                      onClick={() => {
                        handleTranslate(detailGroup.title, \`groupTitle_\${detailGroup.id}\`);
                        handleTranslate(detailGroup.description || "", \`groupDesc_\${detailGroup.id}\`);
                        if (detailGroup.destination) handleTranslate(detailGroup.destination, \`groupDest_\${detailGroup.id}\`);
                      }} 
                      className={\`text-[11px] font-bold flex items-center gap-1.5 transition-colors px-2 py-1 -ml-2 rounded-lg \${
                        translateMap[\`groupDesc_\${detailGroup.id}\`] 
                          ? "text-primary bg-primary/10" 
                          : "text-muted-foreground hover:bg-muted"
                      }\`}
                    >
                      <Languages size={12} className={loadingMap[\`groupDesc_\${detailGroup.id}\`] ? "animate-pulse" : ""} />
                      {loadingMap[\`groupDesc_\${detailGroup.id}\`] 
                        ? i18n.t("auto.z_번역중_000", { defaultValue: "Translating..." }) 
                        : translateMap[\`groupDesc_\${detailGroup.id}\`] 
                          ? i18n.t("auto.z_원문보기_001", { defaultValue: "Show original" }) 
                          : i18n.t("auto.z_번역보기_002", { defaultValue: "See translation" })
                      }
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-card rounded-2xl p-4 shadow-card mb-4 border border-border/40">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: t("auto.z_목적지_ffdbab", {defaultValue:"Destination"}), value: translateMap[\`groupDest_\${detailGroup.id}\`] || detailGroup.destination, icon: MapPin },
                    { label: t("auto.z_날짜_a93b53", {defaultValue:"Dates"}), value: detailGroup.dates, icon: Calendar },
                    { label: t("auto.z_인원수_553bc2", {defaultValue:"Members"}), value: \`\${detailGroup.currentMembers}/\${detailGroup.maxMembers}\`, icon: Users },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-2">
                      <Icon size={14} className="text-primary shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                        <p className="text-xs font-bold text-foreground">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
);`;

if (!content.includes('Group Detail Modal')) {
  // Replace the closing tags of the file
  content = content.replace(/    <\/div>\s*<\/div>\s*\);\s*}\s*$/, modalCode + "\n}");
}

fs.writeFileSync(p, content, 'utf8');
console.log('Fixed Trip Match JS');
