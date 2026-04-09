import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, MapPin, Languages, Send } from "lucide-react";
import i18n from "@/i18n";
import { Post } from "@/types";

interface PostDetailModalProps {
  detailPost: Post | null;
  setDetailPost: (post: Post | null) => void;
  t: any;
  handleProfileClick: (e: React.MouseEvent, authorId: string) => void;
  handleTranslate: (text: string, refId: string) => void;
  translateMap: Record<string, string>;
  loadingMap: Record<string, boolean>;
  user: any;
  commentText: string;
  setCommentText: (text: string) => void;
  setCommentPost: (post: Post | null) => void;
  handleSubmitComment: () => void;
}

export const PostDetailModal = ({
  detailPost,
  setDetailPost,
  t,
  handleProfileClick,
  handleTranslate,
  translateMap,
  loadingMap,
  user,
  commentText,
  setCommentText,
  setCommentPost,
  handleSubmitComment
}: PostDetailModalProps) => {
  return (
    <AnimatePresence>
      {detailPost && (
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-0 z-50 bg-background overflow-y-auto">
          <div className="px-5 pt-12 pb-32 truncate">
            <button onClick={() => setDetailPost(null)} className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <ArrowLeft size={16} />{i18n.t("discover.backToList", { defaultValue: "목록으로" })}
            </button>

            <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={(e) => handleProfileClick(e, detailPost.authorId)}>
              <img src={detailPost.photo} alt="" className="w-10 h-10 rounded-full object-cover" loading="lazy" />
              <div>
                <p className="text-sm font-bold text-foreground hover:underline">{detailPost.author}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  {detailPost.time}
                  {detailPost.locationTag && (
                    <span className="flex items-center gap-0.5 text-primary">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground mx-1" />
                      <MapPin size={10} />
                      {detailPost.locationTag.name}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <p className="text-sm text-foreground leading-relaxed mb-4">{detailPost.content}</p>

            {/* Images */}
            {detailPost.images && detailPost.images.length > 0 ? (
              <div className={`grid gap-2 mb-4 ${detailPost.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {detailPost.images.map((img, idx) => (
                  <img key={idx} src={img} alt="" className="w-full rounded-xl object-cover" style={{ maxHeight: 320 }} loading="lazy" />
                ))}
              </div>
            ) : detailPost.imageUrl ? (
              <img src={detailPost.imageUrl} alt="" className="w-full rounded-xl object-cover mb-4" style={{ maxHeight: 320 }} loading="lazy" />
            ) : null}

            {/* Translate */}
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => handleTranslate(detailPost.content, `detail_${detailPost.id}`)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${translateMap[`detail_${detailPost.id}`] ? "bg-indigo-500/20 text-indigo-500" : "bg-muted text-muted-foreground"}`}>
                {loadingMap[`detail_${detailPost.id}`] ? (
                  <motion.div className="w-3 h-3 rounded-full bg-current" animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.7 }} />
                ) : (
                  <Languages size={12} />
                )}
                {translateMap[`detail_${detailPost.id}`] ? i18n.t("auto.g_1402", "원문보기") : i18n.t("auto.g_1403", "번역하기")}
              </button>
            </div>
            {translateMap[`detail_${detailPost.id}`] && (
              <p className="text-sm text-indigo-400 leading-relaxed bg-indigo-500/5 rounded-xl p-3 mb-4">
                {translateMap[`detail_${detailPost.id}`]}
              </p>
            )}

            {/* Comments */}
            <h3 className="text-sm font-extrabold text-foreground mb-3 truncate">{i18n.t("auto.g_1404", "댓글 ")}{detailPost.commentList.length}{i18n.t("auto.g_1405", "개")}</h3>
            <div className="space-y-3 mb-4">
              {detailPost.commentList.map((c: any) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <img src={c.photo} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" loading="lazy" />
                  <div className="bg-muted rounded-2xl px-3 py-2 flex-1">
                    <p className="text-xs font-bold text-foreground mb-0.5">{c.author}</p>
                    <p className="text-xs text-foreground/80">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment input */}
            {user && (
              <div className="flex items-center gap-2">
                <input value={commentText} onChange={e => setCommentText(e.target.value)} onFocus={() => setCommentPost(detailPost)} placeholder={i18n.t("auto.g_1406", "댓글을 남겨보세요...")} className="flex-1 bg-muted rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                <button onClick={handleSubmitComment} disabled={!commentText.trim()} className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center disabled:opacity-40">
                  <Send size={14} className="text-primary-foreground" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
