import React from 'react';

interface SpiderWebProps {
  className?: string;
  size?: number;
}

// Reusable Realistic Spider Component
// x, y: position
// scale: size multiplier
// rotation: rotation in degrees
const RealisticSpider = ({ x, y, scale = 1, rotation = 0 }: { x: number, y: number, scale?: number, rotation?: number }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}>

    {/* Legs - Left Side (Upper) */}
    <path d="M-2,-2 Q-6,-6 -11,-5" strokeWidth="0.8" fill="none" strokeLinecap="round" />
    <path d="M-2,0 Q-8,-1 -13,0" strokeWidth="0.8" fill="none" strokeLinecap="round" />
    {/* Legs - Left Side (Lower) */}
    <path d="M-2,2 Q-8,4 -11,7" strokeWidth="0.8" fill="none" strokeLinecap="round" />
    <path d="M-2,4 Q-5,8 -7,11" strokeWidth="0.8" fill="none" strokeLinecap="round" />

    {/* Legs - Right Side (Upper) */}
    <path d="M2,-2 Q6,-6 11,-5" strokeWidth="0.8" fill="none" strokeLinecap="round" />
    <path d="M2,0 Q8,-1 13,0" strokeWidth="0.8" fill="none" strokeLinecap="round" />
    {/* Legs - Right Side (Lower) */}
    <path d="M2,2 Q8,4 11,7" strokeWidth="0.8" fill="none" strokeLinecap="round" />
    <path d="M2,4 Q5,8 7,11" strokeWidth="0.8" fill="none" strokeLinecap="round" />

    {/* Thread (optional, for hanging spiders) */}
    {/* By default no thread here, parent adds it if needed */}

    {/* Body Parts */}
    {/* Abdomen (larger back part) - slightly oval */}
    <ellipse cx="0" cy="4" rx="3.5" ry="4.5" fill="currentColor" />
    {/* Cephalothorax (smaller head part) */}
    <circle cx="0" cy="-1.5" r="2.5" fill="currentColor" />

    {/* Chelicerae (Jaws/Mouthparts) */}
    <path d="M-1,-3.5 L-1.5,-5" strokeWidth="0.5" />
    <path d="M1,-3.5 L1.5,-5" strokeWidth="0.5" />
  </g>
);

export const SpiderWebLogo: React.FC<SpiderWebProps> = ({ className = '', size = 20 }) => {
  return (
    <svg
      className={`spider-web-logo ${className}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="currentColor" fill="none" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Irregular Radial support lines for organic feel */}
        <path d="M50,50 L52,5" opacity="0.6" />
        <path d="M50,50 L85,15" opacity="0.6" />
        <path d="M50,50 L95,55" opacity="0.6" />
        <path d="M50,50 L80,85" opacity="0.6" />
        <path d="M50,50 L45,95" opacity="0.6" />
        <path d="M50,50 L15,80" opacity="0.6" />
        <path d="M50,50 L5,45" opacity="0.6" />
        <path d="M50,50 L20,15" opacity="0.6" />

        {/* Organic Spiral Webbing with sagging */}
        {/* Using disjointed paths to mimic real erratic webs often seen */}
        <path d="M50,25 Q60,30 70,35 T80,55 T75,75 T50,85 T25,75 T20,55 T30,35 T50,25" opacity="0.8" />
        <path d="M50,15 Q65,20 80,25 T95,55" opacity="0.7" />
        <path d="M5,55 Q20,20 50,15" opacity="0.7" />
        <path d="M20,85 Q10,60 5,55" opacity="0.7" />
        <path d="M80,85 Q65,95 45,95" opacity="0.7" />
        <path d="M20,15 Q35,5 52,5" opacity="0.7" />

        {/* Realistic Spider in the center slightly offset */}
        <RealisticSpider x={45} y={45} scale={1.2} rotation={-15} />
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
      <g stroke="currentColor" fill="none" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        {/* Anchor Threads - slightly heavier */}
        <path d="M0,0 L90,10" strokeWidth="1.5" opacity="0.7" />
        <path d="M0,0 L85,50" strokeWidth="1.5" opacity="0.7" />
        <path d="M0,0 L50,85" strokeWidth="1.5" opacity="0.7" />
        <path d="M0,0 L10,90" strokeWidth="1.5" opacity="0.7" />

        {/* Cross Threads - thinner and sagging */}
        {/* Outer Layer */}
        <path d="M90,10 Q70,30 85,50" opacity="0.8" />
        <path d="M85,50 Q60,60 50,85" opacity="0.8" />
        <path d="M50,85 Q40,80 10,90" opacity="0.8" />

        {/* Mid Layer */}
        <path d="M70,8 Q55,25 65,38" opacity="0.8" />
        <path d="M65,38 Q45,45 38,65" opacity="0.8" />
        <path d="M38,65 Q35,60 8,70" opacity="0.8" />

        {/* Inner Layer */}
        <path d="M50,6 Q40,15 45,26" opacity="0.8" />
        <path d="M45,26 Q30,30 26,45" opacity="0.8" />
        <path d="M26,45 Q20,40 6,50" opacity="0.8" />

        {/* Tiny messy center details */}
        <path d="M30,5 Q20,10 25,20 T15,25 T5,30" opacity="0.6" />

        {/* Spider descending on a thread */}
        <line x1="60" y1="0" x2="60" y2="35" strokeWidth="0.5" opacity="0.6" />
        <RealisticSpider x={60} y={40} scale={1.3} rotation={10} />
      </g>
    </svg>
  );
};

export default { SpiderWebLogo, SpiderWebCorner };