import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

export const HelpModal = ({ showHelpModal, setShowHelpModal }: { showHelpModal: boolean, setShowHelpModal: (v: boolean) => void }) => {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {showHelpModal && <motion.div className="fixed inset-0 z-50 flex items-end justify-center px-safe pb-safe pt-safe" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }}>
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowHelpModal(false)} />
          <motion.div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-3xl mb-4 sm:mb-8 p-6 pb-20 shadow-float max-h-[80vh] overflow-y-auto" initial={{
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
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-foreground truncate">{t("profilePage.faq.title")}</h3>
              <button onClick={() => setShowHelpModal(false)}><X size={20} className="text-muted-foreground" /></button>
            </div>
            <div className="space-y-3 truncate">
              {[{
            q: t("profile.faq1q"),
            a: t("profile.faq1a")
          }, {
            q: t("profile.faq2q"),
            a: t("profile.faq2a")
          }, {
            q: t("profile.faq3q"),
            a: t("profile.faq3a")
          }, {
            q: t("profile.faq4q"),
            a: t("profile.faq4a")
          }, {
            q: t("profile.faq5q"),
            a: t("profile.faq5a")
          }].map((faq, i) => <div key={i} className="bg-muted rounded-2xl p-4">
                  <p className="text-sm font-bold text-foreground mb-1.5">Q. {faq.q}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">A. {faq.a}</p>
                </div>)}
            </div>
          </motion.div>
        </motion.div>}
    </AnimatePresence>
  );
};

export const TermsModal = ({ showTermsModal, setShowTermsModal }: { showTermsModal: boolean, setShowTermsModal: (v: boolean) => void }) => {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {showTermsModal && <motion.div className="fixed inset-0 z-[80] bg-background flex flex-col" initial={{
      x: "100%"
    }} animate={{
      x: 0
    }} exit={{
      x: "100%"
    }} transition={{
      type: "spring",
      damping: 28,
      stiffness: 300
    }}>
          <div className="flex items-center gap-3 px-5 pt-10 pb-4 border-b border-border shrink-0">
            <button onClick={() => setShowTermsModal(false)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"><X size={18} /></button>
            <h2 className="text-lg font-extrabold text-foreground truncate">{t("profile.termsTitle")}</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 text-sm text-foreground leading-relaxed pb-20 truncate">
            <p className="text-xs text-muted-foreground truncate">{t("profile.termsEffective")}</p>

            {[{
          title: t("profile.terms1Title"),
          content: t("profile.terms1Content")
        }, {
          title: t("profile.terms2Title"),
          content: t("profile.terms2Content")
        }, {
          title: t("profile.terms3Title"),
          content: t("profile.terms3Content")
        }, {
          title: t("profile.terms4Title"),
          content: t("profile.terms4Content")
        }, {
          title: t("profile.terms5Title"),
          content: t("profile.terms5Content")
        }, {
          title: t("profile.terms6Title"),
          content: t("profile.terms6Content")
        }, {
          title: t("profile.terms7Title"),
          content: t("profile.terms7Content")
        }, {
          title: t("profile.terms8Title"),
          content: t("profile.terms8Content")
        }, {
          title: t("profile.terms9Title"),
          content: t("profile.terms9Content")
        }, {
          title: t("profile.terms10Title"),
          content: t("profile.terms10Content")
        }].map((s, i) => <div key={i}>
                <h3 className="font-extrabold text-foreground mb-1.5">{s.title}</h3>
                <p className="text-muted-foreground text-[13px] leading-relaxed">{s.content}</p>
              </div>)}

            <div className="mt-6 p-4 bg-muted rounded-2xl">
              <p className="text-xs text-muted-foreground truncate"><span className="font-bold text-foreground truncate">{t("profile.companyInfo")}</span><br />{t("profile.companyName")}: Lunatics Group Inc<br />{t("profile.ceo")}: {t("profile.managerName")}<br />{t("profile.email")}: support@lunaticsgroup.com</p>
            </div>
          </div>
        </motion.div>}
    </AnimatePresence>
  );
};

