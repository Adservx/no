/**
 * Video Compression Utility
 * Compresses videos before upload for faster loading
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  videoBitrate?: number;
  audioBitrate?: number;
  onProgress?: (progress: number) => void;
}

interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

// Check if browser supports video compression via MediaRecorder
export const isCompressionSupported = (): boolean => {
  return typeof MediaRecorder !== 'undefined' && 
         typeof HTMLVideoElement !== 'undefined' &&
         typeof HTMLCanvasElement !== 'undefined';
};

// Get video metadata (duration, dimensions)
export const getVideoMetadata = (file: File): Promise<{ duration: number; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight
      });
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

// Generate video thumbnail
export const generateVideoThumbnail = (file: File, timeInSeconds: number = 1): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(timeInSeconds, video.duration * 0.1);
    };
    
    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(video.src);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        },
        'image/jpeg',
        0.8
      );
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video for thumbnail'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

// Compress video using canvas and MediaRecorder
export const compressVideo = async (
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  const {
    maxWidth = 1280,
    maxHeight = 720,
    videoBitrate = 1500000, // 1.5 Mbps
    audioBitrate = 128000,  // 128 kbps
    onProgress
  } = options;

  // If file is already small (< 5MB), skip compression
  if (file.size < 5 * 1024 * 1024) {
    return {
      blob: file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1
    };
  }

  // Check browser support
  if (!isCompressionSupported()) {
    console.warn('Video compression not supported, returning original file');
    return {
      blob: file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1
    };
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = async () => {
      // Calculate scaled dimensions
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;

      // Check for MediaRecorder support with webm
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : 'video/webm';

      const chunks: Blob[] = [];
      const stream = canvas.captureStream(30); // 30 fps

      // Try to add audio track if available
      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const destination = audioCtx.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioCtx.destination);
        
        destination.stream.getAudioTracks().forEach(track => {
          stream.addTrack(track);
        });
      } catch (e) {
        // Audio extraction failed, continue without audio
        console.warn('Could not extract audio:', e);
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: videoBitrate,
        audioBitsPerSecond: audioBitrate
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        URL.revokeObjectURL(video.src);
        const blob = new Blob(chunks, { type: mimeType });
        
        // If compressed is larger than original, return original
        if (blob.size >= file.size) {
          resolve({
            blob: file,
            originalSize: file.size,
            compressedSize: file.size,
            compressionRatio: 1
          });
        } else {
          resolve({
            blob,
            originalSize: file.size,
            compressedSize: blob.size,
            compressionRatio: file.size / blob.size
          });
        }
      };

      recorder.onerror = (e) => {
        URL.revokeObjectURL(video.src);
        reject(e);
      };

      // Start recording
      recorder.start(100); // Collect data every 100ms
      video.play();

      // Draw frames to canvas
      const drawFrame = () => {
        if (video.paused || video.ended) {
          recorder.stop();
          return;
        }
        
        ctx.drawImage(video, 0, 0, width, height);
        
        // Report progress
        if (onProgress && video.duration) {
          const progress = (video.currentTime / video.duration) * 100;
          onProgress(Math.min(progress, 99));
        }
        
        requestAnimationFrame(drawFrame);
      };

      video.onplay = () => {
        drawFrame();
      };

      video.onended = () => {
        onProgress?.(100);
        recorder.stop();
      };
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video for compression'));
    };

    video.src = URL.createObjectURL(file);
  });
};

// Quick compress - reduces quality for faster upload
export const quickCompressVideo = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<CompressionResult> => {
  return compressVideo(file, {
    maxWidth: 854,  // 480p width
    maxHeight: 480,
    videoBitrate: 800000, // 800 kbps
    audioBitrate: 96000,  // 96 kbps
    onProgress
  });
};

// Check if file is a video
export const isVideoFile = (file: File): boolean => {
  return file.type.startsWith('video/') || 
         /\.(mp4|webm|mov|avi|mkv|m4v)$/i.test(file.name);
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};
