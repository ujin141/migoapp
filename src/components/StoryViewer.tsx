import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Heart, MessageCircle, MoreHorizontal } from 'lucide-react';

interface StoryViewerProps {
  posts: any[];
  initialIndex: number;
  onClose: () => void;
  onLike?: (postId: string) => void;
  onComment?: (post: any) => void;
  onAuthorClick?: (authorId: string) => void;
  onMoreClick?: (post: any) => void;
}

export default function StoryViewer({ posts, initialIndex, onClose, onLike, onComment, onAuthorClick, onMoreClick }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const STORY_DURATION = 5000;
  
  // progress ref: stale closure 방지를 위해 항상 최신값 보관
  const progressRef = useRef(0);
  useEffect(() => { progressRef.current = progress; }, [progress]);

  const currentPost = posts[currentIndex];

  useEffect(() => {
    if (isPaused || !currentPost) return;

    // 현재 남은 진행률에서부터 시작 (일시정지 재개 시 position 유지)
    const startTime = Date.now() - progressRef.current / 100 * STORY_DURATION;
    let animationFrameId: number;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / STORY_DURATION) * 100;

      if (newProgress >= 100) {
        handleNext();
      } else {
        setProgress(newProgress);
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(animationFrameId);
  }, [currentIndex, isPaused, currentPost]);

  const handleNext = () => {
    if (currentIndex < posts.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose(); // End of stories
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    } else {
      // If first story, just reset progress
      setProgress(0);
    }
  };

  if (!currentPost) return null;

  let bgImage = currentPost.images?.[0] || currentPost.imageUrl;

  return (
    <div className="fixed inset-0 z-[200] bg-black h-[100dvh] w-full flex flex-col font-sans select-none">
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 z-50 px-2 pt-3 pb-2 flex gap-1 safe-area-inset-top">
        {posts.map((post, i) => (
          <div key={post.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-md">
            <div 
              className="h-full bg-white"
              style={{
                width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

       {/* Header Info */}
       <div className="absolute top-8 left-0 right-0 z-50 px-4 py-2 flex items-center justify-between pointer-events-none">
         <div 
           className="flex items-center gap-3 cursor-pointer pointer-events-auto"
           onClick={() => onAuthorClick?.(currentPost.authorId)}
         >
            <div className="w-10 h-10 rounded-full border-2 border-white/50 overflow-hidden shadow-sm shrink-0">
              <img src={currentPost.photo} className="w-full h-full object-cover" />
            </div>
            <div className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              <p className="text-[14px] font-bold">{currentPost.author}</p>
              <p className="text-[11px] text-white/90 flex items-center gap-1 font-medium mt-0.5">
                {currentPost.time}
                {currentPost.locationTag && (
                  <span className="flex items-center">
                    <span className="w-0.5 h-0.5 rounded-full bg-white/60 mx-1.5" />
                    <MapPin size={10} className="mr-0.5 text-white/80" />
                    {currentPost.locationTag.name}
                  </span>
                )}
              </p>
            </div>
         </div>
         <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-black/30 text-white backdrop-blur-md pointer-events-auto hover:bg-black/50 transition-colors">
           <X size={20} />
         </button>
       </div>

      {/* Main Image container */}
      <div className="flex-1 relative bg-zinc-950 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPost.id}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex flex-col justify-center"
          >
            {bgImage ? (
              <img src={bgImage} className="w-full h-full object-contain bg-zinc-950" />
            ) : (
              <div className="w-full h-full gradient-primary flex items-center justify-center p-8">
                 <p className="text-white text-xl font-bold whitespace-pre-wrap text-center drop-shadow-xl leading-relaxed">
                   {currentPost.content}
                 </p>
              </div>
            )}
            
            {/* Dark gradient at bottom for text visibility */}
            {bgImage && (
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
            )}
            
            {/* Content text */}
            {bgImage && currentPost.content && (
              <div className="absolute bottom-6 left-5 right-16 z-10 pointer-events-none drop-shadow-md">
                <p className="text-white text-[15px] font-medium leading-relaxed line-clamp-4">
                  {currentPost.content}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Touch Navigation Zones */}
        <div className="absolute inset-0 z-40 flex">
          <div 
            className="w-[30%] h-full cursor-pointer" 
            onClick={() => { setIsPaused(false); handlePrev(); }}
          />
          <div 
            className="w-[40%] h-full flex flex-col items-center justify-center cursor-pointer" 
            onClick={() => setIsPaused(prev => !prev)}
          >
            {isPaused && (
              <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-md">
                 <div className="w-5 h-6 border-l-4 border-r-4 border-white/90" />
              </div>
            )}
          </div>
          <div 
            className="w-[30%] h-full cursor-pointer" 
            onClick={() => { setIsPaused(false); handleNext(); }}
          />
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="h-[72px] flex items-center gap-5 px-5 z-50 bg-black text-white shrink-0 pb-safe">
         <button 
           className={`flex items-center gap-2 transition-colors py-2 ${currentPost.liked ? 'text-red-500' : 'hover:text-primary'}`}
           onClick={(e) => { e.stopPropagation(); onLike?.(currentPost.id); }}
         >
            <Heart size={26} strokeWidth={1.5} className={currentPost.liked ? "fill-red-500 text-red-500" : ""} />
            <span className="text-[14px] font-bold">{currentPost.likes || 0}</span>
         </button>
         <button 
           className="flex items-center gap-2 hover:text-primary transition-colors py-2"
           onClick={() => { setIsPaused(true); onComment?.(currentPost); }}
         >
            <MessageCircle size={26} strokeWidth={1.5} />
         </button>
         <div className="flex-1" />
         <button 
           className="text-white/80 hover:text-white py-2 transition-colors"
           onClick={() => { setIsPaused(true); onMoreClick?.(currentPost); }}
         >
            <MoreHorizontal size={26} strokeWidth={1.5} />
         </button>
      </div>
    </div>
  );
}
