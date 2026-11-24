import { db } from '../db';
import type { Paper, Chapter, Question, SavedTest, QuestionPattern, DifficultyLevel, QuestionLanguage } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface PaperWithStats extends Paper {
  chapterCount: number;
  questionCount: number;
}

export interface ChapterWithStats extends Chapter {
  questionCount: number;
}

export interface QuestionFilterOptions {
  searchQuery?: string;
  pattern?: QuestionPattern | 'all';
  marks?: number | 'all';
  difficulty?: DifficultyLevel | 'all';
  language?: QuestionLanguage | 'all';
}

export interface RandomTestOptions {
  paperId: string;
  chapterIds: string[];
  totalQuestions: number;
  totalMarks?: number;
  difficulty?: DifficultyLevel | 'all';
  patternDistribution?: Partial<Record<QuestionPattern, number>>;
  marksDistribution?: Partial<Record<number, number>>;
  language?: QuestionLanguage | 'all';
}

// 1. Fetch All Papers with Chapter & Question Statistics
export async function getPapersWithStats(): Promise<PaperWithStats[]> {
  try {
    const papers = await db.papers.toArray();
    papers.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const chapters = await db.chapters.toArray();
    const questions = await db.questions.toArray();

    return papers.map((paper) => {
      const paperChapters = chapters.filter((c) => c.paperId === paper.id);
      const paperQuestions = questions.filter((q) => q.paperId === paper.id);

      return {
        ...paper,
        chapterCount: paperChapters.length,
        questionCount: paperQuestions.length
      };
    });
  } catch (error) {
    console.error('Error fetching papers with stats:', error);
    return [];
  }
}

