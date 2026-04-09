import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { Check, X, Clock, RefreshCw, Eye, Crown } from "lucide-react";
type VerifRecord = {
  id: string;
  user_id: string;
  id_type: string;
  front_url: string;
  back_url: string | null;
  selfie_url: string | null;
  status: "pending" | "approved" | "rejected";
  reject_reason: string | null;
  created_at: string;
  profiles?: {
    name: string;
    email: string;
    photo_url: string | null;
    plan?: string;
  };
};
export const AdminVerifications = () => {
  const {
    t
  } = useTranslation();
  const [records, setRecords] = useState<VerifRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [preview, setPreview] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{
    id: string;
    userId: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    let query = supabase.from("id_verifications").select("*, profiles:user_id(name, email, photo_url, plan)").order("created_at", {
      ascending: false
    });
    if (filter !== "all") query = query.eq("status", filter);
    const {
      data,
      error
    } = await query;
    if (error) toast({
      title: t("alert.t18Title")
    });else {
      let filtered = (data ?? []) as VerifRecord[];
      if (filter === "pending") {
        filtered.sort((a, b) => {
          const aPremium = a.profiles?.plan === 'premium' ? 1 : 0;
          const bPremium = b.profiles?.plan === 'premium' ? 1 : 0;
          return bPremium - aPremium;
        });
      }
      setRecords(filtered);
    }
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, [filter]);
  const approve = async (rec: VerifRecord) => {
    setProcessing(rec.id);
    try {
      // id_verifications 상태 업데이트
      await supabase.from("id_verifications").update({
        status: "approved",
        reviewed_at: new Date().toISOString()
      }).eq("id", rec.id);
      // profiles id_verified true + trust_score 재계산
      const {
        data: p
      } = await supabase.from("profiles").select("phone_verified, email_verified, sns_connected, review_verified").eq("id", rec.user_id).single();
      if (p) {
        const score = (p.phone_verified ? 15 : 0) + (p.email_verified ? 10 : 0) + 40 + (p.sns_connected ? 15 : 0) + (p.review_verified ? 20 : 0);
        await supabase.from("profiles").update({
          id_verified: true,
          trust_score: score
        }).eq("id", rec.user_id);
      }
      toast({
        title: t("auto.g_0050", "승인 완료! ✅"),
        description: i18n.t("auto.p10", {
              name: rec.profiles?.name ?? rec.user_id.slice(0, 8)
        })
      });
      load();
    } catch (e: any) {
      toast({
        title: t("alert.t19Title")
      });
    } finally {
      setProcessing(null);
    }
  };
  const reject = async () => {
    if (!rejectModal) return;
    setProcessing(rejectModal.id);
    try {
      await supabase.from("id_verifications").update({
        status: "rejected",
        reject_reason: rejectReason,
        reviewed_at: new Date().toISOString()
      }).eq("id", rejectModal.id);
      toast({
        title: t("alert.t20Title")
      });
      setRejectModal(null);
      setRejectReason("");
      load();
    } catch (e: any) {
      toast({
        title: t("alert.t21Title")
      });
    } finally {
      setProcessing(null);
    }
  };
  const statusColors = {
    pending: "bg-amber-500/10 text-amber-500",
    approved: "bg-green-500/10 text-green-500",
    rejected: "bg-red-500/10 text-red-500"
  };
  const statusLabels = {
    pending: t("auto.g_1348", "심사 대기"),
    approved: t("auto.g_1349", "승인"),
    rejected: t("auto.g_1350", "반려")
  };
  return <div className="truncate">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-extrabold text-foreground truncate">{t("auto.g_1351", "신분증 심사")}</h2>
          <p className="text-xs text-muted-foreground truncate">{t("auto.g_1352", "제출된 신분증을 검토하고 승인/반려 처리하세요")}</p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <RefreshCw size={16} className={`text-muted-foreground ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-4 truncate">
        {(["pending", "approved", "rejected", "all"] as const).map(f => <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === f ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {f === "pending" ? t("auto.g_1353", "심사 대기") : f === "approved" ? t("auto.g_1354", "승인됨") : f === "rejected" ? t("auto.g_1355", "반려됨") : t("auto.g_1356", "전체")}
          </button>)}
      </div>

      {/* 목록 */}
      {loading ? <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div> : records.length === 0 ? <div className="text-center py-12 text-muted-foreground text-sm truncate">{t("auto.g_1357", "해당 항목이 없습니다")}</div> : <div className="space-y-3 truncate">
          {records.map(rec => <div key={rec.id} className="p-4 rounded-2xl bg-card border border-border shadow-sm truncate">
              <div className="flex items-start gap-3">
                {/* 프로필 사진 */}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {rec.profiles?.photo_url ? <img src={rec.profiles.photo_url} alt="" className="w-10 h-10 rounded-xl object-cover" /> : <span className="text-primary font-extrabold text-sm">{rec.profiles?.name?.[0] ?? "?"}</span>}
                </div>
                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-foreground">{rec.profiles?.name ?? rec.user_id.slice(0, 8)}</p>
                    {rec.profiles?.plan === 'premium' && <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-500 font-extrabold border border-amber-500/20">
                      <Crown size={10} /> Fast Track
                    </span>}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[rec.status]}`}>
                      {statusLabels[rec.status]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{rec.id_type}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{rec.profiles?.email}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(rec.created_at).toLocaleString("ko-KR")}</p>
                </div>
              </div>

              {/* 신분증 이미지 */}
              <div className="flex gap-2 mt-3 truncate">
                <button onClick={() => setPreview(rec.front_url)} className="flex-1 h-20 rounded-xl overflow-hidden bg-muted border border-border relative group">
                  <img src={rec.front_url} alt={t("auto.x4004")} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Eye size={16} className="text-white" />
                  </div>
                  <span className="absolute bottom-1 left-1 text-[9px] text-white font-bold bg-black/50 px-1 rounded truncate">{t("auto.g_1358", "앞면")}</span>
                </button>
                {rec.back_url && <button onClick={() => setPreview(rec.back_url!)} className="flex-1 h-20 rounded-xl overflow-hidden bg-muted border border-border relative group">
                    <img src={rec.back_url} alt={t("auto.x4005")} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Eye size={16} className="text-white" />
                    </div>
                    <span className="absolute bottom-1 left-1 text-[9px] text-white font-bold bg-black/50 px-1 rounded truncate">{t("auto.g_1359", "뒷면")}</span>
                  </button>}
              </div>

              {/* 반려 사유 표시 */}
              {rec.status === "rejected" && rec.reject_reason && <div className="mt-2 p-2 rounded-xl bg-red-500/5 border border-red-500/20">
                  <p className="text-[11px] text-red-500 truncate">{t("auto.g_1360", "반려 사유: ")}{rec.reject_reason}</p>
                </div>}

              {/* 액션 버튼 */}
              {rec.status === "pending" && <div className="flex gap-2 mt-3">
                  <button disabled={processing === rec.id} onClick={() => setRejectModal({
            id: rec.id,
            userId: rec.user_id
          })} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold transition-all hover:bg-red-500/20 disabled:opacity-50">
                    <X size={13} />{t("auto.g_1361", "반려")}</button>
                  <button disabled={processing === rec.id} onClick={() => approve(rec)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-xs font-bold transition-all disabled:opacity-50">
                    <Check size={13} /> {processing === rec.id ? t("auto.g_1362", "처리중") : t("auto.g_1363", "승인")}
                  </button>
                </div>}
            </div>)}
        </div>}

      {/* 이미지 전체보기 */}
      {preview && <div className="fixed inset-0 z-[90] bg-black/85 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <img src={preview} alt="preview" className="max-w-full max-h-full rounded-2xl object-contain" />
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" onClick={() => setPreview(null)}>
            <X size={18} className="text-white" />
          </button>
        </div>}

      {/* 반려 사유 모달 */}
      {rejectModal && <div className="fixed inset-0 z-[90] flex items-center justify-center p-6 bg-black/60">
          <div className="w-full max-w-sm bg-card rounded-3xl p-6 shadow-float">
            <h3 className="text-lg font-extrabold text-foreground mb-3 truncate">{t("auto.g_1364", "반려 사유 입력")}</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder={t("auto.g_1365", "반려 사유를 상세히 입력해 주세요")} rows={3} className="w-full px-4 py-3 rounded-2xl bg-muted border border-border text-sm text-foreground outline-none resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setRejectModal(null)} className="flex-1 py-3 rounded-2xl bg-muted text-foreground font-semibold text-sm">{t("general.cancel")}</button>
              <button onClick={reject} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold text-sm">{t("auto.g_1366", "반려 처리")}</button>
            </div>
          </div>
        </div>}
    </div>;
};
export default AdminVerifications;