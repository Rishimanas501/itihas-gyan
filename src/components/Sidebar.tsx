import React, { useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  X
} from 'lucide-react';
import { AppLogo } from './AppLogo';
import { NAV_ITEMS } from '../types/navigation';

interface SidebarProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  appVersion?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpen,
  onClose,
  isOnline,
  appVersion = 'v1.0.0 (Production)'
}) => {
  // Close drawer on pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Full-screen Backdrop Overlay when Sidebar is Open (Click outside to close) */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Main Sidebar Drawer Shell (Slide in from left as Overlay, 0px width when closed) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 sm:w-80 bg-[#0b1329] border-r border-slate-800 text-white shadow-2xl transition-transform duration-300 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
        aria-label="Main Navigation Menu"
      >
        {/* Top Header: Logo & Branding + Close Button */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-950/50">
          <button
            onClick={() => {
              onNavigate('home');
              onClose();
            }}
            className="flex items-center gap-3 text-left focus:outline-none cursor-pointer group"
          >
            <AppLogo size="md" />
            <div className="flex flex-col min-w-0">
              <span className="font-odia font-black text-lg text-white group-hover:text-amber-300 transition-colors leading-tight">
                ଇତିହାସ ଜ୍ଞାନ
              </span>
              <span className="font-heading font-extrabold text-[10px] text-blue-400 tracking-[0.22em] uppercase">
                ITIHASH GYAN
              </span>
            </div>
          </button>

          {/* Close button (X) */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="ମେନୁ ବନ୍ଦ କରନ୍ତୁ (Close Navigation)"
            aria-label="Close Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items Label */}
        <div className="px-5 pt-4 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-heading">
          ମୁଖ୍ୟ ନେଭିଗେସନ୍ (MAIN MENU)
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-1 custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`group relative flex items-center justify-between w-full px-3.5 py-3 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/50'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800/80 text-blue-400 group-hover:bg-slate-800 group-hover:text-blue-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="font-odia text-sm font-semibold tracking-wide truncate">
                      {item.labelOdia}
                    </span>
                    <span
                      className={`text-[10px] font-heading font-medium tracking-wider truncate uppercase ${
                        isActive ? 'text-blue-100' : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    >
                      {item.labelEng}
                    </span>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-heading font-extrabold tracking-wider shrink-0 ${
                      item.badge === 'LIVE'
                        ? 'bg-amber-400 text-slate-950 animate-pulse'
                        : isActive
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-800 text-blue-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: Network & Sync Status + Version */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-3">
          <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px] font-medium">ନେଟୱାର୍କ ସ୍ଥିତି:</span>
              <span
                className={`inline-flex items-center gap-1.5 font-semibold text-[11px] ${
                  isOnline ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5" />
                    <span>ଅନଲାଇନ୍</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>ଲୋକାଲ୍ (Offline)</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px] font-medium">ଡାଟାବେସ୍:</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-blue-300 font-semibold">
                <RefreshCw className="w-3 h-3 text-blue-400" />
                <span>ସିଙ୍କ୍ ସକ୍ରିୟ (IndexedDB)</span>
              </span>
            </div>

            <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span>ସଂସ୍କରଣ:</span>
              <span className="font-mono text-slate-400">{appVersion}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>ମେନୁ ବନ୍ଦ କରନ୍ତୁ (Close Navigation)</span>
          </button>
        </div>
      </aside>
    </>
  );
};
