import React from 'react';
import { 
  Play, 
  Sparkles, 
  BookOpen, 
  Users, 
  BarChart3, 
  Database, 
  Settings as SettingsIcon,
  Wifi,
  WifiOff,
  Radio,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { BrandHeader } from './BrandHeader';

interface HomeScreenProps {
  onNavigate: (view: string) => void;
  studentCount: number;
  questionCount: number;
  sessionCount: number;
  isOnline: boolean;
  localIp?: string;
  onDownloadTemplate: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  studentCount,
  questionCount,
  sessionCount,
  isOnline,
  localIp,
  onDownloadTemplate
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10 space-y-8">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-950 p-6 sm:p-10 text-white shadow-xl shadow-emerald-950/20 border border-emerald-800/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <BrandHeader size="lg" lightText={true} />
            <p className="text-emerald-100/90 text-sm sm:text-base max-w-xl font-normal leading-relaxed pt-1">
              ଉଚ୍ଚ ମାଧ୍ୟମିକ ଓ ମହାବିଦ୍ୟାଳୟ ସ୍ତରର ଇତିହାସ ଶିକ୍ଷାଦାନ, ଡିଜିଟାଲ ଫ୍ଲାଟ ପ୍ୟାନେଲ ଓ ଅନଲାଇନ୍ କ୍ଲାସ୍ ପାଇଁ ସ୍ୱତନ୍ତ୍ର ସ୍ମାର୍ଟ କୁଇଜ୍ ଆପ୍ଲିକେସନ୍।
            </p>
          </div>

          {/* Real-time Status Badge & Quick Stats */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/60 backdrop-blur border border-emerald-500/30 text-xs font-medium">
              {isOnline ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300">ଅନଲାଇନ୍ ସଂଯୋଜିତ (Online)</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-amber-200">ଲୋକାଲ୍ ମୋଡ୍ (Offline Ready)</span>
                </>
              )}
            </div>

            {localIp && (
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-200/80 bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-700/40">
                <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Wi-Fi IP: {localIp}:3000</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Counters strip */}
        <div className="mt-8 pt-6 border-t border-emerald-800/40 grid grid-cols-3 gap-4 text-center sm:text-left">
          <div className="bg-emerald-950/40 backdrop-blur rounded-2xl p-3 sm:p-4 border border-emerald-700/30">
            <div className="text-2xl sm:text-3xl font-black text-amber-300 font-heading">{studentCount}</div>
            <div className="text-xs text-emerald-200/80 font-medium">ଛାତ୍ରଛାତ୍ରୀ ଡାଟାବେସ୍ (Students)</div>
          </div>
          <div className="bg-emerald-950/40 backdrop-blur rounded-2xl p-3 sm:p-4 border border-emerald-700/30">
            <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-heading">{questionCount}</div>
            <div className="text-xs text-emerald-200/80 font-medium">ପ୍ରଶ୍ନ ବ୍ୟାଙ୍କ୍ (Questions)</div>
          </div>
          <div className="bg-emerald-950/40 backdrop-blur rounded-2xl p-3 sm:p-4 border border-emerald-700/30">
            <div className="text-2xl sm:text-3xl font-black text-amber-300 font-heading">{sessionCount}</div>
            <div className="text-xs text-emerald-200/80 font-medium">କରାଯାଇଥିବା କୁଇଜ୍ (Sessions)</div>
          </div>
        </div>
      </div>

      {/* 7 PRIMARY SECTIONS AS SPECIFIED IN PART 3 */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest font-bold text-slate-500 px-1">
          ମୁଖ୍ୟ ମେନୁ (MAIN MENU OPTIONS)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Start Live Quiz (Highlighted Primary) */}
          <button
            onClick={() => onNavigate('live_quiz')}
            className="group relative text-left p-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-700/25 hover:shadow-xl hover:shadow-emerald-700/35 transition-all duration-200 active:scale-[0.98] border border-emerald-500/40 md:col-span-2 lg:col-span-1"
          >
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                <Play className="w-7 h-7 fill-current" />
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black tracking-wide uppercase shadow-xs">
                ଲାଇଭ୍ (Live)
              </span>
            </div>

            <div className="mt-5 space-y-1">
              <h4 className="font-odia font-black text-2xl text-white">
                ୧. ଲାଇଭ୍ କୁଇଜ୍ ଆରମ୍ଭ କରନ୍ତୁ
              </h4>
              <p className="font-heading font-bold text-xs uppercase tracking-wider text-emerald-100">
                1. Start Live Quiz
              </p>
              <p className="text-sm text-emerald-50/90 pt-1 leading-relaxed">
                ପ୍ରୋଜେକ୍ଟର, ଡିଜିଟାଲ ଫ୍ଲାଟ ପ୍ୟାନେଲ ଓ ମୋବାଇଲ ହାତଟେକା (Digital Hand Raising) ପାଇଁ ଲାଇଭ୍ ସେସନ୍।
              </p>
            </div>

            <div className="mt-5 flex items-center text-xs font-bold text-amber-300 gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>କୁଇଜ୍ ଆରମ୍ଭ କରନ୍ତୁ (Start Session)</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* 2. Create Questions with AI */}
          <button
            onClick={() => onNavigate('ai_generator')}
            className="group text-left p-6 rounded-3xl bg-white hover:bg-slate-50 border-2 border-slate-200/80 hover:border-teal-500 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="mt-5 space-y-1">
              <h4 className="font-odia font-black text-xl text-slate-900 group-hover:text-teal-700 transition-colors">
                ୨. AI ସାହାଯ୍ୟରେ ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତି
              </h4>
              <p className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500">
                2. Create Questions with AI
              </p>
              <p className="text-sm text-slate-600 pt-1 leading-relaxed">
                ପାଠ୍ୟ ପୁସ୍ତକ ଅନୁଚ୍ଛେଦ ବା ନୋଟ୍ସ ଦେଇ MCQ, ଶୂନ୍ୟସ୍ଥାନ, ସତ୍ୟ/ମିଥ୍ୟା ଓ ଦୀର୍ଘ ପ୍ରଶ୍ନୋତ୍ତର ତିଆରି କରନ୍ତୁ।
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-bold text-teal-700 gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>AI ଜେନେରେଟର ଖୋଲନ୍ତୁ</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* 3. Question Bank */}
          <button
            onClick={() => onNavigate('question_bank')}
            className="group text-left p-6 rounded-3xl bg-white hover:bg-slate-50 border-2 border-slate-200/80 hover:border-emerald-600 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="mt-5 space-y-1">
              <h4 className="font-odia font-black text-xl text-slate-900 group-hover:text-emerald-700 transition-colors">
                ୩. ସ୍ଥାୟୀ ପ୍ରଶ୍ନ ବ୍ୟାଙ୍କ
              </h4>
              <p className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500">
                3. Question Bank
              </p>
              <p className="text-sm text-slate-600 pt-1 leading-relaxed">
                ଅନୁମୋଦିତ ପ୍ରଶ୍ନ ସଂଗ୍ରହ, ସେମିଷ୍ଟାର ଓ ବିଷୟ ଅନୁଯାୟୀ ସଜୀକରଣ ଏବଂ Excel ରପ୍ତାନି।
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-bold text-emerald-700 gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>ପ୍ରଶ୍ନ ବ୍ୟାଙ୍କ୍ ପରିଚାଳନା</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* 4. Student Database */}
          <button
            onClick={() => onNavigate('student_database')}
            className="group text-left p-6 rounded-3xl bg-white hover:bg-slate-50 border-2 border-slate-200/80 hover:border-blue-600 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div className="mt-5 space-y-1">
              <h4 className="font-odia font-black text-xl text-slate-900 group-hover:text-blue-700 transition-colors">
                ୪. ଛାତ୍ରଛାତ୍ରୀ ଡାଟାବେସ୍
              </h4>
              <p className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500">
                4. Student Database
              </p>
              <p className="text-sm text-slate-600 pt-1 leading-relaxed">
                Excel (.xlsx) ଓ CSV ଆମଦାନୀ, ଡୁପ୍ଲିକେଟ୍ ରୋଲ୍ ଯାଞ୍ଚ ଏବଂ ତାଲିକା ପରିଚାଳନା।
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-bold text-blue-700 gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>ଛାତ୍ର ତାଲିକା ଦେଖନ୍ତୁ</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* 5. Reports & Results */}
          <button
            onClick={() => onNavigate('reports')}
            className="group text-left p-6 rounded-3xl bg-white hover:bg-slate-50 border-2 border-slate-200/80 hover:border-purple-600 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="mt-5 space-y-1">
              <h4 className="font-odia font-black text-xl text-slate-900 group-hover:text-purple-700 transition-colors">
                ୫. ରିପୋର୍ଟ୍ସ ଏବଂ ଫଳାଫଳ
              </h4>
              <p className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500">
                5. Reports & Results
              </p>
              <p className="text-sm text-slate-600 pt-1 leading-relaxed">
                ଲାଇଭ୍ ଲିଡରବୋର୍ଡ୍, ସେସନ୍ ଇତିହାସ, ଛାତ୍ର ଓ ଶ୍ରେଣୀ ରିପୋର୍ଟ ଏବଂ PDF/Excel ଡାଉନଲୋଡ୍।
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-bold text-purple-700 gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>ରିପୋର୍ଟ୍ସ ଅନୁସନ୍ଧାନ</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* 6. Backup & Restore */}
          <button
            onClick={() => onNavigate('backup_restore')}
            className="group text-left p-6 rounded-3xl bg-white hover:bg-slate-50 border-2 border-slate-200/80 hover:border-amber-600 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Database className="w-6 h-6" />
            </div>
            <div className="mt-5 space-y-1">
              <h4 className="font-odia font-black text-xl text-slate-900 group-hover:text-amber-800 transition-colors">
                ୬. ବ୍ୟାକ୍ଅପ୍ ଏବଂ ରିଷ୍ଟୋର୍
              </h4>
              <p className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500">
                6. Backup & Restore
              </p>
              <p className="text-sm text-slate-600 pt-1 leading-relaxed">
                ସମ୍ପୂର୍ଣ୍ଣ ଆପ୍ଲିକେସନ୍ ଡାଟା ସୁରକ୍ଷା, Excel ବ୍ୟାକ୍ଅପ୍ ଏବଂ ସୁରକ୍ଷିତ ଫାଇଲ୍ ରିଷ୍ଟୋର୍।
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-bold text-amber-800 gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>ବ୍ୟାକ୍ଅପ୍ ସୁରକ୍ଷା</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* 7. Settings */}
          <button
            onClick={() => onNavigate('settings')}
            className="group text-left p-6 rounded-3xl bg-white hover:bg-slate-50 border-2 border-slate-200/80 hover:border-slate-500 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <SettingsIcon className="w-6 h-6" />
            </div>
            <div className="mt-5 space-y-1">
              <h4 className="font-odia font-black text-xl text-slate-900 group-hover:text-slate-700 transition-colors">
                ୭. ସେଟିଙ୍ଗ୍ସ ଏବଂ ସଂଯୋଜନା
              </h4>
              <p className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500">
                7. Settings
              </p>
              <p className="text-sm text-slate-600 pt-1 leading-relaxed">
                ଅଧ୍ୟାପକ/କଲେଜ ପରିଚୟ, Gemini API Key, ଟାଇମର୍ ପ୍ରିସେଟ୍ ଏବଂ APK ଡାଉନଲୋଡ୍।
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-bold text-slate-700 gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>କନଫିଗରେସନ୍</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>

      {/* Quick Utility Bar */}
      <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-odia font-bold text-sm text-emerald-950">
              ନୂଆ ଛାତ୍ର ନାମଲେଖା ପାଇଁ Excel ଟେମ୍ପଲେଟ୍
            </h5>
            <p className="text-xs text-emerald-800">
              ଡାଉନଲୋଡ୍ କରି ସିଧାସଳଖ ରୋଲ ନମ୍ବର ଓ ନାମ ଭରି ଆମଦାନୀ (Import) କରନ୍ତୁ।
            </p>
          </div>
        </div>

        <button
          onClick={onDownloadTemplate}
          className="shrink-0 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
        >
          Excel ଟେମ୍ପଲେଟ୍ ଡାଉନଲୋଡ୍ କରନ୍ତୁ
        </button>
      </div>
    </div>
  );
};
