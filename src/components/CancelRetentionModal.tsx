/**
 * CancelRetentionModal.tsx
 * 해지 이탈 방지 팝업
 *
 * - MigoPlusModal 닫기 버튼 클릭 시 (구독 중이 아닐 때) 표시
 * - 심리적 앵커링: 잃게 될 혜택 목록 + 한정 오퍼 제공
 * - "해지 유지" → 원래 Plus 모달로 복귀
 * - "그냥 닫기" → 모달 완전 종료
 *
 * 사용법:
 *   <CancelRetentionModal
 *     isOpen={showRetention}
 *     onKeep={() => setShowRetention(false)}       // Plus 모달로 복귀
 *     onConfirmClose={() => { setShowRetention(false); onClose(); }} // 완전 종료
 *     plan="plus"
 *   />
 */
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Heart, Star, Eye, Globe, Filter, Zap, Crown, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LOSS_ITEMS = [
  { icon: Heart,  label: '일일 좋아요 50개',          detail: '다시 10개로 줄어요' },
  { icon: Star,   label: '슈퍼라이크 5개/월',          detail: '매칭률 3배 차이 나요' },
  { icon: Eye,    label: '나를 좋아한 사람 보기',      detail: '다시 숨겨져요' },
  { icon: Globe,  label: '글로벌 매칭 (전세계)',        detail: '근처만 다시 제한돼요' },
  { icon: Filter, label: 'MBTI·나이·언어 필터',        detail: '기본 필터만 남아요' },
  { icon: Zap,    label: '광고 없는 스와이프',          detail: '광고가 다시 생겨요' },
];

interface Props {
  isOpen: boolean;
  onKeep: () => void;          // 구독 유지 → Plus 모달 복귀
  onConfirmClose: () => void;  // 그냥 닫기
  plan?: 'plus' | 'premium';
}

export default function CancelRetentionModal({ isOpen, onKeep, onConfirmClose, plan = 'plus' }: Props) {
  const { t } = useTranslation();
  const isPremium = plan === 'premium';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-center justify-center px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onKeep} />

          <motion.div
            className="relative z-10 w-full max-w-sm bg-card rounded-[28px] overflow-hidden shadow-float"
            initial={{ scale: 0.85, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          >
            {/* 상단 그라데이션 헤더 */}
            <div
              className={`px-5 pt-6 pb-5 text-center ${
                isPremium
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                  : 'bg-gradient-to-br from-rose-500 to-pink-600'
              }`}
            >
              <motion.div
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3"
              >
                {isPremium ? <Crown size={28} className="text-white" /> : <Heart size={28} className="text-white" fill="white" />}
              </motion.div>
              <h2 className="text-white text-lg font-extrabold leading-tight">
                정말 떠나실 건가요? 😢
              </h2>
              <p className="text-white/80 text-xs mt-1.5 leading-relaxed">
                {isPremium ? 'Premium' : 'Plus'}을 해지하면<br />
                아래 혜택들을 <span className="font-extrabold text-white">즉시 잃게 됩니다.</span>
              </p>
            </div>

            {/* 잃게 될 혜택 리스트 */}
            <div className="px-4 py-3 space-y-2">
              {LOSS_ITEMS.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.05 * i, duration: 0.3 }}
                  className="flex items-center gap-3 py-1.5"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                    <item.icon size={14} className="text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground leading-tight">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.detail}</p>
                  </div>
                  <X size={12} className="text-rose-400 shrink-0" />
                </motion.div>
              ))}
            </div>

            {/* 한정 오퍼 배너 */}
            <div className="mx-4 mb-3 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <p className="text-xs font-extrabold text-amber-600 text-center">
                🎁 지금 구독하면 슈퍼라이크 +3개 보너스!
              </p>
              <p className="text-[10px] text-amber-500/80 text-center mt-0.5">
                오늘 하루만 제공되는 한정 혜택입니다
              </p>
            </div>

            {/* CTA 버튼 */}
            <div className="px-4 pb-6 space-y-2.5">
              {/* 구독 유지 (primary) */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onKeep}
                className={`w-full py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-float flex items-center justify-center gap-2 ${
                  isPremium
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-gradient-to-r from-rose-500 to-pink-600'
                }`}
              >
                {isPremium ? <Crown size={16} /> : <Heart size={16} fill="white" />}
                계속 구독 유지하기
              </motion.button>

              {/* 그냥 닫기 (secondary) */}
              <button
                onClick={onConfirmClose}
                className="w-full py-2.5 rounded-2xl text-muted-foreground text-xs font-semibold border border-border bg-muted/30 active:bg-muted/60 transition-colors"
              >
                혜택 없이 무료로 사용하기
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
