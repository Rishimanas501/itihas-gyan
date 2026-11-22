import React from 'react';
import { ArrowLeft, Home, Monitor, Smartphone, Settings as SettingsIcon } from 'lucide-react';

interface NavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onBack?: () => void;
  canGoBack?: boolean;
  onOpenPresentation?: () => void;
  onOpenStudentView?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onNavigate,
  onBack,
  canGoBack = false,
  onOpenPresentation,
  onOpenStudentView
}) => {
  return (
    <div className="flex items-center justify-between gap-2">
      {/* Back Button on all inner pages */}
      {canGoBack && currentView !== 'home' ? (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-medium text-sm shadow-xs border border-slate-200 transition-all active:scale-95"
          title="ପଛକୁ ଫେରନ୍ତୁ (Go Back)"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-700" />
          <span>ପଛକୁ (Back)</span>
        </button>
      ) : (
        <div />
      )}

      {/* Quick Action Shortcuts */}
      <div className="flex items-center gap-2">
        {onOpenPresentation && (
          <button
            onClick={onOpenPresentation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-teal-100 text-xs font-semibold shadow-xs transition-colors"
            title="ଡିଜିଟାଲ ପ୍ୟାନେଲ ପ୍ରଦର୍ଶନ ସ୍କ୍ରିନ (Classroom Flat Panel Mode)"
          >
            <Monitor className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">ଫ୍ଲାଟ ପ୍ୟାନେଲ୍ (Display)</span>
          </button>
        )}

        {onOpenStudentView && (
          <button
            onClick={onOpenStudentView}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
            title="ଛାତ୍ରଛାତ୍ରୀ ଯୋଗଦାନ ସ୍କ୍ରିନ୍ (Student Join Mode)"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">ଛାତ୍ର ଯୋଗଦାନ (Student)</span>
          </button>
        )}

        {currentView !== 'home' && (
          <button
            onClick={() => onNavigate('home')}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition-all active:scale-95"
            title="ମୁଖ୍ୟ ପୃଷ୍ଠା (Home Screen)"
          >
            <Home className="w-4 h-4 text-emerald-700" />
          </button>
        )}
      </div>
    </div>
  );
};
