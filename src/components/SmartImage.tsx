import { useState, useEffect } from 'react';
import { isHeicUrl, convertHeicToJpeg } from '../utils/heicConverter';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
}

export default function SmartImage({ src, alt, className, loading = 'lazy', decoding = 'async' }: SmartImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isHeicUrl(src)) {
      setIsConverting(true);
      setProgress(0);
      convertHeicToJpeg(src, setProgress)
        .then(convertedUrl => {
          setImageSrc(convertedUrl);
        })
        .finally(() => {
          setIsConverting(false);
        });
    } else {
      setImageSrc(src);
    }
  }, [src]);

  if (isConverting) {
    return (
      <div 
        className={className} 
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'var(--bg-secondary, #1a1a2e)', 
          minHeight: '200px',
          gap: '16px',
          padding: '20px'
        }}
      >
        <div style={{ 
          width: '100%', 
          maxWidth: '280px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Converting HEIC to JPEG</span>
            <span style={{ color: 'var(--accent, #F90)', fontSize: '0.85rem', fontWeight: 600 }}>{progress}%</span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255, 153, 0, 0.15)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #F90, #FFA31A)',
              borderRadius: '3px',
              transition: 'width 0.2s ease-out'
            }} />
          </div>
          <span style={{ 
            color: '#999', 
            fontSize: '0.8rem', 
            textAlign: 'center',
            marginTop: '4px'
          }}>
            {progress < 50 ? '📥 Downloading...' : progress < 95 ? '⚙️ Processing...' : '✨ Finalizing...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
    />
  );
}
