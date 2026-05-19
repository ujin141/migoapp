import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  initialQuality?: number;
  fileType?: string; // e.g. "image/jpeg", "image/webp"
}

/**
 * 기본 압축 설정 (아마존, 인스타그램 등 글로벌 앱 통상 기준)
 * - 최대 1MB
 * - 가로세로 최대 1920px (보통 모바일 브라우저 한계치 및 레티나 고려)
 * - 품질 80% (눈으로 보기엔 원본과 거의 동일하지만 용량은 급감)
 * - Web Worker 사용으로 메인 스레드 멈춤 방지
 */
const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 0.3,
  maxWidthOrHeight: 1200,
  // ✅ Android WebView는 Web Worker를 지원하지 않아 false로 설정
  // (true이면 WebView에서 imageCompression이 throw하여 업로드 실패)
  useWebWorker: false,
  initialQuality: 0.75,
  fileType: "image/webp",
};

export async function compressImage(file: File, customOptions?: CompressionOptions): Promise<File> {
  // 🚨 [보안] 이미지가 아닌 파일 업로드 시도 원천 차단 (Unrestricted File Upload 방어)
  if (!file.type.startsWith('image/')) {
    throw new Error("Only image files are allowed.");
  }

  // GIF는 손실 압축하면 애니메이션이 망가지는 경우가 많아 제외할 수도 있지만
  // browser-image-compression은 기본적으로 알아서 처리함. 단, GIF는 용량 감소 폭이 적을 수 있음.

  const options = {
    ...DEFAULT_OPTIONS,
    ...customOptions,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    // 변환된 Blob을 다시 원래 이름이 유지된 File 객체로 변환
    // WebP로 캐스팅을 희망했으므로 확장자를 .webp로 변경해준다 (선택사항)
    let newName = file.name;
    if (options.fileType === "image/webp") {
      newName = newName.replace(/\.[^/.]+$/, ".webp");
    }

    const compressedFile = new File([compressedBlob], newName, {
      type: compressedBlob.type,
      lastModified: Date.now(),
    });
    // 프로덕션: 실패 시 console.warn은 남기되 불필요 정보 노출 제거
    return compressedFile;
  } catch (error) {
    // ✅ 압축 실패 시 원본 파일 반환 (이미지 파일은 이미 위에서 검증됨)
    // Android WebView 환경에서 WebP 변환이 실패할 수 있으므로 원본 사용
    console.warn("[imageCompression] 압축 실패, 원본 파일 사용:", error);
    return file;
  }
}