// 2. Fetch Chapters of a Specific Paper with Question Statistics
export async function getChaptersWithStats(paperId: string): Promise<ChapterWithStats[]> {
  try {
    const allChapters = await db.chapters.toArray();
    const chapters = allChapters
      .filter((c) => c.paperId === paperId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const allQuestions = await db.questions.toArray();
    const paperQuestions = allQuestions.filter((q) => q.paperId === paperId);

    return chapters.map((chap) => {
      const count = paperQuestions.filter((q) => q.chapterId === chap.id).length;
      return {
        ...chap,
        questionCount: count
      };
    });
  } catch (error) {
    console.error('Error fetching chapters with stats:', error);
    return [];
  }
}

// 3. Create or Edit Paper
export async function savePaper(paper: Partial<Paper>): Promise<Paper> {
  const now = new Date().toISOString();

  if (paper.id) {
    const existing = await db.papers.get(paper.id);
    if (!existing) throw new Error('Paper not found');
    const updated: Paper = {
      ...existing,
      ...paper,
      updatedAt: now
    };
    await db.papers.put(updated);
    return updated;
  } else {
    const id = 'paper_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const count = await db.papers.count();
    const newPaper: Paper = {
      id,
      name: paper.name || 'New Paper',
      nameOdia: paper.nameOdia || '',
      code: paper.code || '',
      subject: paper.subject || 'History',
      department: paper.department || 'History',
      semester: paper.semester || '1st Semester',
      academicSession: paper.academicSession || '2024-25',
      description: paper.description || '',
      order: paper.order ?? count + 1,
      createdAt: now,
      updatedAt: now
    };
    await db.papers.put(newPaper);
    return newPaper;
  }
}

// 4. Safe Delete Paper (Protects questions from silent deletion)
export async function deletePaperSafe(
  paperId: string,
  options?: { moveQuestionsToChapterId?: string; targetPaperId?: string }
): Promise<{ deletedQuestions: number; movedQuestions: number }> {
  const linkedQuestions = await db.questions.where('paperId').equals(paperId).toArray();
  let moved = 0;
  let deleted = 0;

  if (linkedQuestions.length > 0) {
    if (options?.moveQuestionsToChapterId && options?.targetPaperId) {
      // Safe move to target chapter
      for (const q of linkedQuestions) {
        if (q.id) {
          await db.questions.update(q.id, {
            paperId: options.targetPaperId,
            chapterId: options.moveQuestionsToChapterId,
            updatedAt: new Date().toISOString()
          });
          moved++;
        }
      }
    } else {
      // If user explicitly confirmed deletion of contents
      for (const q of linkedQuestions) {
        if (q.id) {
          await db.questions.delete(q.id);
          deleted++;
        }
      }
    }
  }

  // Delete all chapters under this paper
  const chapters = await db.chapters.where('paperId').equals(paperId).toArray();
  for (const c of chapters) {
    await db.chapters.delete(c.id);
  }

  // Delete the paper itself
  await db.papers.delete(paperId);

  return { deletedQuestions: deleted, movedQuestions: moved };
}

// 5. Create or Edit Chapter
export async function saveChapter(chapter: Partial<Chapter>): Promise<Chapter> {
  const now = new Date().toISOString();

  if (chapter.id) {
    const existing = await db.chapters.get(chapter.id);
    if (!existing) throw new Error('Chapter not found');
    const updated: Chapter = {
      ...existing,
      ...chapter,
      updatedAt: now
    };
    await db.chapters.put(updated);
    return updated;
  } else {
    if (!chapter.paperId) throw new Error('Paper ID is required to create a Chapter');
    const id = 'chap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const existingCount = await db.chapters.where('paperId').equals(chapter.paperId).count();

    const newChapter: Chapter = {
      id,
      paperId: chapter.paperId,
      name: chapter.name || 'New Chapter',
      nameOdia: chapter.nameOdia || '',
      chapterNumber: chapter.chapterNumber ?? existingCount + 1,
      description: chapter.description || '',
      subtopics: chapter.subtopics || [],
      order: chapter.order ?? existingCount + 1,
      createdAt: now,
      updatedAt: now
    };
    await db.chapters.put(newChapter);
    return newChapter;
  }
}

// 6. Safe Delete Chapter
export async function deleteChapterSafe(
  chapterId: string,
  options?: { moveQuestionsToChapterId?: string }
): Promise<{ deletedQuestions: number; movedQuestions: number }> {
  const linkedQuestions = await db.questions.where('chapterId').equals(chapterId).toArray();
  let moved = 0;
  let deleted = 0;

  if (linkedQuestions.length > 0) {
    if (options?.moveQuestionsToChapterId) {
      for (const q of linkedQuestions) {
        if (q.id) {
          await db.questions.update(q.id, {
            chapterId: options.moveQuestionsToChapterId,
            updatedAt: new Date().toISOString()
          });
          moved++;
        }
      }
    } else {
      for (const q of linkedQuestions) {
        if (q.id) {
          await db.questions.delete(q.id);
          deleted++;
        }
      }
    }
  }

  await db.chapters.delete(chapterId);
  return { deletedQuestions: deleted, movedQuestions: moved };
}

// 7. Fetch Filtered Questions for a Chapter
export async function getChapterQuestions(
  chapterId: string,
  filters?: QuestionFilterOptions
): Promise<Question[]> {
  try {
    let questions: Question[] = [];
    try {
      questions = await db.questions.where('chapterId').equals(chapterId).toArray();
    } catch {
      const all = await db.questions.toArray();
      questions = all.filter((q) => q.chapterId === chapterId);
    }

    if (!filters) return questions;

    return questions.filter((q) => {
    // Search query filter
    if (filters.searchQuery) {
      const qText = (q.question + ' ' + (q.questionOdia || '') + ' ' + (q.questionEnglish || '') + ' ' + q.correctAnswer).toLowerCase();
      if (!qText.includes(filters.searchQuery.toLowerCase())) {
        return false;
      }
    }

    // Pattern filter
    if (filters.pattern && filters.pattern !== 'all') {
      if (q.pattern !== filters.pattern) return false;
    }

    // Marks filter
    if (filters.marks && filters.marks !== 'all') {
      if (q.marks !== filters.marks) return false;
    }

    // Difficulty filter
    if (filters.difficulty && filters.difficulty !== 'all') {
      if (q.difficulty !== filters.difficulty) return false;
    }

    // Language filter
    if (filters.language && filters.language !== 'all') {
      if (q.language !== filters.language) return false;
    }

    return true;
  });
  } catch (error) {
    console.error('Error in getChapterQuestions:', error);
    return [];
  }
}

// 8. Move Questions to Another Chapter
export async function moveQuestions(
  questionIds: number[],
  targetPaperId: string,
  targetChapterId: string
): Promise<number> {
  const targetPaper = await db.papers.get(targetPaperId);
  const targetChapter = await db.chapters.get(targetChapterId);
  let updatedCount = 0;

  for (const qId of questionIds) {
    const q = await db.questions.get(qId);
    if (q) {
      await db.questions.update(qId, {
        paperId: targetPaperId,
        chapterId: targetChapterId,
        paper: targetPaper?.name || q.paper,
        chapter: targetChapter?.name || q.chapter,
        updatedAt: new Date().toISOString()
      });
      updatedCount++;
    }
  }

  return updatedCount;
}

// 9. Copy Questions to Another Chapter
export async function copyQuestions(
  questionIds: number[],
  targetPaperId: string,
  targetChapterId: string
): Promise<number> {
  const targetPaper = await db.papers.get(targetPaperId);
  const targetChapter = await db.chapters.get(targetChapterId);
  let copiedCount = 0;

  for (const qId of questionIds) {
    const q = await db.questions.get(qId);
    if (q) {
      const copy: Omit<Question, 'id'> = {
        ...q,
        paperId: targetPaperId,
        chapterId: targetChapterId,
        paper: targetPaper?.name || q.paper,
        chapter: targetChapter?.name || q.chapter,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await db.questions.add(copy);
      copiedCount++;
    }
  }

  return copiedCount;
}

// 10. Generate Random Test Selection from Selected Chapter(s)
export async function generateRandomSelection(options: RandomTestOptions): Promise<Question[]> {
  let pool: Question[] = [];

  for (const cId of options.chapterIds) {
    const qs = await db.questions.where('chapterId').equals(cId).toArray();
    pool.push(...qs);
  }

  // Filter by language if specified
  if (options.language && options.language !== 'all') {
    pool = pool.filter((q) => q.language === options.language);
  }

  // Filter by difficulty if specified
  if (options.difficulty && options.difficulty !== 'all') {
    pool = pool.filter((q) => q.difficulty === options.difficulty);
  }

  // Shuffle pool using Fisher-Yates
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // If specific pattern distribution is requested
  if (options.patternDistribution && Object.keys(options.patternDistribution).length > 0) {
    const selected: Question[] = [];
    const usedIds = new Set<number>();

    for (const [pattern, targetCount] of Object.entries(options.patternDistribution)) {
      if (!targetCount || targetCount <= 0) continue;
      const matching = shuffled.filter((q) => q.pattern === pattern && !usedIds.has(q.id!));
      const taken = matching.slice(0, targetCount);
      for (const t of taken) {
        selected.push(t);
        usedIds.add(t.id!);
      }
    }

    // Fill remaining if needed
    if (selected.length < options.totalQuestions) {
      const remaining = shuffled.filter((q) => !usedIds.has(q.id!));
      const fill = remaining.slice(0, options.totalQuestions - selected.length);
      selected.push(...fill);
    }

    return selected;
  }

  // If marks distribution is requested
  if (options.marksDistribution && Object.keys(options.marksDistribution).length > 0) {
    const selected: Question[] = [];
    const usedIds = new Set<number>();

    for (const [marksStr, targetCount] of Object.entries(options.marksDistribution)) {
      const marksVal = Number(marksStr);
      if (!targetCount || targetCount <= 0) continue;
      const matching = shuffled.filter((q) => q.marks === marksVal && !usedIds.has(q.id!));
      const taken = matching.slice(0, targetCount);
      for (const t of taken) {
        selected.push(t);
        usedIds.add(t.id!);
      }
    }

    if (selected.length < options.totalQuestions) {
      const remaining = shuffled.filter((q) => !usedIds.has(q.id!));
      const fill = remaining.slice(0, options.totalQuestions - selected.length);
      selected.push(...fill);
    }

    return selected;
  }

  // Default random slice
  return shuffled.slice(0, Math.min(options.totalQuestions, shuffled.length));
}

// 11. Saved Test CRUD
export async function getSavedTests(): Promise<SavedTest[]> {
  return await db.savedTests.reverse().sortBy('createdAt');
}

export async function saveTestToLibrary(test: Partial<SavedTest>): Promise<SavedTest> {
  const now = new Date().toISOString();

  if (test.id) {
    const existing = await db.savedTests.get(test.id);
    if (!existing) throw new Error('Test not found');
    const updated: SavedTest = {
      ...existing,
      ...test,
      updatedAt: now
    };
    await db.savedTests.put(updated);
    return updated;
  } else {
    const id = 'test_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newTest: SavedTest = {
      id,
      title: test.title || 'Untitled History Test',
      paperId: test.paperId || '',
      paperName: test.paperName || 'General History',
      chapterIds: test.chapterIds || [],
      chapterNames: test.chapterNames || [],
      questionIds: test.questionIds || [],
      totalQuestions: test.totalQuestions || test.questionIds?.length || 0,
      totalMarks: test.totalMarks || 0,
      durationMinutes: test.durationMinutes || 30,
      language: test.language || 'bilingual',
      instructions: test.instructions || 'All questions are compulsory. Read instructions carefully.',
      patternDistribution: test.patternDistribution || {},
      createdAt: now,
      updatedAt: now
    };
    await db.savedTests.put(newTest);
    return newTest;
  }
}

export async function duplicateSavedTest(testId: string): Promise<SavedTest> {
  const original = await db.savedTests.get(testId);
  if (!original) throw new Error('Original test not found');

  const clone: SavedTest = {
    ...original,
    id: 'test_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    title: `${original.title} (ନକଲ / Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await db.savedTests.put(clone);
  return clone;
}

export async function deleteSavedTest(testId: string): Promise<void> {
  await db.savedTests.delete(testId);
}

// 12. Export Chapter Questions to Excel
export function exportChapterQuestionsExcel(paperName: string, chapterName: string, questions: Question[]) {
  const rows = questions.map((q, idx) => ({
    'SL NO': idx + 1,
    'PAPER': paperName,
    'CHAPTER': chapterName,
    'QUESTION': q.question,
    'PATTERN': q.pattern.toUpperCase(),
    'MARKS': q.marks,
    'DIFFICULTY': (q.difficulty || 'medium').toUpperCase(),
    'LANGUAGE': q.language.toUpperCase(),
    'OPTIONS': q.options ? q.options.join(' | ') : '',
    'CORRECT ANSWER': q.correctAnswer,
    'EXPLANATION': q.explanationCorrect || '',
    'MODEL ANSWER': q.modelAnswer || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Chapter Questions');
  const filename = `${paperName.replace(/\s+/g, '_')}_${chapterName.replace(/\s+/g, '_')}_Questions.xlsx`;
  XLSX.writeFile(workbook, filename);
}

// 13. Export Saved Test to PDF Question Paper Format
export function exportTestPaperPDF(test: SavedTest, questions: Question[], collegeName = 'ଇତିହାସ ବିଭାଗ, ସ୍ୱୟଂଶାସିତ ମହାବିଦ୍ୟାଳୟ') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Top Formal Exam Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(collegeName, 105, 18, { align: 'center' });

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(test.title, 105, 26, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Paper: ${test.paperName} | Chapter: ${test.chapterNames.join(', ')}`, 105, 33, { align: 'center' });

  // Time & Marks line
  doc.setLineWidth(0.4);
  doc.line(14, 37, 196, 37);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Time Allowed: ${test.durationMinutes} Minutes`, 14, 42);
  doc.text(`Total Questions: ${questions.length}`, 105, 42, { align: 'center' });
  doc.text(`Maximum Marks: ${test.totalMarks}`, 196, 42, { align: 'right' });

  doc.line(14, 45, 196, 45);

  // Instructions
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.text(`Instructions: ${test.instructions || 'All questions are compulsory. Figures in right margin indicate marks.'}`, 14, 50);

  let currentY = 58;

  // Group questions by section/pattern or render sequentially
  questions.forEach((q, idx) => {
    if (currentY > 265) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(`Q${idx + 1}.`, 14, currentY);

    doc.setFont('helvetica', 'normal');
    const questionLines = doc.splitTextToSize(q.question, 160);
    doc.text(questionLines, 22, currentY);

    // Marks on right
    doc.setFont('helvetica', 'bold');
    doc.text(`[${q.marks}]`, 196, currentY, { align: 'right' });

    currentY += questionLines.length * 5 + 2;

    // If MCQ, render options
    if (q.pattern === 'mcq' && q.options && q.options.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);

      const letters = ['(A)', '(B)', '(C)', '(D)'];

      // If options are short, render 2 per row
      if (q.options.every(o => o.length < 25)) {
        q.options.forEach((opt, oIdx) => {
          const colX = oIdx % 2 === 0 ? 24 : 110;
          const rowY = currentY + Math.floor(oIdx / 2) * 5;
          doc.text(`${letters[oIdx]} ${opt}`, colX, rowY);
        });
        currentY += Math.ceil(q.options.length / 2) * 5 + 4;
      } else {
        q.options.forEach((opt, oIdx) => {
          doc.text(`${letters[oIdx]} ${opt}`, 24, currentY);
          currentY += 5;
        });
        currentY += 2;
      }
    } else {
      currentY += 4;
    }
  });

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`ଇତିହାସ ଜ୍ଞାନ (ITIHASH GYAN) — Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
  }

  doc.save(`${test.title.replace(/\s+/g, '_')}_Question_Paper.pdf`);
}
