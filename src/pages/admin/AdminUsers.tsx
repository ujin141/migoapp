import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Search, Crown, Ban, Trash2, X, FileText, ChevronDown, RefreshCw } from "lucide-react";
import { fetchAdminUsers, updateUserValidation, updateUserPlan, updateUserBan, deleteUserAccount, updateUserNote } from "@/lib/adminService";
type FilterType = "all" | "verified" | "unverified" | "plus" | "premium" | "banned";
export const AdminUsers = () => {
  const {
    t
  } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [noteEdit, setNoteEdit] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const dbUsers = await fetchAdminUsers();
      setUsers(dbUsers || []);
    } catch (e: any) {
      console.error("AdminUsers load error:", e);
      setLoadError(i18n.t("auto.z_\uC720\uC800\uBAA9\uB85D\uC744\uBD88\uB7EC\uC624\uC9C0\uBABB_883") + e.message + ")");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const match = (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.nationality || "").toLowerCase().includes(q);
    if (!match) return false;
    if (filter === "verified") return u.verified && !u.banned;
    if (filter === "unverified") return !u.verified && !u.banned;
    if (filter === "plus") return u.plan === "plus" || u.is_plus && u.plan !== "premium";
    if (filter === "premium") return u.plan === "premium";
    if (filter === "banned") return u.banned;
    return true;
  });
  const verifyUser = async (id: string, currentVerified: boolean) => {
    const success = await updateUserValidation(id, !currentVerified);
    if (success) {
      setUsers(prev => prev.map(u => u.id === id ? {
        ...u,
        verified: !currentVerified
      } : u));
      if (selectedUser?.id === id) setSelectedUser((p: any) => ({
        ...p,
        verified: !currentVerified
      }));
    }
  };
  const cyclePlan = async (id: string, currentPlan: string, is_plus: boolean) => {
    let nextPlan: 'free' | 'plus' | 'premium' = 'free';
    const plan = currentPlan || (is_plus ? 'plus' : 'free');
    if (plan === 'free') nextPlan = 'plus';else if (plan === 'plus') nextPlan = 'premium';else nextPlan = 'free';
    const success = await updateUserPlan(id, nextPlan);
    if (success) {
      setUsers(prev => prev.map(u => u.id === id ? {
        ...u,
        plan: nextPlan,
        is_plus: nextPlan !== 'free'
      } : u));
      if (selectedUser?.id === id) setSelectedUser((p: any) => ({
        ...p,
        plan: nextPlan,
        is_plus: nextPlan !== 'free'
      }));
    }
  };
  const toggleBan = async (id: string, currentBanned: boolean) => {
    const label = currentBanned ? "정지를해제" : "계정을정지";
    if (!confirm(i18n.t("admin.confirmBanUser", {
      action: label,
      defaultValue: `Are you sure you want to ${label} this user?`
    }))) return;
    const success = await updateUserBan(id, !currentBanned);
    if (success) {
      setUsers(prev => prev.map(u => u.id === id ? {
        ...u,
        banned: !currentBanned
      } : u));
      if (selectedUser?.id === id) setSelectedUser((p: any) => ({
        ...p,
        banned: !currentBanned
      }));
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm("계정을영구")) return;
    const success = await deleteUserAccount(id);
    if (success) {
      setUsers(prev => prev.filter(u => u.id !== id));
      setSelectedUser(null);
    }
  };
  const saveNote = async () => {
    if (!selectedUser) return;
    setSavingNote(true);
    const success = await updateUserNote(selectedUser.id, noteEdit);
    if (success) {
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? {
        ...u,
        admin_note: noteEdit
      } : u));
      setSelectedUser((p: any) => ({
        ...p,
        admin_note: noteEdit
      }));
    }
    setSavingNote(false);
  };
  const filterButtons: {
    key: FilterType;
    label: string;
  }[] = [{
    key: "all",
    label: t("auto.z_tmpl_580", {
      defaultValue: t("auto.z_tmpl_984", {
        defaultValue: t("auto.t5005", {
          v0: users.length
        })
      })
    })
  }, {
    key: "unverified",
    label: t("auto.z_tmpl_581", {
      defaultValue: t("auto.z_tmpl_985", {
        defaultValue: t("auto.p7", {
          count: users.filter(u => !u.verified && !u.banned).length
        })
      })
    })
  }, {
    key: "verified",
    label: t("auto.z_tmpl_582", {
      defaultValue: t("auto.z_tmpl_986", {
        defaultValue: t("auto.p8", {
          count: users.filter(u => u.verified).length
        })
      })
    })
  }, {
    key: "plus",
    label: `Plus (${users.filter(u => u.plan === "plus" || u.is_plus && u.plan !== "premium").length})`
  }, {
    key: "premium",
    label: `Premium (${users.filter(u => u.plan === "premium").length})`
  }, {
    key: "banned",
    label: t("auto.z_tmpl_583", {
      defaultValue: t("auto.z_tmpl_987", {
        defaultValue: t("auto.p9", {
          count: users.filter(u => u.banned).length
        })
      })
    })
  }];
  return <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">{"유저관리5"}</h1>
          <p className="text-sm text-muted-foreground">{"총"}{users.length}{"명등록실시"}</p>
        </div>
        <motion.button whileTap={{
        scale: 0.95
      }} onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground text-sm transition-colors">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{"새로고침5"}
        </motion.button>
      </div>

      {/* 에러 배너 */}
      {loadError && <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3">
          <p className="text-sm text-red-500 font-semibold">{loadError}</p>
          <button onClick={load} className="shrink-0 text-xs font-bold text-red-500 underline">{t("auto.z_\uC7AC\uC2DC\uB3C4_892")}</button>
        </div>}

      {/* 검색 + 필터 */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={"이름이메일"} className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filterButtons.map(b => <button key={b.key} onClick={() => setFilter(b.key)} className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${filter === b.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {b.label}
            </button>)}
        </div>
      </div>

      {/* 테이블 (3열) */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? <div className="py-16 flex items-center justify-center gap-3 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">{"불러오는중"}</span>
          </div> : <table className="w-full">
            <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left text-[11px] font-extrabold text-muted-foreground px-3 py-3 uppercase tracking-wide">{t("admin.colUser")}</th>
                  <th className="text-left text-[11px] font-extrabold text-muted-foreground px-3 py-3 uppercase tracking-wide">{t("admin.colPlanStatus")}</th>
                  <th className="text-left text-[11px] font-extrabold text-muted-foreground px-3 py-3 uppercase tracking-wide">{t("admin.colAction")}</th>
                </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => <motion.tr key={u.id} initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} transition={{
            delay: i * 0.02
          }} className={`border-b border-border/50 transition-colors cursor-pointer
                    ${i === filtered.length - 1 ? "border-b-0" : ""}
                    ${u.banned ? "opacity-50 bg-red-500/5" : "hover:bg-muted/20"}`} onClick={() => {
            setSelectedUser(u);
            setNoteEdit(u.admin_note || "");
          }}>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {u.photo_url ? <img src={u.photo_url} alt="" className="w-8 h-8 rounded-xl object-cover shrink-0" /> : <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground font-bold text-sm shrink-0">
                          {(u.name?.[0] || "?").toUpperCase()}
                        </div>}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-bold text-foreground truncate">{u.name || "이름없음5"}</p>
                          {u.banned && <span className="shrink-0 px-1.5 py-0.5 rounded bg-red-500/10 text-[9px] font-bold text-red-400">{"정지"}</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                        <p className="text-[10px] text-muted-foreground">{u.nationality || "-"} · {new Date(u.created_at).toLocaleDateString("ko-KR")}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      {u.plan === 'premium' ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/10 text-purple-400 w-fit"><Crown size={9} />Premium</span> : u.plan === 'plus' || u.is_plus ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 w-fit"><Crown size={9} />Plus</span> : <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-muted text-muted-foreground w-fit">Free</span>}
                      {u.verified ? <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold w-fit">{"인증됨"}</span> : <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold w-fit">{"미인증"}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => verifyUser(u.id, u.verified)} className={`p-1.5 rounded-lg transition-colors ${u.verified ? "bg-muted text-muted-foreground" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`} title={u.verified ? "인증취소6" : "인증승인6"}>
                        <Check size={12} />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => cyclePlan(u.id, u.plan, u.is_plus)} className={`p-1.5 rounded-lg transition-colors ${u.plan === 'premium' ? "bg-purple-500/20 text-purple-500" : u.plan === 'plus' || u.is_plus ? "bg-amber-500/20 text-amber-500" : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"}`} title={i18n.t("auto.z_\uD50C\uB79C\uC21C\uD658FreePl_907")}>
                        <Crown size={12} />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => toggleBan(u.id, u.banned)} className={`p-1.5 rounded-lg transition-colors ${u.banned ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400 hover:bg-red-500/20"}`} title={u.banned ? "정지해제6" : "계정정지6"}>
                        <Ban size={12} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>)}
            </tbody>
          </table>}
        {!loading && filtered.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">{"유저가없습"}</div>}
      </div>

      {/* User Detail Side Panel */}
      <AnimatePresence>
        {selectedUser && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedUser(null)}>
            <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
            <motion.div initial={{
          x: "100%"
        }} animate={{
          x: 0
        }} exit={{
          x: "100%"
        }} transition={{
          type: "spring",
          damping: 28,
          stiffness: 300
        }} className="relative z-10 w-96 bg-card border-l border-border h-screen overflow-y-auto shadow-float" onClick={e => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-extrabold text-foreground">{"유저상세6"}</h3>
                  <button onClick={() => setSelectedUser(null)} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                    <X size={14} />
                  </button>
                </div>

                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-muted/40 rounded-2xl">
                  {selectedUser.photo_url ? <img src={selectedUser.photo_url} className="w-16 h-16 rounded-2xl object-cover" /> : <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">{(selectedUser.name?.[0] || "?").toUpperCase()}</div>}
                  <div>
                    <p className="font-extrabold text-foreground">{selectedUser.name || "이름없음6"}</p>
                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                    <div className="flex gap-1.5 mt-1.5">
                      {selectedUser.verified && <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">{"인증됨"}</span>}
                      {selectedUser.plan === 'premium' ? <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold">Premium</span> : selectedUser.plan === 'plus' || selectedUser.is_plus ? <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold">Plus</span> : null}
                      {selectedUser.banned && <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold">{"정지됨"}</span>}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-6">
                  {[{
                label: "국가위치6",
                value: selectedUser.nationality || selectedUser.location || "-"
              }, {
                label: "여행일정6",
                value: selectedUser.travel_dates || "-"
              }, {
                label: "가입일",
                value: new Date(selectedUser.created_at).toLocaleDateString("ko-KR")
              }, {
                label: "유저ID6",
                value: selectedUser.id?.slice(0, 16) + "...",
                mono: true
              }].map(i => <div key={i.label} className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-xs text-muted-foreground">{i.label}</span>
                      <span className={`text-xs font-semibold text-foreground ${i.mono ? "font-mono text-[10px]" : ""}`}>{i.value}</span>
                    </div>)}
                </div>

                {/* Bio */}
                {selectedUser.bio && <div className="mb-6 p-3 bg-muted/40 rounded-xl">
                    <p className="text-[11px] text-muted-foreground font-bold mb-1">{"자기소개6"}</p>
                    <p className="text-xs text-foreground leading-relaxed">{selectedUser.bio}</p>
                  </div>}

                {/* Admin Note */}
                <div className="mb-6">
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1"><FileText size={11} />{"관리자메모"}</label>
                  <textarea value={noteEdit} onChange={e => setNoteEdit(e.target.value)} rows={3} placeholder={"이유저에대"} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-xs text-foreground outline-none focus:border-primary resize-none transition-colors" />
                  <motion.button whileTap={{
                scale: 0.97
              }} onClick={saveNote} disabled={savingNote} className="w-full mt-2 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold disabled:opacity-50 transition-colors hover:bg-primary/20">
                    {savingNote ? "저장중" : "메모저장6"}
                  </motion.button>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground mb-2">{"관리액션6"}</p>
                  <motion.button whileTap={{
                scale: 0.97
              }} onClick={() => verifyUser(selectedUser.id, selectedUser.verified)} className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2
                      ${selectedUser.verified ? "bg-muted text-muted-foreground hover:bg-muted/80" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`}>
                    <Check size={14} />{selectedUser.verified ? "인증취소6" : "인증승인6"}
                  </motion.button>
                  <motion.button whileTap={{
                scale: 0.97
              }} onClick={() => cyclePlan(selectedUser.id, selectedUser.plan, selectedUser.is_plus)} className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2
                      ${selectedUser.plan === 'premium' ? "bg-purple-500/20 text-purple-500 hover:bg-purple-500/30" : selectedUser.plan === 'plus' || selectedUser.is_plus ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30" : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"}`}>
                    <Crown size={14} />{selectedUser.plan === 'premium' ? t("auto.z_Premium\uB4F1\uAE09_927") : selectedUser.plan === 'plus' || selectedUser.is_plus ? t("auto.z_Plus\uB4F1\uAE09_928") : t("auto.z_Free\uB4F1\uAE09\uD074\uB9AD\uD558\uC5EC_929")}
                  </motion.button>
                  <motion.button whileTap={{
                scale: 0.97
              }} onClick={() => toggleBan(selectedUser.id, selectedUser.banned)} className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2
                      ${selectedUser.banned ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-red-500/10 text-red-400 hover:bg-red-500/20"}`}>
                    <Ban size={14} />{selectedUser.banned ? "계정정지해" : "계정정지6"}
                  </motion.button>
                  <motion.button whileTap={{
                scale: 0.97
              }} onClick={() => handleDelete(selectedUser.id)} className="w-full py-2.5 rounded-xl text-sm font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
                    <Trash2 size={14} />{"계정영구삭"}</motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>
    </div>;
};