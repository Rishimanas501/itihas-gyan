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
import { setConfiguredServerUrl } from '../services/serverConfig';
import { realtimeService } from '../services/socketService';

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
    setConfiguredServerUrl(settings.serverUrl);
    realtimeService.reconnect(settings.serverUrl || undefined);
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
              ସେଟିଙ୍ଗ୍ସ ଏବଂ ସଂଯୋଜନା
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

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Live Classroom / Cloud Server URL (ମୋବାଇଲ୍ APK ଓ LG Smart Panel ସଂଯୋଗ ପାଇଁ)
              </label>
              <input
                type="text"
                placeholder="ଯଥା: https://itihas-gyan.onrender.com କିମ୍ବା https://xxxx.trycloudflare.com କିମ୍ବା http://192.168.1.5:3000"
                value={settings.serverUrl || ''}
                onChange={(e) => setSettings({ ...settings, serverUrl: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                ମୋବାଇଲ୍ APK ରୁ Live Quiz ଚଳାଇବା ଏବଂ LG Digital Smart Panel ଓ Online ଛାତ୍ରଙ୍କୁ ଯୋଡ଼ିବା ପାଇଁ ଏଠାରେ Render କିମ୍ବା PC Server URL ଦିଅନ୍ତୁ। (ୱେବ୍ ବ୍ରାଉଜର୍‌ରେ ଖାଲି ରଖିପାରିବେ।)
              </p>
            </div>
          </div>
        </div>

        {/* AI & Multimodal Providers Configuration */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="font-odia font-bold text-lg text-slate-900">
                AI ସହାୟକ ଓ ପ୍ରୋଭାଇଡର୍ ସଂଯୋଜନା (AI Providers & Vision Keys)
              </h3>
              <p className="text-xs text-slate-500 font-heading">
                Multimodal Image Analysis, Document Reading, and Historical Research
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                ପ୍ରାଥମିକ AI ପ୍ରୋଭାଇଡର୍ (Default Provider)
              </label>
              <select
                value={settings.defaultAiProvider || 'existing'}
                onChange={(e) => setSettings({ ...settings, defaultAiProvider: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                <option value="existing">Existing AI (Offline Built-in - No Key Required)</option>
                <option value="gemini">Google Gemini (Official Multimodal API)</option>
                <option value="openai">OpenAI ChatGPT (Official OpenAI API)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Existing AI ସର୍ବଦା ମାଗଣା ଏବଂ ବିନା ଇଣ୍ଟରନେଟ୍/କି’ ରେ କାର୍ଯ୍ୟକ୍ଷମ।
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                ଡିଫଲ୍ଟ AI ମଡେଲ୍ (Default Model)
              </label>
              <select
                value={settings.defaultAiModel || 'existing-history-nlp'}
                onChange={(e) => setSettings({ ...settings, defaultAiModel: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                <option value="existing-history-nlp">Existing AI: Odisha & Indian History NLP (Offline)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast Vision & Docs)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Multimodal Analysis)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next-Gen)</option>
                <option value="gpt-4o">OpenAI GPT-4o (Vision & Documents)</option>
                <option value="gpt-4o-mini">OpenAI GPT-4o Mini (Cost Effective)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-600" />
                <span>Google Gemini API Key (Optional)</span>
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={settings.geminiApiKey || ''}
                onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
              <p className="text-[10px] text-slate-400">
                ଚିତ୍ର ଓ PDF ବିଶ୍ଳେଷଣ ପାଇଁ Google AI Studio ରୁ ମାଗଣାରେ API Key ପାଇପାରିବେ।
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-600" />
                <span>OpenAI ChatGPT API Key (Optional)</span>
              </label>
              <input
                type="password"
                placeholder="sk-proj-..."
                value={settings.openaiApiKey || ''}
                onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
              <p className="text-[10px] text-slate-400">
                OpenAI Developer Platform ରୁ API key ସଂଯୋଜିତ କରନ୍ତୁ।
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>ସୁରକ୍ଷା ନିଶ୍ଚିତତା (Security Guarantee):</strong> ଆପଣଙ୍କର API Key କେବଳ ଆପଣଙ୍କ ବ୍ରାଉଜର୍ / ଲୋକାଲ୍ ସର୍ଭରରେ ସୁରକ୍ଷିତ ଭାବେ ରହେ। କୌଣସି ପାସୱାର୍ଡ୍ କିମ୍ବା ପେମେଣ୍ଟ ତଥ୍ୟ ଆବଶ୍ୟକ ନାହିଁ ଏବଂ କୌଣସି ବାହ୍ୟ ସର୍ଭରରେ ପ୍ରକାଶ ପାଏ ନାହିଁ।
            </div>
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
