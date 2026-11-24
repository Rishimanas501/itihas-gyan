import React from 'react';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({ size = 'md', className = '' }) => {
  const dimensions = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-18 h-18'
  }[size];

  return (
    <div className={`relative shrink-0 flex items-center justify-center select-none ${dimensions} ${className}`}>
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient id="logoBgGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#0b1329" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="bookPageLeft" x1="20" y1="50" x2="60" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          <linearGradient id="bookPageRight" x1="60" y1="50" x2="100" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Outer Rounded Shield */}
        <rect
          x="4"
          y="4"
          width="112"
          height="112"
          rx="28"
          fill="url(#logoBgGrad)"
          stroke="url(#goldGrad)"
          strokeWidth="3"
        />

        {/* Subtle Konark Knowledge Chakra in background */}
        <g opacity="0.28" stroke="url(#goldGrad)" strokeWidth="1.5">
          <circle cx="60" cy="50" r="28" strokeDasharray="3 3" />
          <circle cx="60" cy="50" r="14" />
          <line x1="60" y1="22" x2="60" y2="78" />
          <line x1="32" y1="50" x2="88" y2="50" />
          <line x1="40" y1="30" x2="80" y2="70" />
          <line x1="40" y1="70" x2="80" y2="30" />
        </g>

        {/* Historical Open Book (Symbol of Gyan / Knowledge) */}
        <g filter="url(#logoGlow)">
          {/* Left Book Page */}
          <path
            d="M26 76 C 36 68, 50 69, 58 74 L 58 96 C 50 91, 36 90, 26 98 Z"
            fill="url(#bookPageLeft)"
            stroke="#94a3b8"
            strokeWidth="0.8"
          />
          {/* Right Book Page */}
          <path
            d="M94 76 C 84 68, 70 69, 62 74 L 62 96 C 70 91, 84 90, 94 98 Z"
            fill="url(#bookPageRight)"
            stroke="#94a3b8"
            strokeWidth="0.8"
          />
          {/* Book Spine Center */}
          <path
            d="M58 74 C 59 73, 61 73, 62 74 L 62 96 C 61 95, 59 95, 58 96 Z"
            fill="#d97706"
          />
          {/* Ancient Text lines on Book */}
          <line x1="33" y1="78" x2="52" y2="75" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="33" y1="84" x2="50" y2="82" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="33" y1="90" x2="47" y2="89" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />

          <line x1="68" y1="75" x2="87" y2="78" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="70" y1="82" x2="87" y2="84" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="73" y1="89" x2="87" y2="90" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
        </g>

        {/* Torch / Flame of Wisdom above Book */}
        <g>
          {/* Flame aura */}
          <circle cx="60" cy="46" r="10" fill="#f59e0b" opacity="0.3" filter="url(#logoGlow)" />
          {/* Central Flame */}
          <path
            d="M60 30 C 65 37, 68 42, 65 49 C 62 55, 58 55, 55 49 C 52 42, 55 37, 60 30 Z"
            fill="url(#goldGrad)"
          />
          {/* Inner Light */}
          <path
            d="M60 36 C 62 40, 64 43, 62 47 C 60 50, 58 50, 57 47 C 55 43, 58 40, 60 36 Z"
            fill="#ffffff"
          />
        </g>

        {/* 4 Sparkles / Stars of Excellence */}
        <circle cx="28" cy="28" r="2" fill="#fde047" />
        <circle cx="92" cy="28" r="2" fill="#fde047" />
        <circle cx="18" cy="60" r="1.5" fill="#fde047" opacity="0.8" />
        <circle cx="102" cy="60" r="1.5" fill="#fde047" opacity="0.8" />
      </svg>
    </div>
  );
};
