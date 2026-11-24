import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  ArrowLeft,
  Globe,
  GraduationCap,
  Settings as SettingsIcon,
  ChevronDown,
  Monitor,
  Smartphone,
  Info,
  Check,
  RotateCcw
} from 'lucide-react';
import { AppLogo } from './AppLogo';
import { NAV_ITEMS } from '../types/navigation';

interface TopHeaderProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  onBack?: () => void;
  canGoBack?: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  teacherName?: string;
  collegeName?: string;
  onOpenPresentation?: () => void;
  onOpenStudentView?: () => void;
  currentLanguage: 'odia' | 'english' | 'bilingual';
  onChangeLanguage: (lang: 'odia' | 'english' | 'bilingual') => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentView,
  onNavigate,
  onBack,
  canGoBack = false,
  isSidebarOpen,
  onToggleSidebar,
  teacherName = 'ଅଧ୍ୟାପକ (History Teacher)',
  collegeName = 'ଇତିହାସ ବିଭାଗ, ସ୍ୱୟଂଶାସିତ ମହାବିଦ୍ୟାଳୟ',
  onOpenPresentation,
  onOpenStudentView,
  currentLanguage,
  onChangeLanguage
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeNavItem = NAV_ITEMS.find((item) => item.id === currentView);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs px-3 sm:px-6 py-2.5 transition-all w-full">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Side: Three-Dot Menu Button + Branding + Back Button + Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          {/* THREE-DOT MENU BUTTON (⋮) — ALWAYS VISIBLE ON BOTH DESKTOP AND MOBILE */}
          <button
            onClick={onToggleSidebar}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/90 text-slate-800 hover:text-blue-600 border border-slate-200 shadow-2xs transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
            title={isSidebarOpen ? "ସାଇଡ଼ବାର୍ ବନ୍ଦ କରନ୍ତୁ (Hide Navigation)" : "ମୁଖ୍ୟ ମେନୁ ଖୋଲନ୍ତୁ (Show Navigation)"}
            aria-label="Toggle Navigation Sidebar"
          >
            <MoreVertical className="w-5 h-5 text-slate-800" />
          </button>

          {/* Logo & Brand Name — Always visible in header */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer group shrink-0"
          >
            <AppLogo size="xs" />
            <div className="flex flex-col">
              <span className="font-odia font-black text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                ଇତିହାସ ଜ୍ଞାନ
              </span>
              <span className="font-heading font-extrabold text-[8px] sm:text-[9px] text-blue-600 tracking-wider uppercase">
                ITIHASH GYAN
              </span>
            </div>
          </button>

          {/* Back Navigation Button for Sub-pages */}
          {canGoBack && currentView !== 'home' && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer active:scale-95 transition-all shrink-0"
              title="ପଛକୁ ଫେରନ୍ତୁ (Go Back)"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline font-odia">ପଛକୁ (Back)</span>
            </button>
          )}

          {/* Breadcrumb / Page Title */}
          {activeNavItem && currentView !== 'home' && (
            <div className="hidden sm:flex items-center gap-2 text-slate-400 text-xs truncate">
              <span>/</span>
              <div className="flex items-center gap-1.5 font-odia font-bold text-slate-800 text-sm truncate">
                <span className="truncate">{activeNavItem.labelOdia}</span>
                <span className="text-xs text-slate-500 font-heading font-medium truncate hidden md:inline">
                  ({activeNavItem.labelEng})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Quick Action Pills, Language Selector, Teacher Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick presentation button if active */}
          {onOpenPresentation && (
            <button
              onClick={onOpenPresentation}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200/80 transition-colors shadow-2xs"
              title="ଫ୍ଲାଟ ପ୍ୟାନେଲ୍ ପ୍ରଦର୍ଶନ (Classroom Display Mode)"
            >
              <Monitor className="w-3.5 h-3.5 text-blue-600" />
              <span>ଫ୍ଲାଟ ପ୍ୟାନେଲ୍ (Display)</span>
            </button>
          )}

          {/* Student Join View Shortcut */}
          {onOpenStudentView && (
            <button
              onClick={onOpenStudentView}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200/80 transition-colors shadow-2xs"
              title="ଛାତ୍ର ଯୋଗଦାନ ସ୍କ୍ରିନ୍ (Student Join Mode)"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>ଛାତ୍ର ଯୋଗଦାନ</span>
            </button>
          )}

          {/* Quick Refresh Button */}
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 transition-all cursor-pointer active:scale-95 shadow-2xs"
            title="ଆପ୍ ରିଫ୍ରେଶ୍ କରନ୍ତୁ (Refresh App)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-odia font-bold hidden sm:inline">ରିଫ୍ରେଶ୍</span>
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
              title="ଭାଷା ବଦଳାନ୍ତୁ (Change Language)"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-odia font-bold text-slate-800">
                {currentLanguage === 'odia' ? 'ଓଡ଼ିଆ' : currentLanguage === 'english' ? 'English' : 'ଓଡ଼ିଆ / Eng'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  ଭାଷା ଚୟନ (Select Language)
                </div>
                <button
                  onClick={() => {
                    onChangeLanguage('bilingual');
                    setIsLangMenuOpen(false);
                  }}
                  className="flex items-center justify-between w-full px-3.5 py-2 text-xs text-left hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium"
                >
                  <span className="font-odia font-bold">ଓଡ଼ିଆ ଏବଂ English (ଦ୍ୱିଭାଷୀ)</span>
                  {currentLanguage === 'bilingual' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
                <button
                  onClick={() => {
                    onChangeLanguage('odia');
                    setIsLangMenuOpen(false);
                  }}
                  className="flex items-center justify-between w-full px-3.5 py-2 text-xs text-left hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium"
                >
                  <span className="font-odia font-bold">କେବଳ ଓଡ଼ିଆ (Odia Only)</span>
                  {currentLanguage === 'odia' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
                <button
                  onClick={() => {
                    onChangeLanguage('english');
                    setIsLangMenuOpen(false);
                  }}
                  className="flex items-center justify-between w-full px-3.5 py-2 text-xs text-left hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium"
                >
                  <span>English Only</span>
                  {currentLanguage === 'english' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              </div>
            )}
          </div>

          {/* Teacher Profile / Account Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer text-left"
              title="ଅଧ୍ୟାପକ ପ୍ରୋଫାଇଲ୍ (Teacher Profile)"
            >
              {/* Avatar circle */}
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-blue-500/20">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>

              {/* Name & Role (Hidden on small mobile) */}
              <div className="hidden sm:flex flex-col min-w-0 max-w-[150px]">
                <span className="font-odia font-bold text-xs text-slate-800 truncate leading-tight">
                  {teacherName}
                </span>
                <span className="text-[10px] text-slate-500 truncate leading-tight">
                  {collegeName}
                </span>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-slate-200 py-2.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="font-odia font-bold text-sm text-slate-900 truncate">
                    {teacherName}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {collegeName}
                  </div>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-200/60">
                    ଇତିହାସ ବିଭାଗ (History Dept)
                  </span>
                </div>

                <div className="pt-1.5 space-y-0.5">
                  <button
                    onClick={() => {
                      onNavigate('settings');
                      setIsProfileMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-4 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-medium"
                  >
                    <SettingsIcon className="w-4 h-4 text-slate-500" />
                    <span>ପ୍ରୋଫାଇଲ୍ ଓ ସେଟିଙ୍ଗ୍ସ (Settings)</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('about_downloads');
                      setIsProfileMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-4 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-medium"
                  >
                    <Info className="w-4 h-4 text-slate-500" />
                    <span>ସମ୍ପର୍କରେ ଓ ଡାଉନଲୋଡ୍ (About App)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
