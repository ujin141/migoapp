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

  return (
    <AnimatePresence>
      {showNotifModal && <motion.div className="fixed inset-0 z-50 flex items-end justify-center px-safe pb-safe pt-safe" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowNotifModal(false)} />
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
              <h3 className="text-lg font-extrabold text-foreground truncate">{i18n.t("profilePage.settings.notif.label") || "Notifications"}</h3>
              <button className="shrink-0" onClick={() => setShowNotifModal(false)}><X size={20} className="text-muted-foreground" /></button>
            </div>
            <div className="space-y-4 truncate">
              {[{
            label: i18n.t("profilePage.settings.notif.label"),
            desc: i18n.t("profilePage.settings.notif.desc"),
            value: notifMatch,
            setter: setNotifMatch
          }, {
            label: i18n.t("profilePage.settings.chat.label"),
            desc: i18n.t("profilePage.settings.chat.desc"),
            value: notifChat,
            setter: setNotifChat
          }, {
            label: i18n.t("profilePage.settings.group.label"),
            desc: i18n.t("profilePage.settings.group.desc"),
            value: notifGroup,
            setter: setNotifGroup
          }].map(item => <div key={item.label} className="flex items-center justify-between p-4 rounded-2xl bg-muted">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <button onClick={() => {
              item.setter(!item.value);
              toast({
                title: `${item.label} ${!item.value ? "On" : "Off"}`
              });
            }} className={`w-12 h-6 rounded-full transition-colors ${item.value ? "gradient-primary" : "bg-border"} relative`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${item.value ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>)}
              <button onClick={async () => {
            if (user) {
              await supabase.from("profiles").update({
                notif_match: notifMatch,
                notif_chat: notifChat,
                notif_group: notifGroup
              }).eq("id", user.id);
            }
            setShowNotifModal(false);
            toast({
              title: i18n.t("profile.notifSaved")
            });
          }} className="w-full py-3.5 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm shadow-card">
                {i18n.t("auto.j530")}
              </button>
            </div>
          </motion.div>
        </motion.div>}
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
                privacy_mode: profileVisible,
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
              await supabase.rpc('delete_user');
              await signOut();
            }
            localStorage.removeItem("migo_logged_in");
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
            desc: t("settings.terms")
          }, {
            label: t('settings.privacy'),
            desc: t("settings.privacy")
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
