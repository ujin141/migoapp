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
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  initialQuality: 0.8,
  fileType: "image/webp", // WebP 지원 환경이면 WebP 렌더링
};

export async function compressImage(file: File, customOptions?: CompressionOptions): Promise<File> {
  // 이미지가 아닌 경우 (동영상이나 다른 파일) 바로 원본 리턴
  if (!file.type.startsWith('image/')) {
    return file;
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

    console.log(`[ImageCompression] Original: ${(file.size / 1024 / 1024).toFixed(2)} MB -> Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    return compressedFile;
  } catch (error) {
    console.warn("Image compression failed, returning original file", error);
    return file;
  }
}
