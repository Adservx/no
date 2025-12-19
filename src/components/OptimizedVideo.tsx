import { useState, useRef, useEffect, memo } from 'react';

interface OptimizedVideoProps {
  src: string;
  poster?: string;
  className?: string;
  onClick?: () => void;
  autoPlay?: boolean;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
  previewMode?: boolean; // Show thumbnail until clicked
}

/**
 * Optimized Video Component
 * - Lazy loads video when in viewport
 * - Shows thumbnail/poster until user interacts
 * - Uses preload="metadata" for faster initial load
 * - Supports click-to-play preview mode
 */
const OptimizedVideo = memo(({
  src,
  poster,
  className = '',
  onClick,
  autoPlay = false,
  controls = true,
  muted = false,
  loop = false,
  previewMode = true
}: OptimizedVideoProps) => {
  const [isInView, setIsInView] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(!previewMode);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(poster || null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Generate thumbnail from video if no poster provided
  useEffect(() => {
    if (!poster && isInView && !thumbnailUrl) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.crossOrigin = 'anonymous';
      
      video.onloadeddata = () => {
        video.currentTime = 1; // Seek to 1 second
      };
      
      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            setThumbnailUrl(canvas.toDataURL('image/jpeg', 0.7));
          }
        } catch (e) {
          // CORS or other error, use default
          console.warn('Could not generate thumbnail:', e);
        }
        URL.revokeObjectURL(video.src);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
      };
      
      video.src = src;
    }
  }, [isInView, poster, src, thumbnailUrl]);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewMode && !showVideo) {
      setShowVideo(true);
      setIsLoading(true);
    }
    if (onClick) {
      onClick();
    }
  };

  const handleVideoLoaded = () => {
    setIsLoading(false);
    if (autoPlay && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked, user needs to interact
      });
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  return (
    <div 
      ref={containerRef}
      className={`optimized-video-container ${className}`}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      {isInView ? (
        <>
          {/* Thumbnail/Poster overlay */}
          {previewMode && !showVideo && (
            <div 
              className="video-thumbnail-overlay"
              onClick={handlePlayClick}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: thumbnailUrl 
                  ? `url(${thumbnailUrl}) center/cover no-repeat`
                  : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderRadius: 'inherit'
              }}
            >
              {/* Play button overlay */}
              <div 
                className="play-button-overlay"
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'rgba(140, 82, 255, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(140, 82, 255, 0.4)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <svg 
                  width="30" 
                  height="30" 
                  viewBox="0 0 24 24" 
                  fill="white"
                  style={{ marginLeft: '4px' }}
                >
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              
              {/* Video duration badge (if available) */}
              <div 
                className="video-badge"
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 500
                }}
              >
                🎬 Video
              </div>
            </div>
          )}

          {/* Loading spinner */}
          {showVideo && isLoading && (
            <div 
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 5
              }}
            >
              <div 
                className="video-loading-spinner"
                style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid rgba(140, 82, 255, 0.3)',
                  borderTop: '3px solid #8c52ff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}
              />
            </div>
          )}

          {/* Actual video element */}
          {showVideo && (
            <video
              ref={videoRef}
              src={src}
              poster={thumbnailUrl || undefined}
              className={`optimized-video ${isLoading ? 'loading' : ''}`}
              controls={controls}
              muted={muted}
              loop={loop}
              playsInline
              preload="metadata"
              onLoadedData={handleVideoLoaded}
              onPlay={handlePlay}
              onPause={handlePause}
              onClick={onClick}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: isLoading ? 0.5 : 1,
                transition: 'opacity 0.3s'
              }}
            />
          )}
        </>
      ) : (
        // Placeholder while not in view
        <div 
          style={{
            width: '100%',
            height: '100%',
            minHeight: '200px',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'inherit'
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            🎬 Loading video...
          </span>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .video-thumbnail-overlay:hover .play-button-overlay {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(140, 82, 255, 0.6);
        }
        
        .optimized-video-container {
          overflow: hidden;
        }
      `}</style>
    </div>
  );
});

OptimizedVideo.displayName = 'OptimizedVideo';

export default OptimizedVideo;
