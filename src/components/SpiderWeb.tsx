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
      <g stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Radial support lines */}
        <path d="M50,50 L50,5" opacity="0.8" />
        <path d="M50,50 L81.8,18.2" opacity="0.8" />
        <path d="M50,50 L95,50" opacity="0.8" />
        <path d="M50,50 L81.8,81.8" opacity="0.8" />
        <path d="M50,50 L50,95" opacity="0.8" />
        <path d="M50,50 L18.2,81.8" opacity="0.8" />
        <path d="M50,50 L5,50" opacity="0.8" />
        <path d="M50,50 L18.2,18.2" opacity="0.8" />

        {/* Web "spirals" with realistic sag */}
        {/* We use Q curves where the control point pulls towards the center slightly */}
        <path d="M50,15 Q60,20 74.7,25.3 L74.7,25.3 Q80,40 85,50 L85,50 Q80,60 74.7,74.7 L74.7,74.7 Q60,80 50,85 L50,85 Q40,80 25.3,74.7 L25.3,74.7 Q20,60 15,50 L15,50 Q20,40 25.3,25.3 L25.3,25.3 Q40,20 50,15" opacity="0.9" />

        <path d="M50,25 Q58,28 67.7,32.3 L67.7,32.3 Q72,40 75,50 L75,50 Q72,60 67.7,67.7 L67.7,67.7 Q60,72 50,75 L50,75 Q40,72 32.3,67.7 L32.3,67.7 Q28,60 25,50 L25,50 Q28,40 32.3,32.3 L32.3,32.3 Q40,28 50,25" opacity="0.9" />

        <path d="M50,35 Q55,37 60.6,39.4 L60.6,39.4 Q63,45 65,50 L65,50 Q63,55 60.6,60.6 L60.6,60.6 Q55,63 50,65 L50,65 Q45,63 39.4,60.6 L39.4,60.6 Q37,55 35,50 L35,50 Q37,45 39.4,39.4 L39.4,39.4 Q45,37 50,35" opacity="0.9" />

        {/* Small center spiral/mess */}
        <path d="M50,42 Q52,43 53.5,46.5 L53.5,46.5 Q54,48 53.5,53.5 L53.5,53.5 Q48,54 46.5,53.5 L46.5,53.5 Q46,48 50,42" opacity="0.8" />
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
      <g stroke="currentColor" fill="none" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Radial support lines from corner */}
        <path d="M0,0 L90,15" opacity="0.6" />
        <path d="M0,0 L85,45" opacity="0.6" />
        <path d="M0,0 L45,85" opacity="0.6" />
        <path d="M0,0 L15,90" opacity="0.6" />

        {/* Cross threads with sagging */}
        {/* Outermost */}
        <path d="M90,15 Q70,40 85,45" />
        <path d="M85,45 Q55,55 45,85" />
        <path d="M45,85 Q40,70 15,90" />

        {/* Middle */}
        <path d="M70,12 Q55,30 65,35" />
        <path d="M65,35 Q40,40 35,65" />
        <path d="M35,65 Q30,55 12,70" />

        {/* Innermost */}
        <path d="M50,8 Q40,20 48,25" />
        <path d="M48,25 Q30,30 25,48" />
        <path d="M25,48 Q20,40 8,50" />

        {/* Tiny inner details */}
        <path d="M30,5 Q25,12 30,15" />
        <path d="M30,15 Q20,20 15,30" />
        <path d="M15,30 Q12,25 5,30" />

        {/* Small spider */}
        <g transform="translate(60, 40) rotate(45)">
          <line x1="0" y1="0" x2="0" y2="-10" strokeWidth="0.5" /> {/* Thread */}
          <circle cx="0" cy="0" r="3" fill="currentColor" stroke="none" />
          <path d="M0,0 L-4,-4 M0,0 L4,-4 M0,0 L-5,0 M0,0 L5,0" strokeWidth="1" />
          <path d="M0,0 L-4,4 M0,0 L4,4" strokeWidth="1" />
        </g>
      </g>
    </svg>
  );
};

export default { SpiderWebLogo, SpiderWebCorner }; 