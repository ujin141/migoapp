import { AnimatePresence, motion } from "framer-motion";
import { X, Check, LogOut, AlertTriangle, Settings as SettingsIcon, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import i18n, { LANGUAGES } from "@/i18n";
import { useState } from "react";

export const NotificationModal = ({
  showNotifModal, setShowNotifModal,
  notifMatch, setNotifMatch,
  notifChat, setNotifChat,
  notifGroup, setNotifGroup,
  user
}: any) => {
  const { t } = useTranslation();

  // ── 세분화된 알림 설정 (localStorage 영속) ──
  const loadPref = (key: string, fallback = true) => {
    try {
      const v = localStorage.getItem(`notif_pref_${key}`);
      return v !== null ? v === "true" : fallback;
    } catch { return fallback; }
  };
  const [prefLike,     setPrefLike]     = useState(() => loadPref("like"));
  const [prefSuperlike,setPrefSuperlike]= useState(() => loadPref("superlike"));
  const [prefMatch,    setPrefMatch]    = useState(() => loadPref("match"));
  const [prefComment,  setPrefComment]  = useState(() => loadPref("comment"));
  const [prefGroup,    setPrefGroup]    = useState(() => loadPref("group", true));
  const [prefSystem,   setPrefSystem]   = useState(() => loadPref("system", true));

  const togglePref = (key: string, val: boolean, setter: (v: boolean) => void) => {
    setter(val);
    localStorage.setItem(`notif_pref_${key}`, String(val));
    // 부모 상태도 동기화 (하위 호환)
    if (key === "match") setNotifMatch?.(val);
    if (key === "group") setNotifGroup?.(val);
    toast({ title: `${key} ${val ? t("common.on", "On") : t("common.off", "Off")}` });
  };

  const ITEMS = [
    {
      key: "like",
      emoji: "❤️",
      label: t("profilePage.settings.notif.like", "좋아요 알림"),
      desc: t("profilePage.settings.notif.likeDesc", "누군가 나에게 좋아요를 보내면 알림"),
      value: prefLike,
      setter: (v: boolean) => togglePref("like", v, setPrefLike),
    },
    {
      key: "superlike",
      emoji: "⭐",
      label: t("profilePage.settings.notif.superlike", "슈퍼라이크 알림"),
      desc: t("profilePage.settings.notif.superlikeDesc", "슈퍼라이크 수신 시 알림"),
      value: prefSuperlike,
      setter: (v: boolean) => togglePref("superlike", v, setPrefSuperlike),
    },
    {
      key: "match",
      emoji: "🎉",
      label: t("profilePage.settings.notif.label", "매칭 알림"),
      desc: t("profilePage.settings.notif.desc", "새로운 매칭이 성사되면 알림"),
      value: prefMatch,
      setter: (v: boolean) => togglePref("match", v, setPrefMatch),
    },
    {
      key: "comment",
      emoji: "💬",
      label: t("profilePage.settings.notif.comment", "댓글 알림"),
      desc: t("profilePage.settings.notif.commentDesc", "내 게시글에 댓글이 달리면 알림"),
      value: prefComment,
      setter: (v: boolean) => togglePref("comment", v, setPrefComment),
    },
    {
      key: "group",
      emoji: "👥",
      label: t("profilePage.settings.group.label", "그룹 알림"),
      desc: t("profilePage.settings.group.desc", "그룹 입장·공지 알림"),
      value: prefGroup,
      setter: (v: boolean) => togglePref("group", v, setPrefGroup),
    },
    {
      key: "system",
      emoji: "🔔",
      label: t("profilePage.settings.notif.system", "시스템 알림"),
      desc: t("profilePage.settings.notif.systemDesc", "업데이트·공지·이벤트 알림"),
      value: prefSystem,
      setter: (v: boolean) => togglePref("system", v, setPrefSystem),
    },
  ];

  const handleSave = async () => {
    if (user) {
      const prefs = {
        like: prefLike,
        superlike: prefSuperlike,
        match: prefMatch,
        comment: prefComment,
        group: prefGroup,
        system: prefSystem,
      };
      // notification_prefs JSONB 컬럼에 저장 (컬럼 없으면 무시됨)
      await supabase
        .from("profiles")
        .update({ notification_prefs: prefs } as any)
        .eq("id", user.id)
        .then(() => {}); // silent fail if column doesn't exist yet
    }
    setShowNotifModal(false);
    toast({ title: i18n.t("profile.notifSaved", "알림 설정이 저장되었습니다") });
  };

  return (
    <AnimatePresence>
      {showNotifModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center px-safe pb-safe pt-safe"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
            onClick={() => setShowNotifModal(false)}
          />
          <motion.div
            className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 shadow-float overflow-hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-4">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-extrabold text-foreground">
                    🔔 {i18n.t("profilePage.settings.notif.label", "알림 설정")}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {i18n.t("notif.settingsDesc", "받고 싶은 알림을 선택하세요")}
                  </p>
                </div>
                <button className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center" onClick={() => setShowNotifModal(false)}>
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="px-6 pb-4 space-y-2 max-h-[55vh] overflow-y-auto">
              {ITEMS.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-muted"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-lg shrink-0">{item.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => item.setter(!item.value)}
                    className={`ml-3 shrink-0 w-12 h-6 rounded-full transition-colors duration-200 relative ${
                      item.value ? "gradient-primary" : "bg-border"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                        item.value ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Save button */}
            <div className="px-6 pb-8 pt-2">
              <button
                onClick={handleSave}
                className="w-full py-3.5 rounded-2xl gradient-primary text-primary-foreground font-bold text-sm shadow-card"
              >
                {i18n.t("auto.j530", "저장")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const PrivacyModal = ({
  showPrivacyModal, setShowPrivacyModal,
  profileVisible, setProfileVisible,
  locationShare, setLocationShare,
  user
}: any) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {showPrivacyModal && <motion.div className="fixed inset-0 z-50 flex items-end justify-center px-safe pb-safe pt-safe" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowPrivacyModal(false)} />
          <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 p-6 pb-20 shadow-float" initial={{
        y: "100%"
      }} animate={{
        y: 0
      }} exit={{
        y: "100%"
      }} transition={{
        type: "spring",
        damping: 25,
        stiffness: 300
      }}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5 gap-2">
              <h3 className="text-lg font-extrabold text-foreground truncate">{i18n.t("profilePage.settings.privacy")}</h3>
              <button className="shrink-0" onClick={() => setShowPrivacyModal(false)}><X size={20} className="text-muted-foreground" /></button>
            </div>
            <div className="space-y-4">
              <div className="truncate">
                <p className="text-sm font-bold text-foreground mb-3 truncate">{i18n.t("profilePage.settings.visibility")}</p>
                {[{
              value: "everyone",
              label: i18n.t("profile.everyone"),
              desc: i18n.t("profile.everyoneDesc")
            }, {
              value: "matched",
              label: i18n.t("profilePage.settings.visOptions.matched.label"),
              desc: i18n.t("profilePage.settings.visOptions.matched.desc")
            }, {
              value: "none",
              label: i18n.t("profilePage.settings.visOptions.none.label"),
              desc: i18n.t("profilePage.settings.visOptions.none.desc")
            }].map(opt => <button key={opt.value} onClick={() => setProfileVisible(opt.value as typeof profileVisible)} className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 mb-2 transition-all ${profileVisible === opt.value ? "border-primary bg-primary/5" : "border-border bg-muted"}`}>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                      <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                    </div>
                    {profileVisible === opt.value && <Check size={16} className="text-primary" />}
                  </button>)}
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted">
                <div>
                  <p className="text-sm font-semibold text-foreground truncate">{i18n.t("profilePage.settings.locationShare")}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{i18n.t("profilePage.settings.locationShareDesc")}</p>
                </div>
                <button onClick={() => setLocationShare(!locationShare)} className={`w-12 h-6 rounded-full transition-colors ${locationShare ? "gradient-primary" : "bg-border"} relative`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${locationShare ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>
              <button onClick={async () => {
            if (user) {
              await supabase.from("profiles").update({
                // Use matching columns or standard names
                location_share: locationShare
              }).eq("id", user.id);
            }
            setShowPrivacyModal(false);
            toast({
              title: i18n.t("profile.privacySaved")
            });
          }} className="w-full py-3.5 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm shadow-card">
                {i18n.t("auto.j531")}
              </button>
            </div>
          </motion.div>
        </motion.div>}
    </AnimatePresence>
  );
};

export const LogoutConfirmModal = ({ showLogoutConfirm, setShowLogoutConfirm, signOut }: any) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {showLogoutConfirm && <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-md" onClick={() => setShowLogoutConfirm(false)} />
          <motion.div className="relative z-10 w-full max-w-sm bg-card rounded-3xl p-6 shadow-float text-center" initial={{
        scale: 0.8,
        opacity: 0
      }} animate={{
        scale: 1,
        opacity: 1
      }} exit={{
        scale: 0.8,
        opacity: 0
      }} transition={{
        type: "spring",
        damping: 20,
        stiffness: 300
      }}>
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <LogOut size={28} className="text-destructive" />
            </div>
            <h3 className="text-lg font-extrabold text-foreground mb-2 truncate">{t("profilePage.logout.confirm")}</h3>
            <p className="text-sm text-muted-foreground mb-6 truncate">{t("profile.logoutDesc")}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 rounded-2xl border border-border text-foreground font-semibold text-sm">
                {t("profile.cancel")}
              </button>
              <button onClick={async () => {
            try {
              await signOut();
            } catch (e) {
              console.error("Sign out error", e);
            }
            setShowLogoutConfirm(false);
          }} className="flex-1 py-3 rounded-2xl bg-destructive text-white font-semibold text-sm">
                {t("auto.j532")}
              </button>
            </div>
          </motion.div>
        </motion.div>}
    </AnimatePresence>
  );
};

