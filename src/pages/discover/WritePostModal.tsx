import i18n from "@/i18n";
import { AnimatePresence, motion } from "framer-motion";
import { X, MapPin, Compass, ImageIcon, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface WritePostModalProps {
  showWriteModal: boolean;
  setShowWriteModal: (show: boolean) => void;
  attachedImages: { url: string; file: File; id: string }[];
  setAttachedImages: (images: { url: string; file: File; id: string }[]) => void;
  writeContent: string;
  setWriteContent: (content: string) => void;
  handleSubmitPost: () => void;
  writeLocationName: string;
  handleLocationInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  locationFocus: boolean;
  setLocationFocus: (focus: boolean) => void;
  addressSuggestions: any[];
  handleSelectSuggestion: (suggestion: any) => void;
  handleCurrentLocationClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const WritePostModal = ({
  showWriteModal,
  setShowWriteModal,
  attachedImages,
  setAttachedImages,
  writeContent,
  setWriteContent,
  handleSubmitPost,
  writeLocationName,
  handleLocationInputChange,
  locationFocus,
  setLocationFocus,
  addressSuggestions,
  handleSelectSuggestion,
  handleCurrentLocationClick,
  fileInputRef,
  handleFileSelect
}: WritePostModalProps) => {
  return (
    <AnimatePresence>
      {showWriteModal && <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-0 z-[200] bg-black font-sans">
        {/* Background Image */}
        {attachedImages.length > 0 ? (
          <img src={attachedImages[0].url} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300" style={{ opacity: 0.85 }} />
        ) : (
          <div className="absolute inset-0 w-full h-full gradient-primary opacity-30" />
        )}

        {/* Top Bar */}
        <div className="relative z-10 px-5 pt-safe mt-4 flex items-center justify-between pointer-events-none">
          <button onClick={() => setShowWriteModal(false)} className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-md pointer-events-auto shadow-sm">
            <X size={20} />
          </button>
          <button 
            onClick={handleSubmitPost} 
            disabled={!writeContent.trim() && attachedImages.length === 0} 
            className="px-5 py-2.5 rounded-full bg-white text-black font-extrabold text-sm pointer-events-auto shadow-lg disabled:opacity-50 transition-opacity"
          >
            {i18n.t("auto.g_1407", "스토리 올리기")}</button>
        </div>

        {/* Main Content */}
        <div className="relative z-10 px-5 h-[calc(100vh-140px)] flex flex-col pointer-events-none">
            <div className="flex-1 flex flex-col justify-center items-center">
              <textarea 
                value={writeContent} 
                onChange={e => setWriteContent(e.target.value)} 
                placeholder={i18n.t("auto.g_1410", "무슨 생각을 하고 계신가요?")}
                className="w-full bg-transparent text-white placeholder-white/70 text-2xl font-extrabold text-center outline-none resize-none overflow-visible drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pointer-events-auto"
                rows={5}
              />
            </div>

            {/* Bottom Actions */}
            <div className="pointer-events-auto flex flex-col gap-3 pb-safe mb-4 truncate">
              
              {/* Location */}
              <div className="relative">
                <div className="flex items-center bg-black/40 backdrop-blur-md rounded-2xl p-0.5 border border-white/20 shadow-lg">
                  <div className="pl-4 pr-3 py-3">
                    <MapPin size={20} className="text-white" />
                  </div>
                  <input 
                    value={writeLocationName} 
                    onChange={handleLocationInputChange} 
                    onFocus={() => setLocationFocus(true)} 
                    onBlur={() => setTimeout(() => setLocationFocus(false), 200)} 
                    placeholder={i18n.t("auto.g_1411", "위치 추가 (눌러서 검색)")} 
                    className="flex-1 bg-transparent text-white placeholder:text-white/70 text-[15px] font-bold outline-none border-none py-3" 
                  />
                  <button type="button" onClick={handleCurrentLocationClick} className="px-4 py-3 bg-white/10 hover:bg-white/20 transition-colors rounded-xl mx-1" title={i18n.t("auto.g_1412", "현재 내 위치")}>
                    <Compass size={18} className="text-white" />
                  </button>
                </div>

                <AnimatePresence>
                  {locationFocus && addressSuggestions.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute bottom-[60px] left-0 right-0 mb-2 bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.3)] z-20 max-h-48 overflow-y-auto overflow-hidden">
                      {addressSuggestions.map(h => (
                        <button key={`ac_${h.placeId}`} className="w-full text-left px-4 py-3 hover:bg-white/10 text-white text-sm flex items-center gap-3 border-b border-white/10 last:border-0 transition-colors" onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(h); }}>
                          <MapPin size={16} className="text-white/80 shrink-0" />
                          <span className="font-bold truncate">{h.description}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Photo Select */}
              {attachedImages.length === 0 ? (
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-black/40 hover:bg-black/60 backdrop-blur-md px-4 py-4 rounded-2xl transition-colors w-full border border-white/20 shadow-lg">
                  <ImageIcon size={20} className="text-white" />
                  <span className="text-white font-black text-[15px] truncate">{i18n.t("auto.g_1408", "배경 사진 선택")}</span>
                </button>
              ) : (
                <button onClick={() => setAttachedImages([])} className="flex items-center justify-center gap-2 bg-black/40 hover:bg-black/60 backdrop-blur-md px-4 py-4 rounded-2xl transition-colors w-full border border-white/20 shadow-lg">
                  <Trash2 size={20} className="text-red-400" />
                  <span className="text-red-400 font-black text-[15px] truncate">{i18n.t("auto.g_1409", "사진 지우기")}</span>
                </button>
              )}
            </div>
        </div>
        
        <input ref={fileInputRef as any} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
      </motion.div>}
    </AnimatePresence>
  );
};
