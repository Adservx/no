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
        {/* Circular web structure */}
        <circle cx="50" cy="50" r="45" />
        <circle cx="50" cy="50" r="35" />
        <circle cx="50" cy="50" r="25" />
        <circle cx="50" cy="50" r="15" />
        
        {/* Radial lines */}
        <line x1="50" y1="5" x2="50" y2="95" />
        <line x1="5" y1="50" x2="95" y2="50" />
        <line x1="14.64" y1="14.64" x2="85.36" y2="85.36" />
        <line x1="14.64" y1="85.36" x2="85.36" y2="14.64" />
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
      <g stroke="currentColor" fill="none" strokeWidth="1.5" opacity="0.7">
        {/* Half-web structure */}
        <path d="M0,0 Q50,0 100,100" />
        <path d="M0,20 Q40,30 80,80" />
        <path d="M0,40 Q30,50 60,60" />
        <path d="M20,0 Q30,40 40,80" />
        <path d="M40,0 Q50,30 60,60" />
        
        {/* Connecting threads */}
        <path d="M0,0 L100,100" />
        <path d="M0,40 L60,60" />
        <path d="M40,0 L60,60" />
        
        {/* Small spider */}
        <circle cx="15" cy="15" r="3" fill="currentColor" stroke="none" />
        <path d="M15,15 L10,10" strokeWidth="0.8" />
        <path d="M15,15 L10,20" strokeWidth="0.8" />
        <path d="M15,15 L20,10" strokeWidth="0.8" />
        <path d="M15,15 L20,20" strokeWidth="0.8" />
      </g>
    </svg>
  );
};

export default { SpiderWebLogo, SpiderWebCorner }; 