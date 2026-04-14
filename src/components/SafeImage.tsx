/**
 * SafeImage — 이미지 로드 실패 시 플레이스홀더로 자동 폴백
 * 
 * 사용법:
 *   <SafeImage src={user.photo_url} alt={user.name} className="w-10 h-10 rounded-full" />
 *
 * 특징:
 * - src가 없거나 로드 실패 시 이니셜 아바타 표시
 * - 무한 onError 루프 방지 (fallbackShown ref)
 * - loading="lazy" 기본값
 */
import { useRef, useState } from "react";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt?: string;
  fallbackInitial?: string; // 로드 실패 시 표시할 이니셜 (기본: alt 첫 글자)
  fallbackClassName?: string;
}

export function SafeImage({
  src,
  alt = "",
  fallbackInitial,
  fallbackClassName,
  className,
  ...props
}: SafeImageProps) {
  const [failed, setFailed] = useState(!src);
  const fallbackShown = useRef(false);

  const initial = (fallbackInitial ?? alt ?? "?")[0]?.toUpperCase() ?? "?";

  if (failed || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-bold select-none ${className ?? ""} ${fallbackClassName ?? ""}`}
        aria-label={alt}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (!fallbackShown.current) {
          fallbackShown.current = true;
          setFailed(true);
        }
      }}
      {...props}
    />
  );
}

export default SafeImage;