export const PrivacyPolicyModal = ({ showPrivacyPolicyModal, setShowPrivacyPolicyModal }: { showPrivacyPolicyModal: boolean, setShowPrivacyPolicyModal: (v: boolean) => void }) => {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {showPrivacyPolicyModal && <motion.div className="fixed inset-0 z-[80] bg-background flex flex-col" initial={{
      x: "100%"
    }} animate={{
      x: 0
    }} exit={{
      x: "100%"
    }} transition={{
      type: "spring",
      damping: 28,
      stiffness: 300
    }}>
          <div className="flex items-center gap-3 px-5 pt-10 pb-4 border-b border-border shrink-0">
            <button onClick={() => setShowPrivacyPolicyModal(false)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"><X size={18} /></button>
            <h2 className="text-lg font-extrabold text-foreground truncate">{t("profilePage.privacyTitle")}</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 text-sm text-foreground leading-relaxed pb-20 truncate">
            <p className="text-xs text-muted-foreground truncate">{t("profile.privacyEffective")}</p>
            <p className="text-[13px] text-muted-foreground leading-relaxed truncate">{t("profile.privacyIntro")}</p>

            {[{
          title: t("profile.privacy1Title"),
          content: t("profile.privacy1Content")
        }, {
          title: t("profile.privacy2Title"),
          content: t("profile.privacy2Content")
        }, {
          title: t("profile.privacy3Title"),
          content: t("profile.privacy3Content")
        }, {
          title: t("profile.privacy4Title"),
          content: t("profile.privacy4Content")
        }, {
          title: t("profile.privacy5Title"),
          content: t("profile.privacy5Content")
        }, {
          title: t("profile.privacy6Title"),
          content: t("profile.privacy6Content")
        }, {
          title: t("profile.privacy7Title"),
          content: t("profile.privacy7Content")
        }, {
          title: t("profile.privacy8Title"),
          content: t("profile.privacy8Content")
        }].map((s, i) => <div key={i}>
                <h3 className="font-extrabold text-foreground mb-1.5">{s.title}</h3>
                <p className="text-muted-foreground text-[13px] leading-relaxed whitespace-pre-line">{s.content}</p>
              </div>)}

            <div className="mt-6 p-4 bg-muted rounded-2xl">
              <p className="text-xs text-muted-foreground truncate"><span className="font-bold text-foreground truncate">{t("profile.privacyManager")}</span><br />Lunatics Group Inc · {t("profile.managerName")}<br />privacy@lunaticsgroup.com</p>
            </div>
          </div>
        </motion.div>}
    </AnimatePresence>
  );
};

export const LicenseModal = ({ showLicenseModal, setShowLicenseModal }: { showLicenseModal: boolean, setShowLicenseModal: (v: boolean) => void }) => {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {showLicenseModal && <motion.div className="fixed inset-0 z-[80] bg-background flex flex-col" initial={{
      x: "100%"
    }} animate={{
      x: 0
    }} exit={{
      x: "100%"
    }} transition={{
      type: "spring",
      damping: 28,
      stiffness: 300
    }}>
          <div className="flex items-center gap-3 px-5 pt-10 pb-4 border-b border-border shrink-0">
            <button onClick={() => setShowLicenseModal(false)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"><X size={18} /></button>
            <h2 className="text-lg font-extrabold text-foreground truncate">{t("profilePage.licenseTitle")}</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5 pb-20">
            <p className="text-[13px] text-muted-foreground mb-5 leading-relaxed truncate">{t("profile.ossIntro")}</p>
            <div className="space-y-3 truncate">
              {[{
            name: "React",
            version: "18.x",
            license: "MIT",
            author: "Meta Platforms, Inc."
          }, {
            name: "Vite",
            version: "5.x",
            license: "MIT",
            author: "Evan You"
          }, {
            name: "TypeScript",
            version: "5.x",
            license: "Apache-2.0",
            author: "Microsoft Corporation"
          }, {
            name: "Framer Motion",
            version: "11.x",
            license: "MIT",
            author: "Framer B.V."
          }, {
            name: "Tailwind CSS",
            version: "3.x",
            license: "MIT",
            author: "Tailwind Labs, Inc."
          }, {
            name: "Supabase JS",
            version: "2.x",
            license: "MIT",
            author: "Supabase, Inc."
          }, {
            name: "Lucide React",
            version: "0.x",
            license: "ISC",
            author: "Lucide Contributors"
          }, {
            name: "React Router",
            version: "6.x",
            license: "MIT",
            author: "Remix Software"
          }, {
            name: "Capacitor",
            version: "6.x",
            license: "MIT",
            author: "Ionic"
          }, {
            name: "Radix UI",
            version: "1.x",
            license: "MIT",
            author: "WorkOS"
          }, {
            name: "TanStack Query",
            version: "5.x",
            license: "MIT",
            author: "Tanner Linsley"
          }, {
            name: "class-variance-authority",
            version: "0.x",
            license: "Apache-2.0",
            author: "Joe Bell"
          }, {
            name: "clsx",
            version: "2.x",
            license: "MIT",
            author: "Luke Edwards"
          }, {
            name: "date-fns",
            version: "3.x",
            license: "MIT",
            author: "date-fns contributors"
          }, {
            name: "Sonner",
            version: "1.x",
            license: "MIT",
            author: "Emil Kowalski"
          }, {
            name: "OpenAI JS",
            version: "4.x",
            license: "Apache-2.0",
            author: "OpenAI"
          }].map(lib => <div key={lib.name} className="flex items-center justify-between p-3.5 bg-muted rounded-2xl">
                  <div>
                    <p className="text-sm font-bold text-foreground">{lib.name} <span className="text-[10px] font-normal text-muted-foreground">{lib.version}</span></p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{lib.author}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-primary/10 text-[10px] font-bold text-primary">{lib.license}</span>
                </div>)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-5 leading-relaxed truncate">{t("profile.ossOutro")}</p>
          </div>
        </motion.div>}
    </AnimatePresence>
  );
};
