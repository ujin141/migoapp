/**
 * SubscriptionExpiryBanner.tsx
 * 구독 만료 경고 배너
 *
 * - 만료 3일 전부터 앱 상단에 고정 배너 표시
 * - Plus / Premium 구독 중인 유저만 대상
 * - 오늘 닫으면 localStorage로 하루 숨김
 * - 탭하면 MigoPlusModal(구독 갱신)로 연결
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/context/SubscriptionContext';
import MigoPlusModal from './MigoPlusModal';

const WARN_DAYS = 3; // 만료 N일 전부터 배너 표시
const DISMISS_KEY = 'migo_expiry_banner_dismissed'; // localStorage key

function getDismissedUntil(): string | null {
  try { return localStorage.getItem(DISMISS_KEY); } catch { return null; }
}
function setDismissedToday() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    localStorage.setItem(DISMISS_KEY, tomorrow.toISOString().slice(0, 10));
  } catch {}
}
function isDismissedToday(): boolean {
  const until = getDismissedUntil();
  if (!until) return false;
  return new Date().toISOString().slice(0, 10) < until;
}

export default function SubscriptionExpiryBanner() {
  const { user } = useAuth();
  const { isPlus, isPremium } = useSubscription();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(isDismissedToday);
  const [showRenewModal, setShowRenewModal] = useState(false);

  // DB에서 만료일 조회
  useEffect(() => {
    if (!user || !isPlus) return;
    supabase
      .from('profiles')
      .select('plus_expires_at')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data?.plus_expires_at) return; // null = 영구 (경고 불필요)
        const expiresAt = new Date(data.plus_expires_at);
        const now = new Date();
        const diff = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff <= WARN_DAYS) {
          setDaysLeft(diff);
        }
      });
  }, [user, isPlus]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedToday();
    setDismissed(true);
  };

  const visible = isPlus && daysLeft !== null && !dismissed;

  const urgencyColor =
    daysLeft === 0 ? 'from-red-600 to-rose-600' :
    daysLeft === 1 ? 'from-orange-500 to-red-500' :
                    'from-amber-500 to-orange-500';

  const label =
    daysLeft === 0 ? '오늘 구독이 만료됩니다!' :
    daysLeft === 1 ? '내일 구독이 만료됩니다.' :
                    `구독이 ${daysLeft}일 후 만료됩니다.`;

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="expiry-banner"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            onClick={() => setShowRenewModal(true)}
            className="fixed top-0 left-0 right-0 z-[9990] cursor-pointer select-none"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <div
              className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${urgencyColor} shadow-lg`}
            >
              {/* 아이콘 */}
              <motion.div
                animate={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                {daysLeft === 0
                  ? <AlertTriangle size={18} className="text-white shrink-0" />
                  : <Crown size={18} className="text-white shrink-0" />
                }
              </motion.div>

              {/* 텍스트 */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-extrabold leading-tight truncate">
                  {isPremium ? '👑 Premium' : '✨ Plus'} — {label}
                </p>
                <p className="text-white/80 text-[10px] mt-0.5 font-medium truncate">
                  탭하여 지금 바로 갱신하세요 →
                </p>
              </div>

              {/* 갱신 아이콘 */}
              <RefreshCw size={14} className="text-white/80 shrink-0" />

              {/* 닫기 */}
              <button
                onClick={handleDismiss}
                className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 active:bg-white/40"
                aria-label="배너 닫기"
              >
                <X size={12} className="text-white" />
              </button>
            </div>

            {/* 만료 진행 바 (남은 일수 시각화) */}
            <div className="h-0.5 bg-white/20 w-full">
              <motion.div
                className="h-full bg-white/60"
                initial={{ width: '100%' }}
                animate={{ width: `${((WARN_DAYS - (daysLeft ?? 0)) / WARN_DAYS) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 갱신 모달 */}
      <MigoPlusModal
        isOpen={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        defaultPlan={isPremium ? 'premium' : 'plus'}
      />
    </>
  );
}
