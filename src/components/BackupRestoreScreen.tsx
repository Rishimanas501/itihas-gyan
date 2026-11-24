import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  FileSpreadsheet, 
  Calendar,
  Lock,
  Layers
} from 'lucide-react';
import { db } from '../db';
import { 
  exportFullBackup, 
  validateBackupContent, 
  restoreBackup, 
  type BackupValidation 
} from '../services/backupService';
import { 
  exportStudentsToExcel, 
  exportQuestionsToExcel, 
  exportResultsToExcel 
} from '../services/excelService';

interface BackupRestoreScreenProps {
  onBack: () => void;
}

export const BackupRestoreScreen: React.FC<BackupRestoreScreenProps> = ({ onBack }) => {
  const [lastBackupDate, setLastBackupDate] = useState<string>('କୌଣସି ବ୍ୟାକ୍ଅପ୍ ହୋଇନାହିଁ');
  const [stats, setStats] = useState({
    students: 0,
    questions: 0,
    sessions: 0,
    scores: 0
  });

  // Restore verification states
  const [selectedBackupJson, setSelectedBackupJson] = useState<string>('');
  const [validationResult, setValidationResult] = useState<BackupValidation | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const loadStats = async () => {
    const students = await db.students.count();
    const questions = await db.questions.count();
    const sessions = await db.sessions.count();
    const scores = await db.scores.count();
    const settings = await db.settings.get('app_settings');

    setStats({ students, questions, sessions, scores });
    if (settings?.lastBackupDate) {
      setLastBackupDate(new Date(settings.lastBackupDate).toLocaleString());
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleFullBackup = async () => {
    try {
      await exportFullBackup();
      await loadStats();
      alert('Full Application Backup downloaded successfully!');
    } catch (err: any) {
      alert('Error creating backup: ' + err.message);
    }
  };

  const handleBackupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSelectedBackupJson(content);
      const validation = validateBackupContent(content);
      setValidationResult(validation);
      setRestoreStatus(null);
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async (mode: 'merge' | 'replace') => {
    if (!selectedBackupJson || !validationResult?.valid) return;

    const warnMsg = mode === 'replace'
      ? 'WARNING: "Replace" will wipe out all existing data and restore the backup completely. Are you sure?'
      : 'Merge mode will safely add non-duplicate records. Proceed?';

    if (!confirm(warnMsg)) return;

    setIsRestoring(true);
    try {
      const result = await restoreBackup(selectedBackupJson, mode);
      setRestoreStatus(result);
      if (result.success) {
        await loadStats();
        alert(result.message);
      } else {
        alert('Restore failed: ' + result.message);
      }
    } catch (err: any) {
      alert('Error during restoration: ' + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-odia font-black text-2xl text-slate-900">
              ବ୍ୟାକ୍ଅପ୍ ଏବଂ ରିଷ୍ଟୋର୍
            </h2>
            <p className="font-heading font-semibold text-xs uppercase text-slate-500">
              Complete Application Backup, Data Protection & Restore
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3.5 py-1.5 rounded-xl">
          <Calendar className="w-3.5 h-3.5 text-amber-700" />
          <span>ଶେଷ ବ୍ୟାକ୍ଅପ୍: {lastBackupDate}</span>
        </div>
      </div>

      {/* Database Inventory Snapshot */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-bold uppercase">ଛାତ୍ରଛାତ୍ରୀ (Students)</div>
          <div className="font-mono text-2xl font-black text-blue-900 mt-1">{stats.students}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-bold uppercase">ପ୍ରଶ୍ନ ବ୍ୟାଙ୍କ୍ (Questions)</div>
          <div className="font-mono text-2xl font-black text-emerald-900 mt-1">{stats.questions}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-bold uppercase">କୁଇଜ୍ ସେସନ୍ସ (Sessions)</div>
          <div className="font-mono text-2xl font-black text-purple-900 mt-1">{stats.sessions}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-bold uppercase">ମାର୍କ ରେକର୍ଡ୍ (Scores)</div>
          <div className="font-mono text-2xl font-black text-amber-900 mt-1">{stats.scores}</div>
        </div>
      </div>

      {/* SECTION 1: FULL APPLICATION BACKUP */}
      <div className="bg-gradient-to-br from-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ସମ୍ପୂର୍ଣ୍ଣ ସୁରକ୍ଷିତ (Full App Backup)</span>
            </div>
            <h3 className="font-odia font-bold text-2xl text-amber-300">
              ସମସ୍ତ ଡାଟା ଗୋଟିଏ କ୍ଲିକ୍‌ରେ ବ୍ୟାକ୍ଅପ୍ କରନ୍ତୁ
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl">
              ଛାତ୍ର ତାଲିକା, ପ୍ରଶ୍ନ ବ୍ୟାଙ୍କ, ପୂର୍ବ କୁଇଜ୍ ଇତିହାସ, ଛାତ୍ରଙ୍କ ସ୍କୋର ଓ ସେଟିଙ୍ଗ୍ସକୁ ଏକ ସୁରକ୍ଷିତ JSON ଫାଇଲ୍ ଭାବେ ଡାଉନଲୋଡ୍ କରନ୍ତୁ।
            </p>
          </div>

          <button
            onClick={handleFullBackup}
            className="shrink-0 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 stroke-[3]" />
            <span>Export Full Backup (.json)</span>
          </button>
        </div>

        {/* Separate Export Buttons (PART 17 Requirement) */}
        <div className="pt-4 border-t border-emerald-800/60">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block mb-3">
            ବିଭାଗୀୟ Excel ବ୍ୟାକ୍ଅପ୍ (Individual Section Backups):
          </span>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={async () => exportStudentsToExcel(await db.students.toArray())}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>ଛାତ୍ର ତଥ୍ୟ (Student Excel Backup)</span>
            </button>

            <button
              onClick={async () => exportQuestionsToExcel(await db.questions.toArray())}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>ପ୍ରଶ୍ନ ବ୍ୟାଙ୍କ (Question Bank Excel)</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: RESTORE FROM BACKUP */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h3 className="font-odia font-bold text-xl text-slate-900">
            ବ୍ୟାକ୍ଅପ୍ ଫାଇଲ୍‌ରୁ ରିଷ୍ଟୋର୍ କରନ୍ତୁ (Restore from Backup)
          </h3>
          <p className="text-xs text-slate-500">
            ପୂର୍ବରୁ ସଂରକ୍ଷିତ ହୋଇଥିବା ITIHAS_GYAN JSON ବ୍ୟାକ୍ଅପ୍ ଫାଇଲ୍ ଅପଲୋଡ୍ କରି ଡାଟା ପୁନରୁଦ୍ଧାର କରନ୍ତୁ।
          </p>
        </div>

        {/* File Picker */}
        <div className="border-2 border-dashed border-slate-300 rounded-3xl p-6 text-center hover:border-amber-500 transition-colors bg-slate-50/50">
          <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700 mb-1">
            ବ୍ୟାକ୍ଅପ୍ JSON ଫାଇଲ୍ ଚୟନ କରନ୍ତୁ କିମ୍ବା ଡ୍ରାଗ୍ କରନ୍ତୁ
          </p>
          <p className="text-[11px] text-slate-400 mb-4">
            Supports: ITIHAS_GYAN_FULL_BACKUP_*.json
          </p>

          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs">
            <span>ଫାଇଲ୍ ବାଛନ୍ତୁ (Choose Backup File)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleBackupFileSelect}
              className="hidden"
            />
          </label>
        </div>

        {/* Validation and Preview before restore */}
        {validationResult && (
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-300/80 space-y-4 animate-in fade-in-50">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-sm text-slate-900">
                  ବ୍ୟାକ୍ଅପ୍ ଫାଇଲ୍ ଯାଞ୍ଚ ସଫଳ (Valid Backup File)
                </span>
              </div>
              <span className="font-mono text-xs text-slate-500">
                Date: {new Date(validationResult.exportDate).toLocaleDateString()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="text-slate-500 block">ଛାତ୍ର (Students):</span>
                <span className="font-bold text-slate-900">{validationResult.counts.students}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="text-slate-500 block">ପ୍ରଶ୍ନ (Questions):</span>
                <span className="font-bold text-slate-900">{validationResult.counts.questions}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="text-slate-500 block">ସେସନ୍ (Sessions):</span>
                <span className="font-bold text-slate-900">{validationResult.counts.sessions}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="text-slate-500 block">ମାର୍କ (Scores):</span>
                <span className="font-bold text-slate-900">{validationResult.counts.scores}</span>
              </div>
            </div>

            {/* Merge vs Replace Buttons (PART 17 Requirement) */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                onClick={() => handleExecuteRestore('merge')}
                disabled={isRestoring}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Layers className="w-4 h-4" />
                <span>ସୁରକ୍ଷିତ ଯୋଗ କରନ୍ତୁ (Safe Merge Mode)</span>
              </button>

              <button
                onClick={() => handleExecuteRestore('replace')}
                disabled={isRestoring}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ସମ୍ପୂର୍ଣ୍ଣ ବଦଳାନ୍ତୁ (Complete Replace Mode)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
