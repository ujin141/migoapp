import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Search, Eye, EyeOff, Pin, RefreshCw } from "lucide-react";
import { fetchAdminPosts, deletePost, updatePostHidden, updatePostPinned } from "@/lib/adminService";
export const AdminPosts = () => {
  const {
    t
  } = useTranslation();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "hidden" | "pinned">("all");
  const load = async () => {
    setLoading(true);
    const data = await fetchAdminPosts();
    setPosts(data);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);
  const filtered = posts.filter(p => {
    const q = search.toLowerCase();
    const match = (p.title || "").toLowerCase().includes(q) || (p.authorName || "").toLowerCase().includes(q) || (p.content || "").toLowerCase().includes(q);
    if (!match) return false;
    if (filter === "hidden") return p.hidden;
    if (filter === "pinned") return p.pinned;
    return true;
  });
  const handleDelete = async (id: string) => {
    if (!confirm(t("auto.g_1268", "정말로이게"))) return;
    const success = await deletePost(id);
    if (success) setPosts(prev => prev.filter(p => p.id !== id));else alert(t("auto.g_1269", "게시글삭제"));
  };
  const handleToggleHidden = async (id: string, currentHidden: boolean) => {
    const success = await updatePostHidden(id, !currentHidden);
    if (success) setPosts(prev => prev.map(p => p.id === id ? {
      ...p,
      hidden: !currentHidden
    } : p));
  };
  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    const success = await updatePostPinned(id, !currentPinned);
    if (success) setPosts(prev => prev.map(p => p.id === id ? {
      ...p,
      pinned: !currentPinned
    } : p));
  };
  const filterBtns = [{
    key: "all" as const,
    label: t("auto.t5004", { v0: posts.length
    })
  }, {
    key: "pinned" as const,
    label: t("auto.p4", { count: posts.filter(p => p.pinned).length
    })
  }, {
    key: "hidden" as const,
    label: t("auto.p5", { count: posts.filter(p => p.hidden).length
    })
  }];
  return <div className="truncate">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground truncate">{t("auto.g_1270", "커뮤니티글")}</h1>
          <p className="text-sm text-muted-foreground truncate">{t("auto.g_1271", "총")}{posts.length}{t("auto.g_1272", "개실시간D")}</p>
        </div>
        <motion.button whileTap={{
        scale: 0.95
      }} onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted text-muted-foreground text-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{t("auto.g_1273", "새로고침6")}</motion.button>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("auto.g_1274", "제목내용작")} className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors" />
        </div>
        <div className="flex gap-1.5">
          {filterBtns.map(b => <button key={b.key} onClick={() => setFilter(b.key)} className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${filter === b.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {b.label}
            </button>)}
        </div>
      </div>

      {loading ? <div className="py-16 flex items-center justify-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm truncate">{t("auto.g_1275", "불러오는중")}</span>
        </div> : <div className="space-y-3 truncate">
          <AnimatePresence>
            {filtered.map(p => <motion.div key={p.id} layout exit={{
          opacity: 0,
          scale: 0.95
        }} className={`bg-card rounded-2xl p-5 border transition-all
                  ${p.hidden ? "border-red-500/20 opacity-60" : p.pinned ? "border-primary/30" : "border-border"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 truncate">
                      {p.pinned && <span className="px-1.5 py-0.5 rounded bg-primary/10 text-[9px] font-bold text-primary truncate">{t("auto.g_1276", "고정")}</span>}
                      {p.hidden && <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-[9px] font-bold text-red-400 truncate">{t("auto.g_1277", "숨김")}</span>}
                      {p.authorPhoto ? <img src={p.authorPhoto} className="w-5 h-5 rounded-lg object-cover" /> : <div className="w-5 h-5 rounded-lg bg-muted" />}
                      <span className="text-xs text-muted-foreground">{p.authorName}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("ko-KR")}</span>
                      <div className="flex gap-1 ml-1">
                        {p.tags?.map((t: string) => <span key={t} className="px-1.5 py-0.5 rounded-full bg-primary/10 text-[10px] text-primary font-bold">#{t}</span>)}
                      </div>
                    </div>
                    <p className="font-bold text-foreground mb-1">{p.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.content}</p>
                    {p.image_url && <img src={p.image_url} className="mt-2 h-20 rounded-xl object-cover" />}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {p.likes_count != null && <span>❤️ {p.likes_count}</span>}
                      {p.comments_count != null && <span>💬 {p.comments_count}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <motion.button whileTap={{
                scale: 0.9
              }} onClick={() => handleTogglePin(p.id, p.pinned)} className={`p-2 rounded-xl transition-colors ${p.pinned ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"}`} title={p.pinned ? t("auto.g_1278", "핀해제") : t("auto.g_1279", "글고정")}>
                      <Pin size={14} />
                    </motion.button>
                    <motion.button whileTap={{
                scale: 0.9
              }} onClick={() => handleToggleHidden(p.id, p.hidden)} className={`p-2 rounded-xl transition-colors ${p.hidden ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"}`} title={p.hidden ? t("auto.g_1280", "숨김해제6") : t("auto.g_1281", "글숨김")}>
                      {p.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                    </motion.button>
                    <motion.button whileTap={{
                scale: 0.9
              }} onClick={() => handleDelete(p.id)} className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title={t("auto.g_1282", "게시글삭제")}>
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>)}
          </AnimatePresence>
          {filtered.length === 0 && <div className="py-16 text-center text-sm text-muted-foreground truncate">{t("auto.g_1283", "게시글이없")}</div>}
        </div>}
    </div>;
};