export const DeleteAccountConfirmModal = ({ showDeleteConfirm, setShowDeleteConfirm, user, signOut }: any) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {showDeleteConfirm && <motion.div className="fixed inset-0 z-[70] flex items-center justify-center p-6" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <motion.div className="relative z-10 w-full max-w-sm bg-card rounded-3xl p-6 shadow-float text-center" initial={{
        scale: 0.9,
        opacity: 0
      }} animate={{
        scale: 1,
        opacity: 1
      }} exit={{
        scale: 0.9,
        opacity: 0
      }}>
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <h3 className="text-xl font-extrabold text-foreground mb-2 truncate">{t("profile.withdrawConfirmTitle")}</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed truncate">
              {t("profile.withdrawConfirmDesc1")}<br />{t("profile.withdrawConfirmDesc2")}
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={async () => {
            if (user) {
              const { error } = await supabase.rpc('delete_user');
              if (error) {
                // 주의: error.message를 직접 표시하면 DB 내부 구조(FK, 테이블명)가 노출될 수 있음
                toast({
                  title: t("profilePage.delete.fail") || "Failed to withdraw account",
                  description: t("profile.tryAgainLater", "Please try again later."),
                  variant: "destructive"
                });
                return;
              }
              await signOut();
            }
            // 계정 삭제 시 모든 로컬 상태 초기화 (재로그인 시 온보딩부터 시작하도록)
            localStorage.removeItem("migo_logged_in");
            localStorage.removeItem("migo_onboarding_done");
            localStorage.removeItem("migo_eula_agreed");
            setShowDeleteConfirm(false);
            toast({
              title: t("profilePage.delete.success")
            });
            navigate("/onboarding", {
              replace: true
            });
          }} className="w-full py-3.5 rounded-2xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors">
                {t("profile.withdrawConfirm")}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-3.5 rounded-2xl bg-muted text-foreground font-semibold text-sm hover:bg-muted/80 transition-colors">
                {t("auto.j533")}
              </button>
            </div>
          </motion.div>
        </motion.div>}
    </AnimatePresence>
  );
};

