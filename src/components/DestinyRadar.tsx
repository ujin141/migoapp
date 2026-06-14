import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Sparkles, MapPin, Navigation, Compass, Lock, Eye, AlertCircle, HelpCircle } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import { translateLanguage, translateTravelStyle, translateNationality } from "@/lib/translateService";

interface DestinyUser {
  id: string;
  name: string;
  matchScore: number;
  distanceMeter: number;
  hint: string;
  hintKey?: string;
  hintDefault?: string;
  angle: number; // angle in degrees for radar placement
  radius: number; // distance percentage from center (20 to 80)
  photoUrl?: string;
  originalProfile?: any;
}

interface PassedConnection {
  id: string;
  timeLabel: string;
  timeKey?: string;
  timeDefault?: string;
  locationLabel: string;
  locationKey?: string;
  locationDefault?: string;
  matchScore: number;
  hint: string;
  hintKey?: string;
  hintDefault?: string;
}

interface DestinyRadarProps {
  isPremiumUser: boolean;
  onShowPlusModal: () => void;
  onTriggerAlert: (score: number, distance: number, hint: string, actorId?: string) => void;
  profiles?: any[];
  onChat?: (profile: any) => void;
}

export default function DestinyRadar({
  isPremiumUser,
  onShowPlusModal,
  onTriggerAlert,
  profiles = [],
  onChat,
}: DestinyRadarProps) {
  const { t, i18n } = useTranslation();
  const [selectedUser, setSelectedUser] = useState<DestinyUser | null>(null);
  const [unlockedUserIds, setUnlockedUserIds] = useState<Set<string>>(new Set());

  // Simulated nearby users (fallback if no real profiles are loaded)
  const [nearbyUsers, setNearbyUsers] = useState<DestinyUser[]>([
    { id: "destiny-1", name: "User A", matchScore: 95, distanceMeter: 12, hint: "일본어 가능, 온천 투어를 좋아하는 여행자", hintKey: "radar.sim.nearby1", hintDefault: "일본어 가능, 온천 투어를 좋아하는 여행자", angle: 45, radius: 40 },
    { id: "destiny-2", name: "User B", matchScore: 88, distanceMeter: 45, hint: "음악 페스티벌, 맥주 마니아, ENFP", hintKey: "radar.sim.nearby2", hintDefault: "음악 페스티벌, 맥주 마니아, ENFP", angle: 160, radius: 75 },
    { id: "destiny-3", name: "User C", matchScore: 92, distanceMeter: 8, hint: "맛집 탐방과 카메라 사진 촬영이 취미인 사람", hintKey: "radar.sim.nearby3", hintDefault: "맛집 탐방과 카메라 사진 촬영이 취미인 사람", angle: 290, radius: 25 },
  ]);

  // Simulated missed connections
  const [missedConnections, setMissedConnections] = useState<PassedConnection[]>([
    { id: "missed-1", timeLabel: "3시간 전", timeKey: "radar.sim.time3h", timeDefault: "3시간 전", locationLabel: "도쿄 시부야", locationKey: "radar.sim.locShibuya", locationDefault: "도쿄 시부야", matchScore: 96, hint: "카페 투어, 미술관 관람, INFJ", hintKey: "radar.sim.hint1", hintDefault: "카페 투어, 미술관 관람, INFJ" },
    { id: "missed-2", timeLabel: "6시간 전", timeKey: "radar.sim.time6h", timeDefault: "6시간 전", locationLabel: "도쿄 신주쿠 가부키초", locationKey: "radar.sim.locShinjuku", locationDefault: "도쿄 신주쿠 가부키초", matchScore: 91, hint: "혼행족, 야경 사진 촬영, 이자카야 탐방", hintKey: "radar.sim.hint2", hintDefault: "혼행족, 야경 사진 촬영, 이자카야 탐방" },
    { id: "missed-3", timeLabel: "어제", timeKey: "radar.sim.timeYesterday", timeDefault: "어제", locationLabel: "도쿄 하라주쿠", locationKey: "radar.sim.locHarajuku", locationDefault: "도쿄 하라주쿠", matchScore: 89, hint: "쇼핑, 스트릿 패션, 스니커즈 마니아", hintKey: "radar.sim.hint3", hintDefault: "쇼핑, 스트릿 패션, 스니커즈 마니아" },
  ]);

  // Load real profiles
  useEffect(() => {
    if (profiles && profiles.length > 0) {
      const mappedRealUsers: DestinyUser[] = profiles.slice(0, 6).map((p) => {
        let hash = 0;
        for (let i = 0; i < p.id.length; i++) {
          hash = p.id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const angle = Math.abs(hash) % 360;
        const distKm = p.distanceKm || 5;
        const radius = Math.min(95, Math.max(15, 15 + (distKm / 10) * 65));

        const langPart = p.languages && p.languages.length > 0 
          ? p.languages.slice(0, 2).map((l: string) => translateLanguage(l, i18n.language)).join('/') + ' ' + t('radar.speaks', '구사')
          : '';
        const stylePart = p.travelStyle && p.travelStyle.length > 0
          ? p.travelStyle.slice(0, 2).map((s: string) => translateTravelStyle(s, i18n.language)).join(', ') + ' ' + t('radar.interested', '관심')
          : t('radar.travelMate', '여행메이트');
        const nationalityPart = p.nationality ? translateNationality(p.nationality, i18n.language) : '';
        
        const hintParts = [nationalityPart, langPart, stylePart].filter(Boolean);
        const hint = hintParts.join(', ') || t('radar.defaultHint', '여행을 즐기는 메이트');

        return {
          id: p.id,
          name: p.name || 'Migo User',
          matchScore: p.matchScore || 90,
          distanceMeter: Math.round(distKm * 1000),
          hint: `${p.mbti ? '[' + p.mbti + '] ' : ''}${hint}`,
          angle,
          radius,
          photoUrl: p.photo || '',
          originalProfile: p
        };
      });
      setNearbyUsers(mappedRealUsers);
    }
  }, [profiles, t, i18n.language]);

  const handlePointClick = (user: DestinyUser) => {
    triggerHaptic();
    setSelectedUser(user);
  };

  const handleRevealClick = () => {
    triggerHaptic();
    if (!isPremiumUser) {
      onShowPlusModal();
    } else {
      if (selectedUser) {
        setUnlockedUserIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(selectedUser.id);
          return newSet;
        });
      }
    }
  };

  // Simulations
  const simulateAlert = () => {
    triggerHaptic();
    const scores = [94, 96, 98, 99];
    const distances = [2, 3, 5, 8];
    const hints = [
      { key: "radar.sim.alert1", default: "디저트 카페 순례가 취미이며 MBTI가 ENFJ인 여행자" },
      { key: "radar.sim.alert2", default: "서핑과 수영을 즐기고 활동적인 만남을 선호하는 사람" },
      { key: "radar.sim.alert3", default: "사진 촬영이 취미이고 조용한 대화를 좋아하는 INFJ" },
      { key: "radar.sim.alert4", default: "맛집 탐방과 외국어 교환에 관심 있는 현지 거주민" }
    ];

    const randomIdx = Math.floor(Math.random() * hints.length);
    const hintObj = hints[randomIdx];
    const randomProfile = profiles && profiles.length > 0
      ? profiles[Math.floor(Math.random() * profiles.length)]
      : null;
    onTriggerAlert(scores[randomIdx], distances[randomIdx], t(hintObj.key, hintObj.default), randomProfile?.id);
  };

  const simulateNewMissedConnection = () => {
    triggerHaptic();
    const randomId = Math.random().toString(36).substring(7);
    const cities = [
      { key: "radar.sim.locShibuya", default: "도쿄 시부야" },
      { key: "radar.sim.locTokyoTower", default: "도쿄 타워 근처" },
      { key: "radar.sim.locRoppongi", default: "롯폰기 힐즈" },
      { key: "radar.sim.locAsakusa", default: "아사쿠사 센소지" }
    ];
    const hints = [
      { key: "radar.sim.hintExpo", default: "전시회 관람, 힙합 음악, ENFP" },
      { key: "radar.sim.hintShopping", default: "쇼핑몰 투어, 와인 마니아, INTJ" },
      { key: "radar.sim.hintBackpack", default: "배낭여행 매니아, 길거리 음식 탐방, ENFJ" },
      { key: "radar.sim.hintRunning", default: "러닝과 운동, 건강한 식습관, ISTP" }
    ];
    const randomCityObj = cities[Math.floor(Math.random() * cities.length)];
    const randomHintObj = hints[Math.floor(Math.random() * hints.length)];
    const randomScore = Math.floor(Math.random() * 15) + 85;

    const newItem: PassedConnection = {
      id: randomId,
      timeLabel: "방금 전",
      timeKey: "radar.sim.timeJustNow",
      timeDefault: "방금 전",
      locationLabel: randomCityObj.default,
      locationKey: randomCityObj.key,
      locationDefault: randomCityObj.default,
      matchScore: randomScore,
      hint: randomHintObj.default,
      hintKey: randomHintObj.key,
      hintDefault: randomHintObj.default
    };

    setMissedConnections(prev => [newItem, ...prev]);
  };

  return (
    <div 
      className="flex flex-col flex-1 min-h-0 bg-transparent text-white px-4 overflow-hidden select-none relative z-10"
      style={{ paddingBottom: "16px" }}
    >
      
      {/* Floating glowing light leaks */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.15, 0.35, 0.15],
          x: [-30, 30, -30],
          y: [-10, 40, -10],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-12 left-[-20%] w-[280px] h-[280px] rounded-full bg-emerald-500/10 blur-[90px] pointer-events-none z-0"
      />
      <motion.div
        animate={{
          scale: [1.25, 1, 1.25],
          opacity: [0.2, 0.4, 0.2],
          x: [30, -30, 30],
          y: [40, -10, 40],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-36 right-[-20%] w-[280px] h-[280px] rounded-full bg-blue-500/10 blur-[90px] pointer-events-none z-0"
      />
      
      {/* Radar Section */}
      <div className="flex flex-col items-center justify-center shrink-0 py-2 relative">
        
        {/* Radar Circular Visualizer */}
        <div className="relative w-56 h-56 rounded-full border border-emerald-500/10 bg-zinc-950/20 flex items-center justify-center overflow-hidden">
          
          {/* Subtle Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.01)_1px,transparent_1px)] bg-[size:20px_20px]" />

          {/* Compass Rings */}
          <div className="absolute w-44 h-44 rounded-full border border-emerald-500/10" />
          <div className="absolute w-30 h-30 rounded-full border border-emerald-500/5" />
          <div className="absolute w-16 h-16 rounded-full border border-emerald-500/5" />

          {/* Concentric expanding wave animations */}
          <motion.div
            animate={{ scale: [1, 3.2], opacity: [0.4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
            className="absolute w-16 h-16 rounded-full border border-emerald-500/30 pointer-events-none"
          />
          <motion.div
            animate={{ scale: [1, 3.2], opacity: [0.4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeOut", delay: 1.3 }}
            className="absolute w-16 h-16 rounded-full border border-emerald-500/20 pointer-events-none"
          />
          <motion.div
            animate={{ scale: [1, 3.2], opacity: [0.4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeOut", delay: 2.6 }}
            className="absolute w-16 h-16 rounded-full border border-emerald-500/15 pointer-events-none"
          />

          {/* Center User Dot */}
          <div className="relative z-10 w-8 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 p-0.5 shadow-[0_0_20px_rgba(52,211,153,0.5)] flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center text-emerald-500">
              <Compass size={14} className="animate-spin" style={{ animationDuration: '10s' }} />
            </div>
            {/* Center Ping pulse */}
            <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
          </div>

          {/* Nearby User Dots */}
          {nearbyUsers.map((user) => {
            // Calculate coordinates based on angle and radius (percent from center)
            const rad = (user.angle * Math.PI) / 180;
            const distanceOffset = user.radius; // in pixels
            const x = Math.cos(rad) * distanceOffset;
            const y = Math.sin(rad) * distanceOffset;

            const isSelected = selectedUser?.id === user.id;

            return (
              <motion.button
                key={user.id}
                onClick={() => handlePointClick(user)}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: 1,
                  scale: [1, 1.15, 1],
                  x,
                  y,
                }}
                transition={{
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: Math.random() },
                  opacity: { duration: 0.5 },
                  x: { duration: 0.2 },
                  y: { duration: 0.2 }
                }}
                className="absolute z-20 w-5 h-5 flex items-center justify-center"
              >
                {/* Glow ring */}
                <span className={`absolute inset-0 rounded-full bg-emerald-500/25 animate-ping ${isSelected ? "opacity-100 duration-500" : "opacity-40"}`} />
                {/* Core dot */}
                <span className={`w-3.5 h-3.5 rounded-full border shadow-sm transition-all duration-300 ${
                  isSelected 
                    ? "bg-emerald-400 border-white scale-125 shadow-emerald-500/50" 
                    : "bg-gradient-to-r from-emerald-500 to-blue-500 border-emerald-400"
                }`} />
              </motion.button>
            );
          })}
        </div>

        {/* Scan Status Label */}
        <div className="mt-2.5 flex items-center gap-2 text-zinc-400 text-xs">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
          <span>{t("radar.scanning", "주변 10km 이내 인연 실시간 탐색 중...")}</span>
        </div>

        {/* Selected User Detail Card as absolute overlay inside the relative container */}
        <AnimatePresence>
          {selectedUser && (() => {
            const isUnlocked = unlockedUserIds.has(selectedUser.id);
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute inset-x-2 bottom-4 bg-zinc-950/95 backdrop-blur-md border border-emerald-500/35 rounded-2xl p-4 shadow-[0_4px_30px_rgba(0,0,0,0.95)] z-30"
              >
                {/* Top Close */}
                <button
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-3 right-3 text-zinc-500 hover:text-white text-[10px] font-bold px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg"
                >
                  {t("common.close", "닫기")}
                </button>

                <div className="flex items-start gap-3">
                  {/* Profile Silhouette or Real Photo */}
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 relative overflow-hidden">
                    {isUnlocked && selectedUser.photoUrl ? (
                      <img src={selectedUser.photoUrl} alt={selectedUser.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <HelpCircle size={18} className="text-zinc-500" />
                    )}
                    <div className="absolute -bottom-1 bg-emerald-500/25 text-emerald-400 text-[8px] font-black px-1 py-0.5 rounded-full border border-emerald-500/30">
                      {selectedUser.matchScore}%
                    </div>
                  </div>

                  {/* Text Info */}
                  <div className="flex-1 min-w-0 pr-8 text-left">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-black text-emerald-400">
                        {isUnlocked ? `✦ ${selectedUser.name}` : `✦ ${t("radar.anonymousFate", "익명의 운명 상대")}`}
                      </span>
                      <span className="text-[9px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded-md flex items-center gap-1">
                        <MapPin size={8} />
                        {selectedUser.distanceMeter < 1000 
                          ? `${selectedUser.distanceMeter}m` 
                          : `${(selectedUser.distanceMeter / 1000).toFixed(1)}km`}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed pr-2 font-medium">
                      “{selectedUser.hintKey ? t(selectedUser.hintKey, selectedUser.hintDefault) : selectedUser.hint}”
                    </p>
                  </div>
                </div>

                {/* CTA Button */}
                {isUnlocked ? (
                  <button
                    onClick={() => {
                      triggerHaptic();
                      if (selectedUser.originalProfile) {
                        onChat?.(selectedUser.originalProfile);
                      } else {
                        alert(`${t("radar.simChatOpen", "대화방 열기 시뮬레이션: ")}${selectedUser.name}`);
                      }
                    }}
                    className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-blue-500 hover:from-emerald-500 hover:to-blue-600 text-white font-extrabold text-[11px] shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye size={12} fill="white" />
                    {t("radar.chatNow", "대화방 열기 (Chat now)")}
                  </button>
                ) : (
                  <button
                    onClick={handleRevealClick}
                    className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-blue-600 text-black font-extrabold text-[11px] shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isPremiumUser ? <Eye size={12} fill="black" /> : <Lock size={12} />}
                    {isPremiumUser ? t("radar.unlockFree", "프로필 잠금 해제") : t("radar.unlockPremium", "프로필 해제하기 (Premium)")}
                  </button>
                )}
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      {/* Missed Connections Header */}
      <div className="mt-3 mb-3 px-1 flex items-center justify-between shrink-0">
        <h3 
          className="text-sm font-black flex items-center gap-1.5"
          style={{ color: '#ffffff' }}
        >
          <Navigation size={14} className="text-emerald-400 rotate-45" />
          {t("radar.missedTitle", "스쳐 지나간 인연")}
          <span 
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border"
            style={{ 
              color: '#34d399', 
              backgroundColor: 'rgba(52,211,153,0.15)', 
              borderColor: 'rgba(52,211,153,0.3)' 
            }}
          >
            {missedConnections.length}
          </span>
        </h3>
      </div>

      {/* Missed Connections List */}
      <div 
        className="flex-1 overflow-y-auto space-y-3 pb-4 min-h-0"
        style={{ minHeight: '180px' }}
      >
        {missedConnections.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              triggerHaptic();
              onShowPlusModal();
            }}
            className="w-full rounded-2xl p-4 flex items-center gap-3.5 transition-all duration-300 cursor-pointer border relative overflow-hidden group hover:scale-[1.015] active:scale-[0.985]"
            style={{ 
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)', 
              borderColor: 'rgba(255, 255, 255, 0.12)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
            }}
          >
            {/* Glowing hover accent leak */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Left: Silhouette Avatar with glowing gradient hint */}
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 to-blue-500/20 blur-sm" />
              <div className="w-full h-full flex items-center justify-center relative z-10 text-white/40">
                <Sparkles size={16} className="text-emerald-400/60 animate-pulse" />
              </div>
              <div className="absolute bottom-0 right-0 bg-zinc-950/90 p-1 rounded-tl-lg border-t border-l border-zinc-850">
                <Lock size={8} className="text-zinc-400" />
              </div>
            </div>

            {/* Middle: Fate Info */}
            <div className="flex-1 min-w-0 text-left relative z-10">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className="text-[9px] font-bold text-zinc-400">
                  {item.timeKey ? t(item.timeKey, item.timeDefault) : item.timeLabel}
                </span>
                <span className="w-1 h-1 rounded-full bg-zinc-700 shrink-0" />
                <span 
                  className="text-[9px] font-semibold truncate px-1.5 py-0.5 rounded-md border text-zinc-300"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.04)', 
                    borderColor: 'rgba(255, 255, 255, 0.08)' 
                  }}
                >
                  {item.locationKey ? t(item.locationKey, item.locationDefault) : item.locationLabel}
                </span>
              </div>
              
              <p className="text-xs font-semibold text-zinc-100 leading-tight mb-1 truncate pr-2">
                “{item.hintKey ? t(item.hintKey, item.hintDefault) : item.hint}”
              </p>
              
              <span className="text-[9px] font-black text-emerald-400/80 group-hover:text-emerald-400 transition-colors flex items-center gap-0.5">
                ✦ {t("radar.tapToReveal", "눌러서 상대방 프로필 확인하기")}
              </span>
            </div>

            {/* Right: Destiny Score Badge */}
            <div className="flex flex-col items-end shrink-0 gap-1 relative z-10">
              <div 
                className="px-2 py-1 rounded-lg border text-[10px] font-black tracking-tighter"
                style={{ 
                  color: '#34d399', 
                  backgroundColor: 'rgba(52,211,153,0.15)', 
                  borderColor: 'rgba(52,211,153,0.3)',
                  boxShadow: '0 0 10px rgba(52,211,153,0.1)'
                }}
              >
                {item.matchScore}% {t("radar.matchPercent", "Match")}
              </div>
            </div>
          </div>
        ))}

        {missedConnections.length === 0 && (
          <div className="py-8 text-center bg-zinc-900/25 border border-dashed border-zinc-800 rounded-2xl">
            <AlertCircle size={24} className="mx-auto text-zinc-600 mb-2" />
            <p className="text-xs text-zinc-500 font-bold">
              {t("radar.noMissed", "오늘 스쳐간 인연이 아직 없습니다.")}
            </p>
          </div>
        )}

        {/* Simulation Dashboard */}
        <div className="flex gap-2.5 pt-4 pb-2 justify-center shrink-0">
          <button
            onClick={simulateAlert}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-black hover:bg-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Sparkles size={12} fill="currentColor" />
            {t("radar.simAlert", "운명 알림 테스트")}
          </button>
          <button
            onClick={simulateNewMissedConnection}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-bold hover:bg-zinc-700 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Navigation size={12} />
            {t("radar.simPassed", "스쳐간 인연 추가")}
          </button>
        </div>
      </div>

    </div>
  );
}
