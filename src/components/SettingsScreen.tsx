import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Key, 
  Smartphone, 
  Monitor, 
  Save, 
  CheckCircle2, 
  Download, 
  ShieldCheck, 
  Info,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { db, DEFAULT_SETTINGS } from '../db';
import type { AppSettings } from '../types';

interface SettingsScreenProps {
  onBack: () => void;
  onSettingsUpdated: (settings: AppSettings) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onSettingsUpdated
}) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const current = await db.settings.get('app_settings');
      if (current) {
        setSettings(current);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.settings.put(settings);
    onSettingsUpdated(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-800">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-odia font-black text-2xl text-slate-900">
              ୭. ସେଟିଙ୍ଗ୍ସ ଏବଂ ସଂଯୋଜନା
            </h2>
            <p className="font-heading font-semibold text-xs uppercase text-slate-500">
              Application Configuration & Downloads
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Academic Identity */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-odia font-bold text-lg text-slate-900 pb-2 border-b border-slate-100">
            ଅଧ୍ୟାପକ ଓ ମହାବିଦ୍ୟାଳୟ ପରିଚୟ (Teacher & Institution Details)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                ଅଧ୍ୟାପକଙ୍କ ନାମ (Teacher Name)
              </label>
              <input
                type="text"
                value={settings.teacherName}
                onChange={(e) => setSettings({ ...settings, teacherName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                ମହାବିଦ୍ୟାଳୟ ନାମ (College / Institution Name)
              </label>
              <input
                type="text"
                value={settings.collegeName}
                onChange={(e) => setSettings({ ...settings, collegeName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
              />
            </div>
          </div>
        </div>

        {/* AI & Gemini Configuration */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Key className="w-4 h-4 text-amber-600" />
            <h3 className="font-odia font-bold text-lg text-slate-900">
              Google Gemini AI API Key (ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତି ପାଇଁ)
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Gemini API Key
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={settings.geminiApiKey}
              onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              API key ନଥିଲେ ମଧ୍ୟ ଆପ୍ଲିକେସନ୍ ଭିତରେ ଥିବା ଅଫଲାଇନ୍ ହିଷ୍ଟ୍ରି NLP ଜେନେରେଟର ସ୍ୱୟଂଚାଳିତ ଭାବେ କାର୍ଯ୍ୟ କରିବ।
            </p>
          </div>
        </div>

        {/* Live Quiz Rules & Timers */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h3 className="font-odia font-bold text-lg text-slate-900">
              କୁଇଜ୍ ନିୟମ ଓ ଡିଫଲ୍ଟ ଟାଇମର୍ (Quiz Rules & Scoring)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                ପ୍ରଶ୍ନ ପିଛା ଡିଫଲ୍ଟ ସମୟ (Default Timer)
              </label>
              <select
                value={settings.defaultTimer}
                onChange={(e) => setSettings({ ...settings, defaultTimer: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                <option value={15}>15 Seconds</option>
                <option value={30}>30 Seconds</option>
                <option value={45}>45 Seconds</option>
                <option value={60}>60 Seconds</option>
                <option value={0}>Timer Off</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                ପ୍ରଶ୍ନ ଭାଷା ଚୟନ (Default Question & Answer Language)
              </label>
              <select
                value={settings.defaultLanguage || 'bilingual'}
                onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value as any })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                <option value="bilingual">Odia & English (ଉଭୟ ଓଡ଼ିଆ ଏବଂ English ଦ୍ୱିଭାଷୀ)</option>
                <option value="odia">Odia Only (କେବଳ ଓଡ଼ିଆ)</option>
                <option value="english">English Only (Only English)</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-3 pt-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoBackupReminder}
                  onChange={(e) => setSettings({ ...settings, autoBackupReminder: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span>ସ୍ୱୟଂଚାଳିତ ବ୍ୟାକ୍ଅପ୍ ସ୍ମାରକ (Auto Backup Reminder)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3">
          {isSaved && (
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              ସେଟିଙ୍ଗ୍ସ ସଫଳତାର ସହ ସେଭ୍ ହେଲା!
            </span>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>ସେଭ୍ କରନ୍ତୁ (Save Settings)</span>
          </button>
        </div>
      </form>

      {/* DELIVERABLES & APP PACKAGES (PART 18 & 19) */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-5">
        <h3 className="font-odia font-bold text-xl text-amber-300">
          ଆପ୍ଲିକେସନ୍ ଡାଉନଲୋଡ୍ ଓ ସ୍ଥାପନ (Application Downloads)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Android APK Download Card */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <Smartphone className="w-5 h-5" />
              <span className="font-bold text-sm">Android Release APK</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              ଆଣ୍ଡ୍ରଏଡ୍ ଫୋନ୍ ଓ ଟାବଲେଟ୍ ପାଇଁ ଅଫିସିଆଲ୍ ଇନଷ୍ଟଲ ଯୋଗ୍ୟ APK ଫାଇଲ୍।
            </p>
            <div className="pt-2">
              <a
                href="/itihas-gyan-release.apk"
                download="itihas-gyan-release.apk"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download Android APK</span>
              </a>
            </div>
          </div>

          {/* Windows / PWA Desktop Card */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
            <div className="flex items-center gap-2 text-blue-400">
              <Monitor className="w-5 h-5" />
              <span className="font-bold text-sm">Windows PWA Desktop Version</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              କମ୍ପ୍ୟୁଟର ଓ ଡିଜିଟାଲ ଫ୍ଲାଟ ପ୍ୟାନେଲ୍ ପାଇଁ ଫୁଲ୍ ସ୍କ୍ରିନ୍ ମୋଡ୍ ସହ ୧-କ୍ଲିକ୍ ଡେସ୍କଟପ୍ ଇନଷ୍ଟଲ୍।
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  alert('To install on Windows: Open this app in Chrome/Edge and click the "Install App" button in your browser address bar.');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Install Windows App</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
