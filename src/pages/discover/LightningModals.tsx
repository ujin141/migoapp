import { AnimatePresence, motion } from "framer-motion";
import { Beer, Crown, X, MapPin } from "lucide-react";
import i18n from "@/i18n";

interface LightningModalsProps {
  showLightningLoading: boolean;
  lightningResult: any | null;
  setLightningResult: (res: any | null) => void;
  showVipLightningFilter: boolean;
  setShowVipLightningFilter: (show: boolean) => void;
  vipFilter: { age: string; language: string; vibe: string };
  setVipFilter: (filter: { age: string; language: string; vibe: string }) => void;
  executeLightningMatch: (isVipMode: boolean) => void;
  lightningMultiResult: any[] | null;
  setLightningMultiResult: (res: any[] | null) => void;
  confirmLightningMatch: (res?: any) => void;
}

export const LightningModals = ({
  showLightningLoading,
  lightningResult,
  setLightningResult,
  showVipLightningFilter,
  setShowVipLightningFilter,
  vipFilter,
  setVipFilter,
  executeLightningMatch,
  lightningMultiResult,
  setLightningMultiResult,
  confirmLightningMatch
}: LightningModalsProps) => {
  return (
    <>
      <AnimatePresence>
        {showLightningLoading && (
          <motion.div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
              <motion.div className="absolute inset-0 rounded-full border border-orange-500/30" animate={{ scale: [1, 2], opacity: [0.8, 0] }} transition={{ repeat: Infinity, duration: 2 }} />
              <motion.div className="absolute inset-4 rounded-full border border-orange-500/20" animate={{ scale: [1, 2], opacity: [0.6, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} />
              <motion.div className="absolute inset-8 rounded-full border border-orange-500/10" animate={{ scale: [1, 2], opacity: [0.4, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 1 }} />
              <motion.div className="w-24 h-24 rounded-full bg-orange-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.5)] border border-orange-500/50 relative z-10"
                animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                <Beer size={40} className="text-orange-400" fill="currentColor" />
              </motion.div>
            </div>
            <motion.h3 animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-xl font-black text-white mb-2 text-center">
              {i18n.t("auto.v2_scan_msg", "내 주변 매칭 탐색 중...")}
            </motion.h3>
            <p className="text-sm text-white/50 truncate">{i18n.t("auto.v2_scan_sub", "반경 3km 내의 핫플을 확인합니다")}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightningResult && (
          <motion.div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-sm bg-card rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-orange-500 to-amber-500 opacity-20" />
              
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-orange-500/30">
                  <Beer size={32} fill="currentColor" />
                </div>
                
                <h3 className="text-2xl font-black text-foreground mb-1 leading-tight tracking-tight truncate">
                  {i18n.t("auto.v2_basic_done", "매칭 완료!")}
                </h3>
                <p className="text-sm font-medium text-amber-600 mb-6 flex items-center justify-center gap-1">
                  <MapPin size={12} /> {lightningResult.barName}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                  {lightningResult.members.map((m: any, i: number) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <img src={m.photo} className="w-14 h-14 rounded-full object-cover border-4 border-background shadow-md" />
                      <span className="text-[10px] font-bold text-muted-foreground">{m.name}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  <button onClick={() => confirmLightningMatch()} className="w-full py-4 rounded-2xl text-white font-extrabold shadow-lg" style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }}>
                    {i18n.t("auto.v2_vip_enter", "여기로 입장")}
                  </button>
                  <button onClick={() => setLightningResult(null)} className="w-full py-4 rounded-2xl bg-muted text-muted-foreground font-bold hover:bg-muted/80 transition-hidden">
                    {i18n.t("auto.v2_cancel", "다음에 할게요")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVipLightningFilter && (
          <motion.div className="fixed inset-0 z-[110] flex items-center justify-center px-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowVipLightningFilter(false)} />
            <motion.div className="relative w-full max-w-sm bg-card rounded-3xl p-6 shadow-2xl overflow-hidden"
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}>
              
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-foreground flex items-center gap-2 truncate">
                    <Crown size={20} className="text-amber-500" /> {i18n.t("auto.v2_vip_title", "VIP 맞춤 번개")}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{i18n.t("auto.v2_vip_desc", "플러스 회원 전용 상세 매칭 필터")}</p>
                </div>
                <button onClick={() => setShowVipLightningFilter(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-foreground mb-2 block">{i18n.t("auto.v2_vip_age", "나이대 선호")}</label>
                  <div className="flex gap-2 truncate">
                    {["20s", "late20s", "30s"].map(a => (
                      <button key={a} onClick={() => setVipFilter({ ...vipFilter, age: a })} className={`flex-1 py-1.5 px-1 md:py-2 md:px-2 rounded-xl text-xs font-bold border transition-colors ${vipFilter.age === a ? 'bg-amber-500/15 border-amber-500/50 text-amber-500' : 'bg-muted/50 border-transparent text-muted-foreground'}`}>
                        {a === "20s" ? i18n.t("auto.v2_age_20", "20대 초중반") : a === "late20s" ? i18n.t("auto.v2_age_late20", "20대 후반") : i18n.t("auto.v2_age_30", "30대 이상")}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground mb-2 block">{i18n.t("auto.v2_vip_lang", "사용 언어/국적")}</label>
                  <div className="flex gap-2 truncate">
                    {["ko", "global"].map(l => (
                      <button key={l} onClick={() => setVipFilter({ ...vipFilter, language: l })} className={`flex-1 flex flex-col items-center py-3 rounded-xl border transition-colors ${vipFilter.language === l ? 'bg-blue-500/15 border-blue-500/50 text-blue-500' : 'bg-muted/50 border-transparent text-muted-foreground'}`}>
                        <span className="text-lg mb-1">{l === "ko" ? "🇰🇷" : "🌍"}</span>
                        <span className="text-xs font-bold truncate">{l === "ko" ? i18n.t("auto.v2_lang_ko", "한국어 위주") : i18n.t("auto.v2_lang_global", "글로벌 믹스")}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground mb-2 block">{i18n.t("auto.v2_vip_vibe", "원하는 분위기 (Vibe)")}</label>
                  <div className="grid grid-cols-3 gap-2 truncate">
                    {["party", "chill", "food"].map(v => (
                      <button key={v} onClick={() => setVipFilter({ ...vipFilter, vibe: v })} className={`py-3 rounded-xl flex flex-col items-center gap-1 border transition-colors ${vipFilter.vibe === v ? 'bg-pink-500/15 border-pink-500/50 text-pink-500' : 'bg-muted/50 border-transparent text-muted-foreground'}`}>
                        <span>{v === "party" ? "🎉" : v === "chill" ? "🥂" : "🍜"}</span>
                        <span className="text-[10px] font-bold truncate">{v === "party" ? i18n.t("auto.v2_vibe_party", "파티/텐션업") : v === "chill" ? i18n.t("auto.v2_vibe_chill", "잔잔한 딥톡") : i18n.t("auto.v2_vibe_food", "로컬 감성")}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={() => executeLightningMatch(true)} className="w-full mt-8 py-4 rounded-2xl text-white font-extrabold shadow-lg" style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }}>
                {i18n.t("auto.v2_vip_scan", "맞춤형 스캔 시작")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightningMultiResult && (
          <motion.div className="fixed inset-0 z-[120] flex flex-col justify-end bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-card rounded-t-3xl pt-6 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] w-full max-w-lg mx-auto shadow-float"
              initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ type: "spring", damping: 25, stiffness: 200 }}>
              <div className="px-6 mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-foreground flex items-center gap-2 truncate">
                    {i18n.t("auto.v2_vip_preview", "미리 보고 선택하기")} <Crown size={16} className="text-amber-500" />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{i18n.t("auto.v2_vip_select", "원하는 컨셉의 모임을 하나 선택하세요.")}</p>
                </div>
                <button onClick={() => setLightningMultiResult(null)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>

              <div className="flex gap-4 px-6 overflow-x-auto scrollbar-hide pb-4 snap-x truncate">
                {lightningMultiResult.map(res => (
                  <div key={res.id} className="snap-center shrink-0 w-[240px] bg-muted/40 rounded-3xl p-5 border border-border relative">
                    <div className="absolute top-4 right-4 text-2xl opacity-40">{res.vibeIcon}</div>
                    <div className="mb-4">
                      <span className="inline-block px-2 py-1 bg-amber-500/15 text-amber-600 rounded-md text-[10px] font-extrabold mb-2 truncate">{i18n.t("auto.v2_vip_premium", "PREMIUM")}</span>
                      <h4 className="text-lg font-black text-foreground leading-tight mb-1">{res.title}</h4>
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><MapPin size={10} /> {res.barName}</p>
                    </div>
                    
                    <div className="flex items-center -space-x-2 mb-6">
                      {res.members.map((m: any, i: number) => (
                        <img key={i} src={m.photo} className="w-10 h-10 rounded-full border-2 border-background object-cover" />
                      ))}
                      <div className="w-10 h-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground">+{res.members.length}</div>
                    </div>

                    <button 
                      onClick={() => confirmLightningMatch(res)}
                      className="w-full py-2.5 rounded-xl border-2 border-amber-500 text-amber-600 font-bold text-sm bg-transparent hover:bg-amber-500 hover:text-white transition-colors"
                    >
                      {i18n.t("auto.v2_vip_enter", "여기로 입장")}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