export const SettingsModal = ({
  showSettingsModal, setShowSettingsModal,
  setShowDeleteConfirm,
  setShowTermsModal,
  setShowPrivacyPolicyModal,
  setShowRefundPolicyModal,
  setShowLicenseModal,
  user
}: any) => {
  const { t } = useTranslation();
  const [showLangPicker, setShowLangPicker] = useState(false);

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES.find(l => l.code === 'en') || LANGUAGES[0];

  return (
    <AnimatePresence>
      {showSettingsModal && <motion.div className="fixed inset-0 z-50 flex items-end justify-center px-safe pb-safe pt-safe" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowSettingsModal(false)} />
          <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 p-6 pb-20 shadow-float" initial={{
        y: "100%"
      }} animate={{
        y: 0
      }} exit={{
        y: "100%"
      }} transition={{
        type: "spring",
        damping: 25,
        stiffness: 300
      }}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5 gap-2">
              <h3 className="text-lg font-extrabold text-foreground truncate">{t('settings.title')}</h3>
              <button className="shrink-0" onClick={() => setShowSettingsModal(false)}><X size={20} className="text-muted-foreground" /></button>
            </div>

            {/* ── Language Picker ── */}
            <div className="mb-4">
              <button onClick={() => setShowLangPicker(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-primary/10 border border-primary/20 transition-colors hover:bg-primary/15">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{currentLang.flag}</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-primary truncate">{t('settings.language')}</p>
                    <p className="text-sm font-semibold text-foreground">{currentLang.label}</p>
                  </div>
                </div>
                <ChevronRight size={16} className={`text-primary transition-transform ${showLangPicker ? 'rotate-90' : ''}`} />
              </button>
              {showLangPicker && (
                <div className="mt-2 bg-muted rounded-2xl p-2 max-h-52 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-1">
                    {LANGUAGES.map(lang => (
                      <button key={lang.code}
                        onClick={async () => {
                          i18n.changeLanguage(lang.code);
                          localStorage.setItem('migo-lang', lang.code);
                          setShowLangPicker(false);
                          if (user) {
                             await supabase.auth.updateUser({ data: { locale: lang.code } });
                          }
                          window.location.reload();
                        }}
                        className={`w-full min-w-0 overflow-hidden flex items-center gap-1.5 px-2 py-2 rounded-xl text-xs transition-colors ${
                          lang.code === i18n.language
                            ? 'bg-primary text-primary-foreground font-bold'
                            : 'hover:bg-border text-foreground'
                        }`}>
                        <span className="shrink-0">{lang.flag}</span>
                        <span className="truncate">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 truncate">
              {[{
            label: t("profilePage.version"),
            desc: "v1.0.0"
          }, {
            label: t('settings.terms'),
            desc: ''
          }, {
            label: t('settings.privacy'),
            desc: ''
          }, {
            label: t("profilePage.refundPolicy"),
            desc: ""
          }, {
            label: t("profilePage.licenseTitle"),
            desc: ""
          }, {
            label: t('settings.deleteAccount'),
            desc: t('settings.deleteAccountDesc') || "All data will be deleted",
            danger: true
          }].map(item => <button key={item.label} onClick={() => {
            if (item.label === t('settings.deleteAccount')) {
              setShowSettingsModal(false);
              setShowDeleteConfirm(true);
            } else if (item.label === t('settings.terms')) {
              setShowTermsModal(true);
            } else if (item.label === t('settings.privacy')) {
              setShowPrivacyPolicyModal(true);
            } else if (item.label === t("profilePage.refundPolicy")) {
              setShowRefundPolicyModal(true);
            } else if (item.label === t("profilePage.licenseTitle")) {
              setShowLicenseModal(true);
            } else {
              toast({
                title: item.label
              });
            }
          }} className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-muted transition-colors hover:bg-border ${item.danger ? "text-red-500" : ""}`}>
                  <span className="text-sm font-semibold truncate text-left">{item.label}</span>
                  <span className="text-xs opacity-60 truncate shrink-0 max-w-[40%] text-right">{item.desc}</span>
                </button>)}
            </div>
          </motion.div>
        </motion.div>}
    </AnimatePresence>
  );
};
