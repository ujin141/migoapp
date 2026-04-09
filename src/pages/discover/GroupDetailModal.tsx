import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Share2, Languages, MapPin, Calendar, Users, Clock } from "lucide-react";
import i18n from "@/i18n";
import { TripGroup } from "@/types";

interface GroupDetailModalProps {
  currentDetail: TripGroup | null;
  setDetailGroup: (group: TripGroup | null) => void;
  t: any;
  handleShare: (group: TripGroup) => void;
  translateMap: Record<string, string>;
  loadingMap: Record<string, boolean>;
  handleTranslate: (text: string, refId: string) => void;
  handleJoin: (group: TripGroup) => void;
}

export const GroupDetailModal = ({
  currentDetail,
  setDetailGroup,
  t,
  handleShare,
  translateMap,
  loadingMap,
  handleTranslate,
  handleJoin
}: GroupDetailModalProps) => {
  return (
    <AnimatePresence>
      {currentDetail && (
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-0 z-50 bg-background overflow-y-auto">
          <div className="px-5 pt-12 pb-32 truncate">
            {/* Back */}
            <button onClick={() => setDetailGroup(null)} className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <ArrowLeft size={16} />{i18n.t("discover.backToList", { defaultValue: "목록으로" })}
            </button>

            {/* Host */}
            <div className="bg-card rounded-2xl p-4 shadow-card mb-4 truncate">
              <div className="flex items-center gap-3 mb-3">
                {currentDetail.hostPhoto ? (
                  <img src={currentDetail.hostPhoto} alt="" className="w-12 h-12 rounded-xl object-cover" loading="lazy" onError={e => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }} />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {currentDetail.hostName?.[0] || "M"}
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-extrabold text-foreground break-words whitespace-pre-wrap">{translateMap[`groupTitle_${currentDetail.id}`] || currentDetail.title}</p>
                  <p className="text-xs text-muted-foreground">{currentDetail.hostName}</p>
                </div>
                <button onClick={() => handleShare(currentDetail)} className="ml-auto w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Share2 size={14} className="text-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">{translateMap[`groupDesc_${currentDetail.id}`] || currentDetail.description}</p>
              
              {/* Translate Toggle */}
              {currentDetail.description && (
                <div className="mt-3 pt-3 border-t border-border/40">
                  <button 
                    onClick={() => {
                      handleTranslate(currentDetail.title, `groupTitle_${currentDetail.id}`);
                      handleTranslate(currentDetail.description || "", `groupDesc_${currentDetail.id}`);
                      handleTranslate(currentDetail.destination || "", `groupDest_${currentDetail.id}`);
                    }} 
                    className={`text-[11px] font-bold flex items-center gap-1.5 transition-colors px-2 py-1 -ml-2 rounded-lg ${
                      translateMap[`groupDesc_${currentDetail.id}`] 
                        ? "text-primary bg-primary/10" 
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Languages size={12} className={loadingMap[`groupDesc_${currentDetail.id}`] ? "animate-pulse" : ""} />
                    {loadingMap[`groupDesc_${currentDetail.id}`] 
                      ? i18n.t("auto.z_번역중_000", { defaultValue: "번역 중..." }) 
                      : translateMap[`groupDesc_${currentDetail.id}`] 
                        ? i18n.t("auto.z_원문보기_001", { defaultValue: "원문 보기" }) 
                        : i18n.t("auto.z_번역보기_002", { defaultValue: "번역 보기" })
                    }
                  </button>
                </div>
              )}
            </div>

            {/* Meta: 출발지 → 목적지 + 날짜 + 인원 + 마감 */}
            <div className="bg-card rounded-2xl p-4 shadow-card mb-4">
              <div className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2.5 mb-3">
                <MapPin size={13} className="text-muted-foreground shrink-0" />
                <span className="text-[12px] font-bold text-foreground truncate">{currentDetail.departure || i18n.t("auto.g_1394", "미정")}</span>
                <span className="text-primary font-bold text-sm mx-1">✈</span>
                <span className="text-[12px] font-extrabold text-primary flex-1">
                  {translateMap[`groupDest_${currentDetail.id}`] || currentDetail.destination}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 truncate">
                {[{
                  label: i18n.t("auto.g_1395", "여행 날짜"),
                  value: currentDetail.dates,
                  icon: Calendar
                }, {
                  label: i18n.t("auto.g_1396", "모집 인원"),
                  value: i18n.t("auto.t_0048", `${currentDetail.currentMembers}/${currentDetail.maxMembers}명`),
                  icon: Users
                }, {
                  label: i18n.t("auto.g_1397", "마감"),
                  value: `D-${currentDetail.daysLeft}`,
                  icon: Clock
                }].map(({ label, value, icon: Icon }) => (
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

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {currentDetail.tags.map(tag => (
                <span key={tag} className="text-xs bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Schedule */}
            {currentDetail.schedule && currentDetail.schedule.length > 0 && (
              <div className="bg-card rounded-2xl p-4 shadow-card mb-4">
                <h3 className="text-sm font-extrabold text-foreground mb-3 truncate">{i18n.t("discover.scheduleDetail", { defaultValue: "상세 일정" })}</h3>
                <div className="space-y-3 relative before:absolute before:inset-0 before:ml-3 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {currentDetail.schedule.map((item, idx) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-background bg-primary text-primary-foreground font-bold text-[10px] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow md:mx-auto">
                        {idx + 1}
                      </div>
                      <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl bg-muted border border-border/50 shadow-sm">
                        <p className="text-xs font-semibold text-foreground">{item}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members */}
            <div className="bg-card rounded-2xl p-4 shadow-card mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-foreground truncate">{i18n.t("discover.members", { defaultValue: "참여 멤버" })}</h3>
                <span className="text-xs font-bold text-primary truncate">{currentDetail.currentMembers}/{currentDetail.maxMembers}{i18n.t("auto.g_1398", "명")}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full mb-4">
                <div className="h-2 rounded-full gradient-primary transition-all" style={{ width: `${currentDetail.currentMembers / currentDetail.maxMembers * 100}%` }} />
              </div>
              <div className="space-y-2.5 truncate">
                {currentDetail.memberPhotos.map((photo, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <img src={photo} alt="" className="w-9 h-9 rounded-full object-cover" loading="lazy" />
                    <span className="text-sm font-semibold text-foreground truncate">{currentDetail.memberNames[idx] || i18n.t("auto.g_1399", "멤버")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Join button */}
            <button onClick={() => handleJoin(currentDetail)} className={`w-full py-4 rounded-2xl text-sm font-black transition-all ${currentDetail.joined ? "bg-muted text-muted-foreground" : "gradient-primary text-primary-foreground shadow-card"}`}>
              {currentDetail.joined ? i18n.t("auto.g_1400", "이미 참여 중") : i18n.t("auto.g_1401", "그룹 참여하기")}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
