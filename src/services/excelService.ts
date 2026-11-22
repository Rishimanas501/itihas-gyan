import * as XLSX from 'xlsx';
import type { Student, Question, QuestionScoreRecord, StudentSessionSummary } from '../types';

export interface ColumnMapping {
  rollNo: string;
  name: string;
  department: string;
  semester: string;
  batch: string;
  subjectClass: string;
  status: string;
}

export interface ParseResult {
  headers: string[];
  rawRows: any[];
  parsedStudents: Omit<Student, 'id'>[];
  duplicates: string[];
  missingRolls: number;
}

// Read and parse an Excel (.xlsx) or CSV file
export async function parseStudentFile(file: File): Promise<{ headers: string[]; rawRows: any[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rawJson.length === 0) {
          resolve({ headers: [], rawRows: [] });
          return;
        }

        const headers = (rawJson[0] as any[]).map(h => String(h || '').trim());
        const rows = rawJson.slice(1).filter(r => r && r.length > 0);

        resolve({ headers, rawRows: rows });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// Convert raw rows using mapping into validated Student objects
export function mapRowsToStudents(
  headers: string[],
  rawRows: any[],
  mapping: ColumnMapping
): ParseResult {
  const rollIndex = headers.indexOf(mapping.rollNo);
  const nameIndex = headers.indexOf(mapping.name);
  const deptIndex = headers.indexOf(mapping.department);
  const semIndex = headers.indexOf(mapping.semester);
  const batchIndex = headers.indexOf(mapping.batch);
  const subjIndex = headers.indexOf(mapping.subjectClass);
  const statusIndex = headers.indexOf(mapping.status);

  const seenRolls = new Set<string>();
  const duplicates: string[] = [];
  let missingRolls = 0;
  const parsedStudents: Omit<Student, 'id'>[] = [];
  const now = new Date().toISOString();

  rawRows.forEach((row) => {
    const rollNo = rollIndex !== -1 && row[rollIndex] ? String(row[rollIndex]).trim() : '';
    const name = nameIndex !== -1 && row[nameIndex] ? String(row[nameIndex]).trim() : '';

    if (!rollNo) {
      missingRolls++;
      return;
    }

    if (seenRolls.has(rollNo)) {
      duplicates.push(rollNo);
    } else {
      seenRolls.add(rollNo);
    }

    parsedStudents.push({
      rollNo,
      name: name || 'Student ' + rollNo,
      department: deptIndex !== -1 && row[deptIndex] ? String(row[deptIndex]).trim() : 'History',
      semester: semIndex !== -1 && row[semIndex] ? String(row[semIndex]).trim() : '4th Semester',
      batch: batchIndex !== -1 && row[batchIndex] ? String(row[batchIndex]).trim() : '2024-27',
      subjectClass: subjIndex !== -1 && row[subjIndex] ? String(row[subjIndex]).trim() : 'History of Odisha',
      status: (statusIndex !== -1 && row[statusIndex] && String(row[statusIndex]).toLowerCase().includes('inact')) ? 'inactive' : 'active',
      createdAt: now,
      updatedAt: now
    });
  });

  return {
    headers,
    rawRows,
    parsedStudents,
    duplicates,
    missingRolls
  };
}

// Auto-detect header mapping based on common variations
export function autoDetectMapping(headers: string[]): ColumnMapping {
  const findMatch = (candidates: string[]): string => {
    for (const c of candidates) {
      const match = headers.find(h => h.toLowerCase().includes(c.toLowerCase()));
      if (match) return match;
    }
    return '';
  };

  return {
    rollNo: findMatch(['roll', 'rollno', 'roll no', 'college roll', 'id']),
    name: findMatch(['name', 'student name', 'candidate']),
    department: findMatch(['department', 'dept', 'stream', 'faculty']),
    semester: findMatch(['semester', 'sem', 'year']),
    batch: findMatch(['batch', 'session', 'academic session']),
    subjectClass: findMatch(['subject', 'class', 'paper']),
    status: findMatch(['status', 'active'])
  };
}

// Export Students to Excel (.xlsx)
export function exportStudentsToExcel(students: Student[], filename = 'ITIHAS_GYAN_Students.xlsx'): void {
  const worksheetData = students.map((s, idx) => ({
    'SL NO': idx + 1,
    'COLLEGE ROLL NO': s.rollNo,
    'STUDENT NAME': s.name,
    'DEPARTMENT': s.department,
    'SEMESTER': s.semester,
    'BATCH / SESSION': s.batch,
    'SUBJECT / CLASS': s.subjectClass,
    'STATUS': s.status.toUpperCase()
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  XLSX.writeFile(workbook, filename);
}

// Export Students to CSV (.csv)
export function exportStudentsToCSV(students: Student[], filename = 'ITIHAS_GYAN_Students.csv'): void {
  const worksheetData = students.map(s => ({
    'RollNo': s.rollNo,
    'Name': s.name,
    'Department': s.department,
    'Semester': s.semester,
    'Batch': s.batch,
    'SubjectClass': s.subjectClass,
    'Status': s.status
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  downloadBlob(csvOutput, filename, 'text/csv;charset=utf-8;');
}

// Generate Downloadable Excel Student Import Template
export function downloadStudentImportTemplate(): void {
  const templateData = [
    {
      'College Roll Number': 'BA24-001',
      'Student Name': 'ସୁଭାଶିଷ ମହାନ୍ତି (Subhasis Mohanty)',
      'Department': 'History',
      'Semester': '4th Semester',
      'Batch': '2024-27',
      'Subject / Class': 'Core Paper VII: History of Odisha',
      'Status': 'Active'
    },
    {
      'College Roll Number': 'BA24-002',
      'Student Name': 'ପ୍ରିୟଙ୍କା ଦାସ (Priyanka Das)',
      'Department': 'History',
      'Semester': '4th Semester',
      'Batch': '2024-27',
      'Subject / Class': 'Core Paper VII: History of Odisha',
      'Status': 'Active'
    },
    {
      'College Roll Number': 'BA24-003',
      'Student Name': 'ସୌମ୍ୟରଞ୍ଜନ ପଟ୍ଟନାୟକ (Soumya Ranjan Patnaik)',
      'Department': 'History',
      'Semester': '4th Semester',
      'Batch': '2024-27',
      'Subject / Class': 'Core Paper VII: History of Odisha',
      'Status': 'Active'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
  XLSX.writeFile(workbook, 'ITIHAS_GYAN_Student_Import_Template.xlsx');
}

// Export Question Bank to Excel (.xlsx)
export function exportQuestionsToExcel(questions: Question[], filename = 'ITIHAS_GYAN_Question_Bank.xlsx'): void {
  const worksheetData = questions.map((q, idx) => ({
    'SL NO': idx + 1,
    'QUESTION': q.question,
    'PATTERN': q.pattern.toUpperCase(),
    'MARKS': q.marks,
    'CORRECT ANSWER': q.correctAnswer,
    'OPTIONS': q.options ? q.options.join(' | ') : '',
    'EXPLANATION (CORRECT)': q.explanationCorrect,
    'EXPLANATIONS (INCORRECT)': q.explanationIncorrect ? q.explanationIncorrect.join(' | ') : '',
    'MODEL ANSWER': q.modelAnswer || '',
    'KEYWORDS': q.keywords ? q.keywords.join(', ') : '',
    'RUBRIC': q.markingRubric || '',
    'SUBJECT': q.subject,
    'TOPIC': q.topic,
    'PAPER': q.paper,
    'SEMESTER': q.semester,
    'LANGUAGE': q.language.toUpperCase(),
    'APPROVED': q.approved ? 'YES' : 'NO'
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');
  XLSX.writeFile(workbook, filename);
}

// Export Quiz Results to Excel (.xlsx)
export function exportResultsToExcel(
  sessionTitle: string,
  summaries: StudentSessionSummary[],
  filename = 'ITIHAS_GYAN_Quiz_Results.xlsx'
): void {
  const worksheetData = summaries.map((s, idx) => ({
    'RANK': idx + 1,
    'ROLL NO': s.rollNo,
    'STUDENT NAME': s.name,
    'TOTAL MARKS': s.totalMarks,
    'CORRECT ANSWERS': s.correctCount,
    'INCORRECT ANSWERS': s.incorrectCount,
    'PARTIAL MARKS': s.partialCount,
    'BONUS MARKS': s.bonusCount,
    'HAND RAISES': s.handRaiseCount
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
  XLSX.writeFile(workbook, filename);
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
