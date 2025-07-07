import React from 'react';

interface SpiderWebProps {
  className?: string;
  size?: number;
}

export const SpiderWebLogo: React.FC<SpiderWebProps> = ({ className = '', size = 20 }) => {
  return (
    <svg 
      className={`spider-web-logo ${className}`}
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="currentColor" fill="none" strokeWidth="2">
        {/* Circular web structure - more circles for fullness */}
        <circle cx="50" cy="50" r="45" />
        <circle cx="50" cy="50" r="38" />
        <circle cx="50" cy="50" r="31" />
        <circle cx="50" cy="50" r="24" />
        <circle cx="50" cy="50" r="17" />
        <circle cx="50" cy="50" r="10" />
        
        {/* Radial lines - more lines for fullness */}
        <line x1="50" y1="5" x2="50" y2="95" />
        <line x1="5" y1="50" x2="95" y2="50" />
        <line x1="14.64" y1="14.64" x2="85.36" y2="85.36" />
        <line x1="14.64" y1="85.36" x2="85.36" y2="14.64" />
        <line x1="27.32" y1="8.79" x2="72.68" y2="91.21" />
        <line x1="8.79" y1="27.32" x2="91.21" y2="72.68" />
        <line x1="8.79" y1="72.68" x2="91.21" y2="27.32" />
        <line x1="27.32" y1="91.21" x2="72.68" y2="8.79" />
      </g>
    </svg>
  );
};

export const SpiderWebCorner: React.FC<SpiderWebProps> = ({ className = '', size = 80 }) => {
  return (
    <svg 
      className={`spider-web-corner ${className}`}
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="currentColor" fill="none" strokeWidth="1.5" opacity="0.9">
        {/* Half-web structure - more paths for fullness */}
        <path d="M0,0 Q50,0 100,100" />
        <path d="M0,15 Q45,20 90,90" />
        <path d="M0,30 Q40,35 80,80" />
        <path d="M0,45 Q35,45 70,70" />
        <path d="M0,60 Q30,55 60,60" />
        <path d="M15,0 Q25,35 35,85" />
        <path d="M30,0 Q35,30 45,75" />
        <path d="M45,0 Q50,25 55,65" />
        <path d="M60,0 Q60,20 65,55" />
        
        {/* Connecting threads */}
        <path d="M0,0 L100,100" />
        <path d="M0,30 L80,80" />
        <path d="M0,60 L60,60" />
        <path d="M30,0 L45,75" />
        <path d="M60,0 L65,55" />
        
        {/* Small spider */}
        <circle cx="15" cy="15" r="3" fill="currentColor" stroke="none" />
        <path d="M15,15 L10,10" strokeWidth="0.8" />
        <path d="M15,15 L10,20" strokeWidth="0.8" />
        <path d="M15,15 L20,10" strokeWidth="0.8" />
        <path d="M15,15 L20,20" strokeWidth="0.8" />
        <path d="M15,15 L8,15" strokeWidth="0.8" />
        <path d="M15,15 L22,15" strokeWidth="0.8" />
        <path d="M15,15 L15,8" strokeWidth="0.8" />
        <path d="M15,15 L15,22" strokeWidth="0.8" />
      </g>
    </svg>
  );
};

export default { SpiderWebLogo, SpiderWebCorner }; 