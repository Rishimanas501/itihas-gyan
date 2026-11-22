import { db } from '../db';
import type { Student, Question, QuizSession, QuestionScoreRecord, AppSettings } from '../types';

export interface FullBackupPayload {
  version: string;
  exportDate: string;
  appName: string;
  data: {
    students: Student[];
    questions: Question[];
    sessions: QuizSession[];
    scores: QuestionScoreRecord[];
    settings?: AppSettings;
  };
}

export interface BackupValidation {
  valid: boolean;
  version: string;
  exportDate: string;
  counts: {
    students: number;
    questions: number;
    sessions: number;
    scores: number;
  };
  error?: string;
}

// Create and trigger download of Full Application Backup (.json)
export async function exportFullBackup(): Promise<void> {
  const students = await db.students.toArray();
  const questions = await db.questions.toArray();
  const sessions = await db.sessions.toArray();
  const scores = await db.scores.toArray();
  const settings = await db.settings.get('app_settings');

  const payload: FullBackupPayload = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    appName: 'ଇତିହାସ ଜ୍ଞାନ (ITIHASH GYAN)',
    data: {
      students,
      questions,
      sessions,
      scores,
      settings
    }
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `ITIHAS_GYAN_FULL_BACKUP_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Update last backup date in settings
  if (settings) {
    await db.settings.put({
      ...settings,
      lastBackupDate: new Date().toISOString()
    });
  }
}

// Validate a backup file before restoration
export function validateBackupContent(jsonText: string): BackupValidation {
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed || !parsed.data) {
      return {
        valid: false,
        version: '',
        exportDate: '',
        counts: { students: 0, questions: 0, sessions: 0, scores: 0 },
        error: 'Invalid backup file structure: missing data payload.'
      };
    }

    const { students = [], questions = [], sessions = [], scores = [] } = parsed.data;

    return {
      valid: true,
      version: parsed.version || '1.0.0',
      exportDate: parsed.exportDate || 'Unknown',
      counts: {
        students: Array.isArray(students) ? students.length : 0,
        questions: Array.isArray(questions) ? questions.length : 0,
        sessions: Array.isArray(sessions) ? sessions.length : 0,
        scores: Array.isArray(scores) ? scores.length : 0
      }
    };
  } catch (e: any) {
    return {
      valid: false,
      version: '',
      exportDate: '',
      counts: { students: 0, questions: 0, sessions: 0, scores: 0 },
      error: 'Corrupt or unreadable JSON file: ' + e.message
    };
  }
}

// Restore backup with either 'replace' (clean wipe) or 'merge' (safe append)
export async function restoreBackup(
  jsonText: string,
  mode: 'merge' | 'replace'
): Promise<{ success: boolean; message: string }> {
  const validation = validateBackupContent(jsonText);
  if (!validation.valid) {
    return { success: false, message: validation.error || 'Invalid backup file' };
  }

  const parsed: FullBackupPayload = JSON.parse(jsonText);
  const { students = [], questions = [], sessions = [], scores = [], settings } = parsed.data;

  try {
    await db.transaction('rw', [db.students, db.questions, db.sessions, db.scores, db.settings], async () => {
      if (mode === 'replace') {
        await db.students.clear();
        await db.questions.clear();
        await db.sessions.clear();
        await db.scores.clear();
      }

      if (students.length > 0) {
        if (mode === 'replace') {
          await db.students.bulkAdd(students);
        } else {
          // Merge: skip duplicate roll numbers
          for (const s of students) {
            const exists = await db.students.where('rollNo').equals(s.rollNo).first();
            if (!exists) {
              await db.students.add(s);
            }
          }
        }
      }

      if (questions.length > 0) {
        if (mode === 'replace') {
          await db.questions.bulkAdd(questions);
        } else {
          // Merge: add non-duplicate questions
          for (const q of questions) {
            const exists = await db.questions.where('question').equals(q.question).first();
            if (!exists) {
              await db.questions.add(q);
            }
          }
        }
      }

      if (sessions.length > 0) {
        for (const ses of sessions) {
          await db.sessions.put(ses);
        }
      }

      if (scores.length > 0) {
        for (const sc of scores) {
          await db.scores.put(sc);
        }
      }

      if (settings) {
        await db.settings.put(settings);
      }
    });

    return {
      success: true,
      message: `Restoration successful (${mode === 'replace' ? 'Complete Replace' : 'Safe Merge'}). Restored ${students.length} students, ${questions.length} questions, ${sessions.length} sessions.`
    };
  } catch (err: any) {
    return { success: false, message: 'Database transaction failed: ' + err.message };
  }
}
