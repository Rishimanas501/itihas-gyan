import React from 'react';
import { AppLogo } from './AppLogo';

interface BrandHeaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  align?: 'left' | 'center';
  lightText?: boolean;
  collapsed?: boolean;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  size = 'md',
  showSubtitle = true,
  align = 'left',
  lightText = false,
  collapsed = false
}) => {
  const isCenter = align === 'center';

  const sizeClasses = {
    xs: {
      odia: 'text-base font-black',
      eng: 'text-[9px] tracking-wider font-bold',
      logo: 'xs' as const,
      badge: 'text-[9px] px-1.5 py-0.5'
    },
    sm: {
      odia: 'text-lg sm:text-xl font-black',
      eng: 'text-[10px] tracking-widest font-bold',
      logo: 'sm' as const,
      badge: 'text-[9px] px-2 py-0.5'
    },
    md: {
      odia: 'text-xl sm:text-2xl lg:text-3xl font-black',
      eng: 'text-xs sm:text-xs tracking-[0.2em] font-extrabold',
      logo: 'md' as const,
      badge: 'text-[10px] px-2.5 py-0.5'
    },
    lg: {
      odia: 'text-2xl sm:text-3xl lg:text-4xl font-black',
      eng: 'text-xs sm:text-sm tracking-[0.25em] font-extrabold',
      logo: 'lg' as const,
      badge: 'text-xs px-3 py-0.5'
    },
    xl: {
      odia: 'text-3xl sm:text-4xl lg:text-5xl font-black',
      eng: 'text-sm sm:text-base tracking-[0.28em] font-black',
      logo: 'xl' as const,
      badge: 'text-xs px-3.5 py-1'
    }
  }[size];

  if (collapsed) {
    return (
      <div className="flex items-center justify-center w-full py-1">
        <AppLogo size={sizeClasses.logo} />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${isCenter ? 'justify-center text-center' : 'justify-start'}`}>
      {/* Brand Icon Emblem */}
      <AppLogo size={sizeClasses.logo} />

      {/* Brand Name Typography Hierarchy: Odia FIRST & LARGER, English SECOND & SMALLER */}
      <div className={`flex flex-col ${isCenter ? 'items-center' : 'items-start'} min-w-0`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`font-odia tracking-tight leading-tight select-none ${sizeClasses.odia} ${
              lightText ? 'text-white' : 'text-slate-900'
            }`}
          >
            ଇତିହାସ ଜ୍ଞାନ
          </span>
          <span
            className={`inline-flex items-center font-bold rounded-full select-none ${
              lightText
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            } uppercase ${sizeClasses.badge}`}
          >
            କଲେଜ ଓ ସ୍କୁଲ
          </span>
        </div>

        {/* English Name - Below Odia and strictly smaller font */}
        <span
          className={`font-heading uppercase select-none ${sizeClasses.eng} ${
            lightText ? 'text-blue-300/90' : 'text-blue-600'
          }`}
        >
          ITIHASH GYAN
        </span>

        {showSubtitle && (
          <p
            className={`text-xs mt-0.5 font-normal truncate select-none ${
              lightText ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            Smart Interactive Classroom Quiz & Examination System
          </p>
        )}
      </div>
    </div>
  );
};
