import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

interface BrandHeaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  align?: 'left' | 'center';
  lightText?: boolean;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  size = 'md',
  showSubtitle = true,
  align = 'left',
  lightText = false
}) => {
  const isCenter = align === 'center';

  const sizeClasses = {
    sm: {
      odia: 'text-xl sm:text-2xl',
      eng: 'text-xs tracking-wider',
      icon: 'w-7 h-7',
      badge: 'text-[10px] px-2 py-0.5'
    },
    md: {
      odia: 'text-2xl sm:text-3xl lg:text-4xl',
      eng: 'text-xs sm:text-sm tracking-widest',
      icon: 'w-10 h-10',
      badge: 'text-xs px-2.5 py-0.5'
    },
    lg: {
      odia: 'text-3xl sm:text-4xl lg:text-5xl',
      eng: 'text-sm sm:text-base tracking-[0.2em]',
      icon: 'w-12 h-12',
      badge: 'text-xs px-3 py-1'
    },
    xl: {
      odia: 'text-4xl sm:text-5xl lg:text-6xl',
      eng: 'text-base sm:text-lg tracking-[0.25em]',
      icon: 'w-16 h-16',
      badge: 'text-sm px-3.5 py-1'
    }
  }[size];

  return (
    <div className={`flex items-center gap-3.5 ${isCenter ? 'justify-center text-center' : 'justify-start'}`}>
      {/* Brand Icon Emblem */}
      <div className="relative shrink-0 flex items-center justify-center">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-950 p-0.5 shadow-md shadow-emerald-950/20 ring-2 ring-amber-400/30">
          <div className="w-full h-full rounded-[14px] bg-slate-900/40 backdrop-blur flex items-center justify-center overflow-hidden">
            <img src="/icon.svg" alt="ଇତିହାସ ଜ୍ଞାନ" className="w-10 h-10 object-contain drop-shadow" />
          </div>
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-slate-950 shadow-sm">
          <Sparkles className="w-2.5 h-2.5" />
        </div>
      </div>

      {/* Brand Name Hierarchy: Odia FIRST & LARGER, English SECOND & SMALLER */}
      <div className={`flex flex-col ${isCenter ? 'items-center' : 'items-start'}`}>
        <div className="flex items-center gap-2">
          <h1
            className={`font-odia font-black tracking-normal leading-tight drop-shadow-sm ${sizeClasses.odia} ${
              lightText ? 'text-amber-300' : 'text-emerald-900'
            }`}
          >
            ଇତିହାସ ଜ୍ଞାନ
          </h1>
          <span className={`inline-flex items-center font-semibold rounded-full bg-amber-400/20 text-amber-500 border border-amber-400/40 uppercase ${sizeClasses.badge}`}>
            ସ୍କୁଲ ଓ କଲେଜ
          </span>
        </div>

        {/* English Name - Strictly smaller than Odia as required */}
        <h2
          className={`font-heading font-extrabold uppercase ${sizeClasses.eng} ${
            lightText ? 'text-emerald-200/90' : 'text-emerald-700 font-semibold'
          }`}
        >
          ITIHASH GYAN
        </h2>

        {showSubtitle && (
          <p className={`text-xs mt-0.5 font-medium ${lightText ? 'text-emerald-100/70' : 'text-slate-500'}`}>
            Smart Interactive Classroom Quiz & Examination System
          </p>
        )}
      </div>
    </div>
  );
};
