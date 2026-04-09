import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Globe } from "lucide-react";
import { LANGUAGES } from "@/i18n";

const LanguagePicker = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem("migo-lang", code);
    setOpen(false);
    // Force reload to update all statically evaluated constants (e.g., HOTPLACES, PRICING)
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted transition-transform active:scale-95"
      >
        <Globe size={16} className="text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">{current.flag} {current.label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.ul
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-2xl shadow-float overflow-hidden min-w-[160px] max-h-[60vh] overflow-y-auto"
            >
              {LANGUAGES.map((lang) => (
                <li key={lang.code}>
                  <button
                    onClick={() => handleSelect(lang.code)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted ${lang.code === i18n.language ? "text-primary" : "text-foreground"}`}
                  >
                    <span className="truncate flex-1 text-left">{lang.flag} {lang.label}</span>
                    {lang.code === i18n.language && <Check size={14} className="text-primary" />}
                  </button>
                </li>
              ))}
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguagePicker;
