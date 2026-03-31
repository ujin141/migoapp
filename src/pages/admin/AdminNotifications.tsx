import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Send, Users, Crown, Check, Star } from "lucide-react";
import { broadcastNotification } from "@/lib/adminService";
type NotifType = "info" | "warning" | "update" | "promo" | "system";
type NotifTarget = "all" | "plus" | "free" | "verified";
const typeOptions: {
  value: NotifType;
  label: string;
  color: string;
}[] = [{
  value: "info",
  label: i18n.t("auto.z_\uC77C\uBC18\uC548\uB0B4_962"),
  color: "bg-blue-500/10 text-blue-400"
}, {
  value: "warning",
  label: i18n.t("auto.z_\uACBD\uACE0_963"),
  color: "bg-amber-500/10 text-amber-400"
}, {
  value: "update",
  label: i18n.t("auto.z_\uC5C5\uB370\uC774\uD2B8_964"),
  color: "bg-emerald-500/10 text-emerald-400"
}, {
  value: "promo",
  label: i18n.t("auto.z_\uD504\uB85C\uBAA8\uC158_965"),
  color: "bg-violet-500/10 text-violet-400"
}, {
  value: "system",
  label: i18n.t("auto.z_\uC2DC\uC2A4\uD15C_966"),
  color: "bg-orange-500/10 text-orange-400"
}];
const targetOptions: {
  value: NotifTarget;
  label: string;
  icon: any;
}[] = [{
  value: "all",
  label: i18n.t("auto.z_\uC804\uCCB4\uC720\uC800_967"),
  icon: Users
}, {
  value: "plus",
  label: i18n.t("auto.z_MIGOPlus\uC720\uC800_968"),
  icon: Crown
}, {
  value: "verified",
  label: i18n.t("auto.z_\uC778\uC99D\uC720\uC800_969"),
  icon: Check
}, {
  value: "free",
  label: i18n.t("auto.z_\uBB34\uB8CC\uC720\uC800_970"),
  icon: Star
}];
const history: {
  title: string;
  target: string;
  type: string;
  sent: number;
  date: string;
}[] = [];
export const AdminNotifications = () => {
  const {
    t
  } = useTranslation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<NotifType>("info");
  const [target, setTarget] = useState<NotifTarget>("all");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{
    count: number;
  } | null>(null);
  const [log, setLog] = useState(history);
  const send = async () => {
    if (!title || !content) return;
    setSending(true);
    const result = await broadcastNotification(title, content, type, target);
    setSending(false);
    setSent({
      count: result.sent
    });
    setLog(prev => [{
      title,
      target,
      type,
      sent: result.sent,
      date: new Date().toLocaleString("ko-KR")
    }, ...prev]);
    setTimeout(() => {
      setSent(null);
      setTitle("");
      setContent("");
    }, 4000);
  };
  return <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
          <Bell size={24} className="text-primary" />{t("auto.z_\uC804\uCCB4\uC54C\uB9BC\uBC1C\uC1A1_971")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("auto.z_\uC804\uCCB4\uB610\uB294\uD2B9\uC815\uADF8\uB8F9\uC5D0\uC778_972")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t("auto.z_\uB300\uC0C1\uC120\uD0DD_973")}</label>
            <div className="grid grid-cols-2 gap-2">
              {targetOptions.map(o => <button key={o.value} onClick={() => setTarget(o.value)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all
                    ${target === o.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                  <o.icon size={13} /> {o.label}
                </button>)}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t("auto.z_\uC54C\uB9BC\uC720\uD615_974")}</label>
            <div className="flex gap-2 flex-wrap">
              {typeOptions.map(o => <button key={o.value} onClick={() => setType(o.value)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border
                    ${type === o.value ? "border-primary " + o.color : "border-border text-muted-foreground"}`}>
                  {o.label}
                </button>)}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t("auto.z_\uC81C\uBAA9_975")}</label>
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={60} placeholder={t("auto.z_\uC608MIGO\uC5EC\uB984\uC774\uBCA4\uD2B8_976")} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary" />
            <p className="text-right text-[10px] text-muted-foreground mt-1">{title.length}/60</p>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t("auto.z_\uB0B4\uC6A9_977")}</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} maxLength={200} placeholder={t("auto.z_\uC608\uC9C0\uAE08MIGO\uC5D0\uC11C\uC288_978")} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary resize-none" />
            <p className="text-right text-[10px] text-muted-foreground mt-1">{content.length}/200</p>
          </div>

          <AnimatePresence>
            {sent ? <motion.div initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} exit={{
            opacity: 0
          }} className="w-full py-3 rounded-2xl bg-emerald-500/10 text-emerald-400 text-sm font-bold text-center flex items-center justify-center gap-2">
                <Check size={16} /> {sent.count}{t("auto.z_\uBA85\uC5D0\uAC8C\uBC1C\uC1A1\uC644\uB8CC_979")}</motion.div> : <motion.button whileTap={{
            scale: 0.97
          }} onClick={send} disabled={!title || !content || sending} className="w-full py-3 rounded-2xl gradient-primary text-primary-foreground text-sm font-extrabold disabled:opacity-40 flex items-center justify-center gap-2">
                {sending ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t("auto.z_\uBC1C\uC1A1\uC911_980")}</> : <><Send size={14} />{t("auto.z_\uC54C\uB9BC\uBC1C\uC1A1_981")}</>}
              </motion.button>}
          </AnimatePresence>
        </div>

        {/* Preview + Log */}
        <div className="space-y-4">
          {/* Phone preview */}
          {(title || content) && <div className="bg-card rounded-2xl border border-border p-5">
              <p className="text-[10px] font-bold text-muted-foreground mb-3 uppercase tracking-wide">{t("auto.z_\uBBF8\uB9AC\uBCF4\uAE30_982")}</p>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <Bell size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{title || t("auto.z_\uC81C\uBAA9_983")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{content || t("auto.z_\uB0B4\uC6A9_984")}</p>
                </div>
              </div>
            </div>}

          {/* History */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <p className="text-sm font-bold text-foreground mb-3">{t("auto.z_\uBC1C\uC1A1\uAE30\uB85D\uC138\uC158_985")}</p>
            {log.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">{t("auto.z_\uBC1C\uC1A1\uAE30\uB85D\uC774\uC5C6\uC2B5\uB2C8\uB2E4_986")}</p> : <div className="space-y-2">
                {log.map((l, i) => <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{l.title}</p>
                      <p className="text-[10px] text-muted-foreground">{l.target} · {l.type} · {l.sent}{i18n.t("auto.z_\uBA85\uBC1C\uC1A1_987")}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap">{l.date}</p>
                  </div>)}
              </div>}
          </div>
        </div>
      </div>
    </div>;
};
export default AdminNotifications;