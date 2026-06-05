import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Gift, Copy, Check, Share2, Sparkles, Download, Instagram, Info, Award, Users } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import i18n from "@/i18n";

const InvitePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [referralCode, setReferralCode] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteCount, setInviteCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardImage, setCardImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1. 유저 프로필 및 리퍼럴 데이터 로드
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setLoading(true);
        // 프로필 정보 조회
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("referral_code")
          .eq("id", user.id)
          .single();

        if (profileErr) throw profileErr;
        
        // 추천 코드 저장 (만약 코드 없으면 게으른 생성 후 저장)
        if (profile?.referral_code) {
          setReferralCode(profile.referral_code);
        } else {
          const generatedCode = 'MIGO-' + Math.random().toString(36).substring(2, 8).toUpperCase();
          const { error: updateErr } = await supabase
            .from("profiles")
            .update({ referral_code: generatedCode })
            .eq("id", user.id);
          
          if (!updateErr) setReferralCode(generatedCode);
        }

        // 성공한 친구 초대 횟수 카운트
        const { count, error: countErr } = await supabase
          .from("referrals")
          .select("id", { count: "exact", head: true })
          .eq("referrer_id", user.id);

        if (!countErr && count !== null) {
          setInviteCount(count);
        }
      } catch (err) {
        console.error("Invite Page data loading error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // 2. 추천 링크 생성
  const referralLink = `${window.location.origin}/login?ref=${referralCode}`;

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: i18n.t("invite.copied", "Copied to clipboard! 📋"),
      duration: 2000,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // 3. 인스타그램 스토리용 캔버스 카드 그리기
  const generateInstagramCard = async () => {
    if (!user) return;
    setShowCardModal(true);
    setCardImage(null);

    // 조금 뒤 모달이 열리고 canvas element가 DOM에 렌더링된 후 그림
    setTimeout(async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 캔버스 크기 설정 (인스타그램 스토리 비율 9:16 - 1080x1920)
      canvas.width = 1080;
      canvas.height = 1920;

      // 배경 그라데이션 그리기 (Migo 시그니처 Sunset Purple)
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "#4f46e5"); // Indigo
      grad.addColorStop(0.5, "#7c3aed"); // Violet
      grad.addColorStop(1, "#ec4899"); // Pink
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 장식 서클 그리기
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.beginPath();
      ctx.arc(150, 250, 400, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(canvas.width - 150, canvas.height - 350, 500, 0, Math.PI * 2);
      ctx.fill();

      // MIGO 타이틀/로고
      ctx.fillStyle = "#ffffff";
      ctx.font = "black 90px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("M I G O", canvas.width / 2, 220);

      // 서브 타이틀
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.font = "bold 42px sans-serif";
      ctx.fillText("Travel Buddies & Social Discovery", canvas.width / 2, 330);

      // 메인 카드 화이트 박스 영역
      const cardX = 100;
      const cardY = 460;
      const cardW = canvas.width - (cardX * 2);
      const cardH = 1000;
      const radius = 60;

      ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
      ctx.beginPath();
      ctx.moveTo(cardX + radius, cardY);
      ctx.lineTo(cardX + cardW - radius, cardY);
      ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + radius);
      ctx.lineTo(cardX + cardW, cardY + cardH - radius);
      ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - radius, cardY + cardH);
      ctx.lineTo(cardX + radius, cardY + cardH);
      ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - radius);
      ctx.lineTo(cardX, cardY + radius);
      ctx.quadraticCurveTo(cardX, cardY, cardX + radius, cardY);
      ctx.closePath();
      ctx.fill();

      // 사용자 프로필 정보 조회
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, photo_url, nationality, interests")
        .eq("id", user.id)
        .single();

      // 1) 아바타 원형 렌더링
      const avatarX = canvas.width / 2;
      const avatarY = cardY + 220;
      const avatarR = 140;

      // 아바타 그리기 헬퍼 함수
      const drawAvatar = (imageObj?: HTMLImageElement) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        if (imageObj) {
          ctx.drawImage(imageObj, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
        } else {
          // 대체 플레이스홀더 서클
          ctx.fillStyle = "#ec4899";
          ctx.fillRect(avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 100px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(profile?.name?.[0] || user.email?.[0]?.toUpperCase() || "M", avatarX, avatarY);
        }
        ctx.restore();

        // 아바타 테두리
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
        ctx.stroke();
      };

      if (profile?.photo_url) {
        const img = new Image();
        img.crossOrigin = "anonymous"; // CORS 이슈 방지
        img.onload = () => {
          drawAvatar(img);
          drawCardDetails();
        };
        img.onerror = () => {
          drawAvatar();
          drawCardDetails();
        };
        img.src = profile.photo_url;
      } else {
        drawAvatar();
        drawCardDetails();
      }

      // 카드 상세 정보 텍스트 그리기
      function drawCardDetails() {
        // 이름
        ctx.fillStyle = "#1e293b"; // slate-800
        ctx.font = "black 64px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(profile?.name || "Traveler", canvas.width / 2, cardY + 440);

        // 국적 정보
        const nation = profile?.nationality || "Global";
        ctx.fillStyle = "#64748b"; // slate-500
        ctx.font = "bold 38px sans-serif";
        ctx.fillText(`📍 ${nation}`, canvas.width / 2, cardY + 520);

        // 메시지
        ctx.fillStyle = "#475569"; // slate-600
        ctx.font = "normal 38px sans-serif";
        ctx.fillText("Migo 앱에서 제 여행 파트너가 되어주세요! ✈️", canvas.width / 2, cardY + 620);

        // 추천 코드 표시 박스
        const codeBoxW = 600;
        const codeBoxH = 120;
        const codeBoxX = (canvas.width - codeBoxW) / 2;
        const codeBoxY = cardY + 740;
        const codeBoxR = 24;

        ctx.fillStyle = "#f1f5f9"; // slate-100
        ctx.beginPath();
        ctx.moveTo(codeBoxX + codeBoxR, codeBoxY);
        ctx.lineTo(codeBoxX + codeBoxW - codeBoxR, codeBoxY);
        ctx.quadraticCurveTo(codeBoxX + codeBoxW, codeBoxY, codeBoxX + codeBoxW, codeBoxY + codeBoxR);
        ctx.lineTo(codeBoxX + codeBoxW, codeBoxY + codeBoxH - codeBoxR);
        ctx.quadraticCurveTo(codeBoxX + codeBoxW, codeBoxY + codeBoxH, codeBoxX + codeBoxW - codeBoxR, codeBoxY + codeBoxH);
        ctx.lineTo(codeBoxX + codeBoxR, codeBoxY + codeBoxH);
        ctx.quadraticCurveTo(codeBoxX, codeBoxY + codeBoxH, codeBoxX, codeBoxY + codeBoxH - codeBoxR);
        ctx.lineTo(codeBoxX, codeBoxY + codeBoxR);
        ctx.quadraticCurveTo(codeBoxX, codeBoxY, codeBoxX + codeBoxR, codeBoxY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#6366f1"; // primary-indigo
        ctx.font = "black 42px sans-serif";
        ctx.fillText(`CODE: ${referralCode}`, canvas.width / 2, codeBoxY + 60);

        // 하단 안내
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 36px sans-serif";
        ctx.fillText("가입 시 위 코드를 입력하면 슈퍼라이크 3개 무료 지급! 🎁", canvas.width / 2, cardY + 1120);

        // 하단 서브 안내
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.font = "normal 30px sans-serif";
        ctx.fillText("스토리 링크 스티커에 내 추천 초대 링크를 붙이세요", canvas.width / 2, cardY + 1190);

        // 결과 저장
        setCardImage(canvas.toDataURL("image/png"));
      }
    }, 100);
  };

  const handleDownload = () => {
    if (!cardImage) return;
    const link = document.createElement("a");
    link.download = `migo_invite_${referralCode}.png`;
    link.href = cardImage;
    link.click();
    toast({
      title: i18n.t("invite.downloadSuccess", "Image saved to gallery! 📸"),
      duration: 3000,
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border flex items-center gap-3 px-4 pt-safe pb-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-extrabold leading-tight">{i18n.t("invite.title", "Invite Friends")}</h1>
          <p className="text-xs text-muted-foreground truncate">{i18n.t("invite.subtitle", "Get free rewards for every friend who joins")}</p>
        </div>
        <div className="ml-auto">
          <Gift size={22} className="text-primary" />
        </div>
      </header>

      {/* Hero Banner */}
      <div className="mx-4 mt-4 rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-violet-600 to-pink-500 p-6 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-tr-full" />
        <div className="relative z-10">
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-400 text-slate-900 uppercase tracking-wider mb-2 inline-block">
            SPECIAL EVENT
          </span>
          <h2 className="text-2xl font-black text-white leading-tight mb-2 truncate">
            {i18n.t("invite.bannerTitle", "친구도 나도 슈퍼라이크 3개!")}
          </h2>
          <p className="text-sm text-white/80 leading-relaxed">
            {i18n.t("invite.bannerDesc", "초대 코드로 친구가 프로필 설정을 완료하면, 양측 모두에게 즉시 무료 슈퍼라이크 3개를 드려요 🎁")}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-3 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="flex-1 px-4 mt-6 space-y-6">
          {/* 내 추천인 코드 복사 카드 */}
          <div className="bg-card rounded-3xl border border-border p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <Award size={16} className="text-primary" /> {i18n.t("invite.myCode", "내 초대 코드")}
            </h3>
            <div className="flex items-center justify-between bg-muted rounded-2xl p-4 border border-border/40">
              <span className="text-xl font-black text-primary tracking-widest">{referralCode}</span>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => copyToClipboard(referralCode, setCopiedCode)}
                className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground active:text-primary"
              >
                {copiedCode ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </motion.button>
            </div>

            {/* 추천 가입 링크 복사 */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-muted-foreground">{i18n.t("invite.myLink", "초대 가입 링크")}</p>
              <div className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-3 border border-border/40 min-w-0">
                <span className="text-xs text-muted-foreground truncate flex-1 leading-normal">{referralLink}</span>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => copyToClipboard(referralLink, setCopiedLink)}
                  className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground shrink-0"
                >
                  {copiedLink ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </motion.button>
              </div>
            </div>
          </div>

          {/* 인원 카운팅 / 통계 대시보드 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-3xl border border-border p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
                <Users size={14} />
                <span className="text-xs font-extrabold">{i18n.t("invite.stats.joined", "가입한 친구")}</span>
              </div>
              <div>
                <p className="text-3xl font-black text-foreground tabular-nums">{inviteCount}명</p>
                <p className="text-[10px] text-muted-foreground mt-1 truncate">{i18n.t("invite.stats.accumulated", "누적 성공 초대")}</p>
              </div>
            </div>
            <div className="bg-card rounded-3xl border border-border p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
                <Gift size={14} className="text-yellow-500" />
                <span className="text-xs font-extrabold">{i18n.t("invite.stats.rewarded", "획득한 보상")}</span>
              </div>
              <div>
                <p className="text-3xl font-black text-yellow-500 tabular-nums">⭐ {inviteCount * 3}</p>
                <p className="text-[10px] text-muted-foreground mt-1 truncate">{i18n.t("invite.stats.superlikes", "슈퍼라이크 누적 적립")}</p>
              </div>
            </div>
          </div>

          {/* 소셜 및 바이럴 연동 섹션 */}
          <div className="bg-card rounded-3xl border border-border p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <Instagram size={16} className="text-pink-500" /> {i18n.t("invite.storyCardTitle", "인스타그램 스토리로 홍보하기")}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {i18n.t("invite.storyCardDesc", "예쁜 그라데이션 디자인의 여행자 카드를 자동으로 만들어 드려요. 인스타그램 스토리에 카드를 올리고 내 가입 링크를 스티커로 붙여 많은 친구를 불러보세요!")}
            </p>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={generateInstagramCard}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-600 text-white font-extrabold text-sm shadow-md shadow-pink-500/10 flex items-center justify-center gap-2 active:opacity-90"
            >
              <Sparkles size={16} />
              {i18n.t("invite.generateCardBtn", "스토리 카드 만들기")}
            </motion.button>
          </div>

          {/* 안전 및 규정 안내 */}
          <div className="rounded-2xl bg-muted p-4 border border-border/40 flex items-start gap-2.5">
            <Info size={16} className="text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-extrabold text-foreground">{i18n.t("invite.notice.title", "안내 사항")}</h4>
              <ul className="text-[10px] text-muted-foreground list-disc pl-4 mt-1 space-y-1 leading-relaxed">
                <li>{i18n.t("invite.notice.1", "친구가 회원가입 후 최초 프로필 설정(온보딩) 단계에서 코드를 입력해야 보상이 지급됩니다.")}</li>
                <li>{i18n.t("invite.notice.2", "동일 기기 부정이용 또는 가짜 계정 가입은 보상 회수 및 계정 차단의 사유가 됩니다.")}</li>
                <li>{i18n.t("invite.notice.3", "지급된 슈퍼라이크는 소급하여 환불 또는 현금 환전이 불가능합니다.")}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 스토리 카드 생성 모달 */}
      <AnimatePresence>
        {showCardModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0" onClick={() => setShowCardModal(false)} />
            <motion.div
              className="relative z-10 w-full max-w-sm bg-card rounded-3xl p-5 shadow-2xl flex flex-col items-center gap-4 border border-border"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
            >
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Sparkles size={16} className="text-pink-500 animate-pulse" /> {i18n.t("invite.preview.title", "내 스토리 카드")}
              </h3>

              {/* 렌더링용 캔버스 (화면에 보이지 않고 이미지만 추출) */}
              <canvas ref={canvasRef} className="hidden" />

              {/* 이미지 결과물 표시 */}
              <div className="w-full aspect-[9/16] rounded-2xl overflow-hidden border border-border/80 bg-muted shadow-inner relative flex items-center justify-center">
                {cardImage ? (
                  <img src={cardImage} alt="Migo Sharing Card" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span className="text-xs text-muted-foreground">{i18n.t("invite.rendering", "Generating image...")}</span>
                  </div>
                )}
              </div>

              {/* 공유 팁 */}
              <div className="w-full bg-muted rounded-xl p-3 text-left">
                <p className="text-[11px] font-bold text-foreground">💡 {i18n.t("invite.tip.header", "스토리 공유 방법")}</p>
                <ol className="text-[10px] text-muted-foreground list-decimal pl-4 mt-1 space-y-0.5 leading-snug">
                  <li>{i18n.t("invite.tip.1", "아래 저장 단추를 눌러 이미지를 저장하세요.")}</li>
                  <li>{i18n.t("invite.tip.2", "인스타그램 스토리에 이 카드를 선택해 올립니다.")}</li>
                  <li>{i18n.t("invite.tip.3", "링크 스티커 기능으로 복사한 초대 링크를 올리세요!")}</li>
                </ol>
              </div>

              {/* 작업 단추 */}
              <div className="w-full flex gap-2">
                <button
                  onClick={() => setShowCardModal(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-muted text-muted-foreground font-extrabold text-xs active:bg-muted/70"
                >
                  {i18n.t("invite.close", "Close")}
                </button>
                <button
                  disabled={!cardImage}
                  onClick={handleDownload}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-600 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 active:opacity-90 disabled:opacity-50"
                >
                  <Download size={14} />
                  {i18n.t("invite.saveImage", "갤러리에 저장")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvitePage;
