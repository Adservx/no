import heic2any from 'heic2any';

// Cache converted URLs to avoid re-converting
const convertedCache = new Map<string, string>();

export function isHeicUrl(url: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.heic') || lowerUrl.includes('.heif');
}

export type ProgressCallback = (progress: number) => void;

export async function convertHeicToJpeg(
  heicUrl: string,
  onProgress?: ProgressCallback
): Promise<string> {
  // Return cached result if available
  if (convertedCache.has(heicUrl)) {
    onProgress?.(100);
    return convertedCache.get(heicUrl)!;
  }

  try {
    onProgress?.(5); // Starting fetch

    // Fetch the HEIC file with progress tracking
    const response = await fetch(heicUrl);
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    if (!response.body || !total) {
      // Fallback if streaming not supported
      onProgress?.(30);
      const blob = await response.blob();
      onProgress?.(50);
      return await performConversion(blob, heicUrl, onProgress);
    }

    // Stream the response to track download progress
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      // Download is 0-50% of total progress
      const downloadProgress = Math.round((received / total) * 50);
      onProgress?.(downloadProgress);
    }

    const blob = new Blob(chunks as BlobPart[]);
    return await performConversion(blob, heicUrl, onProgress);
  } catch (error) {
    console.error('Failed to convert HEIC:', error);
    onProgress?.(100);
    return heicUrl;
  }
}

async function performConversion(
  blob: Blob,
  heicUrl: string,
  onProgress?: ProgressCallback
): Promise<string> {
  onProgress?.(55); // Starting conversion

  // Simulate smooth progress during conversion (heic2any doesn't provide progress)
  let currentProgress = 55;
  const progressTimer = setInterval(() => {
    if (currentProgress < 98) {
      // Slow down as we approach 98% for smoother feel
      const increment = currentProgress < 80 ? 3 : currentProgress < 90 ? 2 : 1;
      currentProgress = Math.min(98, currentProgress + increment);
      onProgress?.(currentProgress);
    }
  }, 150);

  try {
    const jpegBlob = await heic2any({
      blob,
      toType: 'image/jpeg',
      quality: 0.85
    });

    clearInterval(progressTimer);

    // Smooth finish from current to 100
    const finishProgress = async () => {
      for (let p = currentProgress; p <= 100; p += 1) {
        onProgress?.(p);
        await new Promise(r => setTimeout(r, 20));
      }
    };

    const resultBlob = Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob;
    const objectUrl = URL.createObjectURL(resultBlob);

    convertedCache.set(heicUrl, objectUrl);
    await finishProgress();

    return objectUrl;
  } catch (error) {
    clearInterval(progressTimer);
    throw error;
  }
}
