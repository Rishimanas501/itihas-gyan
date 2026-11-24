import React from 'react';
import {
  Info,
  Smartphone,
  Monitor,
  Download,
  BookOpen,
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Globe,
  HardDrive,
  Cpu
} from 'lucide-react';
import { AppLogo } from './AppLogo';
import { downloadStudentImportTemplate } from '../services/excelService';

interface AboutDownloadsScreenProps {
  onBack: () => void;
  isOnline: boolean;
  localIp?: string;
  studentCount: number;
  questionCount: number;
  sessionCount: number;
}

export const AboutDownloadsScreen: React.FC<AboutDownloadsScreenProps> = ({
  onBack,
  isOnline,
  localIp,
  studentCount,
  questionCount,
  sessionCount
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0b1329] via-[#0f172a] to-[#1e3a8a] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Subtle decorative Konark wheel background */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 w-80 h-80 rounded-full border-8 border-amber-400/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <AppLogo size="xl" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-odia font-black text-3xl sm:text-4xl text-white">
                ଇତିହାସ ଜ୍ଞାନ
              </h1>
              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30 uppercase">
                v1.0.0 Production
              </span>
            </div>
            <h2 className="font-heading font-extrabold text-sm sm:text-base text-blue-300 tracking-[0.25em] uppercase">
              ITIHASH GYAN
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed pt-1">
              Smart Interactive Classroom Quiz & Examination System specially designed for Higher Secondary and College History Education in Odisha.
            </p>
          </div>
        </div>
      </div>

      {/* Package Downloads Grid */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest font-bold text-slate-500 px-1 flex items-center gap-2">
          <Download className="w-4 h-4 text-blue-600" />
          <span>ଆପ୍ଲିକେସନ୍ ଡାଉନଲୋଡ୍ ଓ ସ୍ଥାପନ (APPLICATION DOWNLOADS)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Android APK Download Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-odia font-bold text-lg text-slate-900">
                    Android Release APK
                  </h4>
                  <p className="text-xs text-slate-500">
                    Android Smartphones & Tablets
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                APK Ready
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              ଶ୍ରେଣୀଗୃହରେ ଛାତ୍ରଛାତ୍ରୀ ଓ ଅଧ୍ୟାପକଙ୍କ ସ୍ମାର୍ଟଫୋନ୍ ପାଇଁ ସ୍ୱତନ୍ତ୍ର Android APK ଫାଇଲ୍। ଡାଉନଲୋଡ୍ କରି ସିଧାସଳଖ ଇନଷ୍ଟଲ କରନ୍ତୁ।
            </p>

            <div className="pt-2 flex items-center gap-3">
              <a
                href="/itihas-gyan-release.apk"
                download="itihas-gyan-release.apk"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Android APK (4.7 MB)</span>
              </a>
            </div>
          </div>

          {/* Windows / Flat Panel PWA Desktop Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Monitor className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-odia font-bold text-lg text-slate-900">
                    Windows & Flat Panel PWA
                  </h4>
                  <p className="text-xs text-slate-500">
                    Desktop, Laptop & Interactive Touch Panels
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
                Desktop Mode
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              କମ୍ପ୍ୟୁଟର, ଲାପଟପ୍ ଏବଂ ଇଣ୍ଟରାକ୍ଟିଭ୍ ଫ୍ଲାଟ ପ୍ୟାନେଲ୍ (IFP) ପାଇଁ ଫୁଲ୍ ସ୍କ୍ରିନ୍ ଡେସ୍କଟପ୍ ଆପ୍ଲିକେସନ୍ ଭାବେ ଇନଷ୍ଟଲ କରନ୍ତୁ।
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => {
                  alert('To install on Windows Desktop or Digital Flat Panel:\n\n1. Open this app in Chrome or Edge.\n2. Click the "Install App" icon in the right side of the URL bar (or Menu > Save and Share > Install Itihas Gyan).\n3. It will launch as a standalone desktop window!');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Install Windows Desktop App</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Templates & Resources */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="font-odia font-bold text-lg text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-blue-600" />
          <span>ଶିକ୍ଷାଦାନ ରିସୋର୍ସ ଓ Excel ଟେମ୍ପଲେଟ୍ (Resources & Templates)</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div>
            <h5 className="font-odia font-bold text-sm text-slate-800">
              ନୂଆ ଛାତ୍ର ତାଲିକା ଆମଦାନୀ ପାଇଁ ନମୁନା Excel ଫର୍ମାଟ
            </h5>
            <p className="text-xs text-slate-500 mt-0.5">
              Standard Excel template (.xlsx) with columns for Roll No, Name, Semester, Batch, and Paper.
            </p>
          </div>
          <button
            onClick={downloadStudentImportTemplate}
            className="shrink-0 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Excel ଟେମ୍ପଲେଟ୍ ଡାଉନଲୋଡ୍</span>
          </button>
        </div>
      </div>

      {/* System Specifications & Architecture */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="font-odia font-bold text-lg text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-600" />
          <span>ସିଷ୍ଟମ୍ ବୈଶିଷ୍ଟ୍ୟ ଓ ସ୍ଥିତି (System Specifications & Status)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-slate-400 font-medium">ଡାଟାବେସ୍ ଇଞ୍ଜିନ୍:</span>
            <div className="font-bold text-slate-800 text-sm">IndexedDB (Dexie v4)</div>
            <p className="text-[11px] text-emerald-700 font-medium">
              ସମ୍ପୂର୍ଣ୍ଣ ସୁରକ୍ଷିତ ଓ ଅଫଲାଇନ୍ ସ୍ଥାୟୀ ସଂରକ୍ଷଣ
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-slate-400 font-medium">ୟୁନିକୋଡ୍ ଓଡ଼ିଆ ଫଣ୍ଟ:</span>
            <div className="font-bold text-slate-800 text-sm font-odia">Noto Sans Oriya</div>
            <p className="text-[11px] text-emerald-700 font-medium">
              ସଠିକ୍ ଯୁକ୍ତାକ୍ଷର ଓ ସ୍ପଷ୍ଟ ପ୍ରଦର୍ଶନ ସୁନିଶ୍ଚିତ
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-slate-400 font-medium">ନେଟୱାର୍କ ସଂଯୋଗ:</span>
            <div className="font-bold text-slate-800 text-sm">
              {isOnline ? 'Online (Gemini AI Enabled)' : 'Local Offline Mode (NLP Active)'}
            </div>
            {localIp && (
              <p className="text-[11px] text-blue-700 font-medium">
                Wi-Fi IP: {localIp}:3000
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
