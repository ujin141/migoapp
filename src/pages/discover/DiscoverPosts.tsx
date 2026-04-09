import i18n from "@/i18n";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, MapPin, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DiscoverPostsProps {
  activeTab: string;
  loadingPosts: boolean;
  sortedPosts: any[];
  readStories: Set<string>;
  handleStoryClick: (index: number, postId: string) => void;
  deletePost: (postId: string) => void;
  user: any;
}

export const DiscoverPosts = ({
  activeTab,
  loadingPosts,
  sortedPosts,
  readStories,
  handleStoryClick,
  deletePost,
  user
}: DiscoverPostsProps) => {
  return (
    <AnimatePresence mode="wait">
      {activeTab === "community" && <motion.div
        key="community"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
        className="px-4 space-y-3 pt-2 pb-24"
      >
        {loadingPosts ? <div className="flex items-center justify-center py-16">
            <motion.div className="w-8 h-8 rounded-full gradient-primary" animate={{
        scale: [1, 1.2, 1]
      }} transition={{
        repeat: Infinity,
        duration: 1
      }} />
          </div> : sortedPosts.length === 0 ? <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={24} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm truncate">{i18n.t("auto.g_1393", "첫게시글을")}</p>
          </div> : <div className="flex flex-col gap-5 px-1 truncate">
            {sortedPosts.map((post: any, index: number) => {
              const isRead = readStories.has(post.id);
              return (
               <motion.div 
                key={post.id} 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                className={`w-full aspect-[4/5] rounded-[24px] cursor-pointer shadow-md group p-[3px] ${!isRead ? 'bg-gradient-to-tr from-amber-400 via-orange-500 to-pink-500' : 'bg-transparent'}`}
                onClick={() => handleStoryClick(index, post.id)}
               >
                <div className="relative w-full h-full bg-muted rounded-[21px] overflow-hidden">
                  {/* Thumbnail Image */}
                  {(post.images?.[0] || post.imageUrl) ? (
                    <img 
                      src={post.images?.[0] || post.imageUrl} 
                      className="w-full h-full object-cover transition-transform duration-700" 
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full gradient-primary flex items-center justify-center p-6">
                      <p className="text-white font-extrabold text-[18px] leading-relaxed drop-shadow-md break-keep whitespace-pre-wrap text-center">{post.content}</p>
                    </div>
                  )}

                  {/* Overlay Gradient for readability */}
                  <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                  {/* Profile info on top */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/30 backdrop-blur-md rounded-full pr-3 p-1 border border-white/20 shadow-sm">
                    <img src={post.photo} className="w-8 h-8 rounded-full object-cover border-2 border-white/80" />
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-white leading-none drop-shadow-sm">{post.author}</span>
                      <span className="text-[9px] font-medium text-white/80">{post.time}</span>
                    </div>
                  </div>

                  {/* Location, Action & Content info at bottom */}
                  <div className="absolute bottom-4 inset-x-4 flex flex-col gap-3">
                    {post.content && (post.images?.[0] || post.imageUrl) && (
                      <p className="text-white text-[14px] font-semibold line-clamp-2 leading-snug drop-shadow-md">
                        {post.content}
                      </p>
                    )}
                    
                    <div className="flex items-end justify-between truncate">
                      <div className="flex items-center gap-2">
                        {post.locationTag && (
                          <div className="text-[11px] text-white/95 flex items-center gap-1 bg-black/40 px-2.5 py-1.5 rounded-xl backdrop-blur-md border border-white/10">
                            <MapPin size={12} className="text-white" />
                            <span className="truncate max-w-[120px] font-bold">{post.locationTag.name}</span>
                          </div>
                        )}
                      </div>

                      {user && post.authorId === user.id && (
                         <button onClick={e => {
                           e.stopPropagation();
                           deletePost(post.id);
                         }} className="w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center hover:bg-red-500 transition-colors backdrop-blur-md shadow-sm">
                           <Trash2 size={14} className="text-white" />
                         </button>
                      )}
                    </div>
                  </div>
                </div>
               </motion.div>
              );
            })}
          </div>}
      </motion.div>}
    </AnimatePresence>
  );
};
