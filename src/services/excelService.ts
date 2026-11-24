import * as XLSX from 'xlsx';
import type { Student, CourseEnrolment, CourseCategory, Question, StudentSessionSummary, QuestionPattern, DifficultyLevel, QuestionLanguage } from '../types';

export interface ColumnMapping {
  rollNo: string;
  name: string;
  department: string;
  semester: string;
  batch: string;
  courseType?: string;
  subjectClass: string;
  status: string;
}

export interface ParseResult {
  headers: string[];
  rawRows: any[];
  parsedStudents: Omit<Student, 'id'>[];
  parsedEnrolments: Omit<CourseEnrolment, 'id'>[];
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

// Helper to detect specific semester mentions in column headers
export function detectSemesterFromHeader(header: string, defaultSem: string): string {
  const lower = header.toLowerCase();
  if (lower.includes('sem-1') || lower.includes('sem 1') || lower.includes('sem_1') || lower.includes('semester-1') || lower.includes('semester 1') || lower.includes('semester-i') || lower.includes('semester i') || lower.includes('1st sem') || lower.includes('1st-sem')) return 'Semester I';
  if (lower.includes('sem-2') || lower.includes('sem 2') || lower.includes('sem_2') || lower.includes('semester-2') || lower.includes('semester 2') || lower.includes('semester-ii') || lower.includes('semester ii') || lower.includes('2nd sem') || lower.includes('2nd-sem')) return 'Semester II';
  if (lower.includes('sem-3') || lower.includes('sem 3') || lower.includes('sem_3') || lower.includes('semester-3') || lower.includes('semester 3') || lower.includes('semester-iii') || lower.includes('semester iii') || lower.includes('3rd sem') || lower.includes('3rd-sem')) return 'Semester III';
  if (lower.includes('sem-4') || lower.includes('sem 4') || lower.includes('sem_4') || lower.includes('semester-4') || lower.includes('semester 4') || lower.includes('semester-iv') || lower.includes('semester iv') || lower.includes('4th sem') || lower.includes('4th-sem')) return 'Semester IV';
  if (lower.includes('sem-5') || lower.includes('sem 5') || lower.includes('sem_5') || lower.includes('semester-5') || lower.includes('semester 5') || lower.includes('semester-v') || lower.includes('semester v') || lower.includes('5th sem') || lower.includes('5th-sem')) return 'Semester V';
  if (lower.includes('sem-6') || lower.includes('sem 6') || lower.includes('sem_6') || lower.includes('semester-6') || lower.includes('semester 6') || lower.includes('semester-vi') || lower.includes('semester vi') || lower.includes('6th sem') || lower.includes('6th-sem')) return 'Semester VI';
  return defaultSem;
}

// Convert raw rows using mapping and multi-column NEP detection into validated Students and Enrolments
export function mapRowsToStudents(
  headers: string[],
  rawRows: any[],
  mapping: ColumnMapping,
  options?: { defaultBatch?: string; defaultDepartment?: string; defaultCourseType?: string }
): ParseResult {
  const rollIndex = headers.indexOf(mapping.rollNo);
  const nameIndex = headers.indexOf(mapping.name);
  const deptIndex = headers.indexOf(mapping.department);
  const semIndex = headers.indexOf(mapping.semester);
  const batchIndex = headers.indexOf(mapping.batch);
  const courseTypeIndex = mapping.courseType ? headers.indexOf(mapping.courseType) : -1;
  const subjIndex = headers.indexOf(mapping.subjectClass);
  const statusIndex = headers.indexOf(mapping.status);

  // Detect NEP multi-enrolment columns across headers
  const majorIndices: { index: number; label: string; semester: string }[] = [];
  const minorIndices: { index: number; label: string; semester: string }[] = [];
  const mdcIndices: { index: number; label: string; semester: string }[] = [];
  const aecIndices: { index: number; label: string; semester: string }[] = [];
  const secIndices: { index: number; label: string; semester: string }[] = [];
  const vacIndices: { index: number; label: string; semester: string }[] = [];

  headers.forEach((h, idx) => {
    const lower = h.toLowerCase();
    if (lower.includes('major') || lower.includes('core-i') || lower.includes('core 1') || lower.includes('core-1')) {
      const sem = detectSemesterFromHeader(h, '');
      majorIndices.push({ index: idx, label: h, semester: sem });
    } else if (lower.includes('minor') || lower.includes('core-ii') || lower.includes('core-iii') || lower.includes('core 2') || lower.includes('core 3')) {
      const sem = detectSemesterFromHeader(h, '');
      minorIndices.push({ index: idx, label: h, semester: sem });
    } else if (lower.includes('mdc') || lower.includes('mcb') || lower.includes('multidiscipl')) {
      const sem = detectSemesterFromHeader(h, 'Semester I');
      mdcIndices.push({ index: idx, label: h, semester: sem });
    } else if (lower.includes('aec') || lower.includes('ability')) {
      const sem = detectSemesterFromHeader(h, 'Semester I');
      aecIndices.push({ index: idx, label: h, semester: sem });
    } else if (lower.includes('sec') || lower.includes('skill')) {
      const sem = detectSemesterFromHeader(h, 'Semester II');
      secIndices.push({ index: idx, label: h, semester: sem });
    } else if (lower.includes('vac') || lower.includes('value')) {
      const sem = detectSemesterFromHeader(h, 'Semester I');
      vacIndices.push({ index: idx, label: h, semester: sem });
    }
  });

  const isNepSpreadsheet = (majorIndices.length > 0 || minorIndices.length > 0 || mdcIndices.length > 0 || aecIndices.length > 0);

  const seenRolls = new Set<string>();
  const duplicates: string[] = [];
  let missingRolls = 0;
  const parsedStudents: Omit<Student, 'id'>[] = [];
  const parsedEnrolments: Omit<CourseEnrolment, 'id'>[] = [];
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

    // Determine Batch with intelligent normalization
    const rowBatch = batchIndex !== -1 && row[batchIndex] ? String(row[batchIndex]).trim() : '';
    let batch = rowBatch || options?.defaultBatch || '2024-27';
    if (batch.includes('24') || batch.includes('2024')) batch = '2024-27';
    else if (batch.includes('25') || batch.includes('2025')) batch = '2025-28';
    else if (batch.includes('26') || batch.includes('2026')) batch = '2026-29';

    // Determine Department
    let department = deptIndex !== -1 && row[deptIndex] ? String(row[deptIndex]).trim() : '';
    if (!department && majorIndices.length > 0 && row[majorIndices[0].index]) {
      department = String(row[majorIndices[0].index]).trim();
    }
    if (!department) department = options?.defaultDepartment || 'History';

    // Semester default based on batch
    let semester = semIndex !== -1 && row[semIndex] ? String(row[semIndex]).trim() : '';
    if (!semester) {
      semester = batch === '2024-27' ? 'Semester V' : batch === '2025-28' ? 'Semester III' : 'Semester I';
    }

    const studentEnrolments: Omit<CourseEnrolment, 'id'>[] = [];

    if (isNepSpreadsheet) {
      // 1. Major
      majorIndices.forEach(m => {
        const val = row[m.index] ? String(row[m.index]).trim() : '';
        if (val && val !== '**' && val !== '-' && val !== 'NA') {
          studentEnrolments.push({
            rollNo,
            courseCategory: 'Major',
            specificCategory: m.label,
            subject: val,
            department: val,
            semester: m.semester || semester,
            batch,
            academicSession: batch,
            createdAt: now,
            updatedAt: now
          });
        }
      });

      // 2. Minor
      minorIndices.forEach(m => {
        const val = row[m.index] ? String(row[m.index]).trim() : '';
        if (val && val !== '**' && val !== '-' && val !== 'NA') {
          studentEnrolments.push({
            rollNo,
            courseCategory: 'Minor',
            specificCategory: m.label,
            subject: val,
            department: val,
            semester: m.semester || semester,
            batch,
            academicSession: batch,
            createdAt: now,
            updatedAt: now
          });
        }
      });

      // 3. MDC
      mdcIndices.forEach(m => {
        const val = row[m.index] ? String(row[m.index]).trim() : '';
        if (val && val !== '**' && val !== '-' && val !== 'NA') {
          studentEnrolments.push({
            rollNo,
            courseCategory: 'MDC',
            specificCategory: m.label,
            subject: val,
            department,
            semester: m.semester,
            batch,
            academicSession: batch,
            createdAt: now,
            updatedAt: now
          });
        }
      });

      // 4. AEC
      aecIndices.forEach(m => {
        const val = row[m.index] ? String(row[m.index]).trim() : '';
        if (val && val !== '**' && val !== '-' && val !== 'NA') {
          studentEnrolments.push({
            rollNo,
            courseCategory: 'AEC',
            specificCategory: m.label,
            subject: val,
            department,
            semester: m.semester,
            batch,
            academicSession: batch,
            createdAt: now,
            updatedAt: now
          });
        }
      });

      // 5. SEC
      secIndices.forEach(m => {
        const val = row[m.index] ? String(row[m.index]).trim() : '';
        if (val && val !== '**' && val !== '-' && val !== 'NA') {
          studentEnrolments.push({
            rollNo,
            courseCategory: 'SEC',
            specificCategory: m.label,
            subject: val,
            department,
            semester: m.semester,
            batch,
            academicSession: batch,
            createdAt: now,
            updatedAt: now
          });
        }
      });

      // 6. VAC
      vacIndices.forEach(m => {
        const val = row[m.index] ? String(row[m.index]).trim() : '';
        if (val && val !== '**' && val !== '-' && val !== 'NA') {
          studentEnrolments.push({
            rollNo,
            courseCategory: 'VAC',
            specificCategory: m.label,
            subject: val,
            department,
            semester: m.semester,
            batch,
            academicSession: batch,
            createdAt: now,
            updatedAt: now
          });
        }
      });
    } else {
      // Standard Single-Subject Format: Create single enrolment
      const rawCourseType = (courseTypeIndex !== -1 && row[courseTypeIndex] ? String(row[courseTypeIndex]).trim() : '') ||
                            (subjIndex !== -1 && row[subjIndex] ? String(row[subjIndex]).trim() : '');
      const lowerCT = rawCourseType.toLowerCase();
      let courseCategory: CourseCategory = (options?.defaultCourseType as CourseCategory) || 'Major';
      if (lowerCT.includes('minor')) courseCategory = 'Minor';
      else if (lowerCT.includes('aec')) courseCategory = 'AEC';
      else if (lowerCT.includes('sec')) courseCategory = 'SEC';
      else if (lowerCT.includes('vac')) courseCategory = 'VAC';
      else if (lowerCT.includes('multi') || lowerCT.includes('mdc')) courseCategory = 'MDC';
      else if (lowerCT.includes('major') || lowerCT.includes('core')) courseCategory = 'Major';

      const subjectName = subjIndex !== -1 && row[subjIndex] ? String(row[subjIndex]).trim() : `${department} Studies`;
      studentEnrolments.push({
        rollNo,
        courseCategory,
        specificCategory: courseCategory,
        subject: subjectName,
        department,
        semester,
        batch,
        academicSession: batch,
        createdAt: now,
        updatedAt: now
      });
    }

    parsedEnrolments.push(...studentEnrolments);

    parsedStudents.push({
      rollNo,
      name: name || 'Student ' + rollNo,
      department,
      semester,
      batch,
      courseType: 'Major',
      subjectClass: department,
      status: (statusIndex !== -1 && row[statusIndex] && String(row[statusIndex]).toLowerCase().includes('inact')) ? 'inactive' : 'active',
      enrolments: studentEnrolments as CourseEnrolment[],
      createdAt: now,
      updatedAt: now
    });
  });

  return {
    headers,
    rawRows,
    parsedStudents,
    parsedEnrolments,
    duplicates,
    missingRolls
  };
}

// Auto-detect column headers based on fuzzy keywords
export function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    rollNo: '',
    name: '',
    department: '',
    semester: '',
    batch: '',
    courseType: '',
    subjectClass: '',
    status: ''
  };

  headers.forEach((h) => {
    const lower = h.toLowerCase();
    if (lower.includes('roll') || lower.includes('reg') || lower.includes('id')) {
      if (!mapping.rollNo) mapping.rollNo = h;
    } else if (lower.includes('name') || lower.includes('student') || lower.includes('nama')) {
      if (!mapping.name) mapping.name = h;
    } else if (lower.includes('dept') || lower.includes('department') || lower.includes('stream')) {
      if (!mapping.department) mapping.department = h;
    } else if (lower.includes('course') || lower.includes('type') || lower.includes('category') || lower.includes('major') || lower.includes('minor') || lower.includes('mdc') || lower.includes('aec') || lower.includes('sec') || lower.includes('vac')) {
      if (!mapping.courseType) mapping.courseType = h;
    } else if (lower.includes('sem') || lower.includes('semester') || lower.includes('year')) {
      if (!mapping.semester) mapping.semester = h;
    } else if (lower.includes('batch') || lower.includes('session')) {
      if (!mapping.batch) mapping.batch = h;
    } else if (lower.includes('subject') || lower.includes('paper') || lower.includes('class')) {
      if (!mapping.subjectClass) mapping.subjectClass = h;
    } else if (lower.includes('status')) {
      if (!mapping.status) mapping.status = h;
    }
  });

  return mapping;
}

// Export Students to Excel (.xlsx)
export function exportStudentsToExcel(students: Student[], filename = 'ITIHAS_GYAN_Students.xlsx'): void {
  const worksheetData = students.map((s) => ({
    'Roll Number': s.rollNo,
    'Student Name': s.name,
    'Department': s.department,
    'Course Type': s.courseType || 'Major',
    'Batch': s.batch,
    'Semester': s.semester,
    'Subject / Class': s.subjectClass,
    'Status': s.status.toUpperCase(),
    'Created At': s.createdAt
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  XLSX.writeFile(workbook, filename);
}

// Export Students to CSV
export function exportStudentsToCSV(students: Student[], filename = 'ITIHAS_GYAN_Students.csv'): void {
  const headers = ['Roll Number', 'Student Name', 'Department', 'Semester', 'Batch', 'Subject / Class', 'Status'];
  const rows = students.map((s) => [
    `"${s.rollNo}"`,
    `"${s.name}"`,
    `"${s.department}"`,
    `"${s.semester}"`,
    `"${s.batch}"`,
    `"${s.subjectClass}"`,
    `"${s.status.toUpperCase()}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

// Download Student Import Template (Includes 2024-27, 2025-28, 2026-29 sample batches)
export function downloadStudentImportTemplate(): void {
  const templateData = [
    // Batch 1: 2024-27
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
      'Department': 'Political Science',
      'Semester': '4th Semester',
      'Batch': '2024-27',
      'Subject / Class': 'Indian Political System',
      'Status': 'Active'
    },
    // Batch 2: 2025-28
    {
      'College Roll Number': 'BA25-001',
      'Student Name': 'ସୌମ୍ୟରଞ୍ଜନ ପଟ୍ଟନାୟକ (Soumya Ranjan Patnaik)',
      'Department': 'History',
      'Semester': '2nd Semester',
      'Batch': '2025-28',
      'Subject / Class': 'Medieval History of India',
      'Status': 'Active'
    },
    {
      'College Roll Number': 'BA25-002',
      'Student Name': 'ଇପ୍ସିତା ପ୍ରିୟଦର୍ଶିନୀ (Ipsita Priyadarshini)',
      'Department': 'Odia',
      'Semester': '2nd Semester',
      'Batch': '2025-28',
      'Subject / Class': 'Odia Sahitya Itihas',
      'Status': 'Active'
    },
    // Batch 3: 2026-29
    {
      'College Roll Number': 'BA26-001',
      'Student Name': 'ରାକେଶ କୁମାର ସାହୁ (Rakesh Kumar Sahu)',
      'Department': 'History',
      'Semester': '1st Semester',
      'Batch': '2026-29',
      'Subject / Class': 'Ancient History of India',
      'Status': 'Active'
    },
    {
      'College Roll Number': 'BA26-002',
      'Student Name': 'ସ୍ନିଗ୍ଧାରାଣୀ ବେହେରା (Snigdharani Behera)',
      'Department': 'Economics',
      'Semester': '1st Semester',
      'Batch': '2026-29',
      'Subject / Class': 'Principles of Microeconomics',
      'Status': 'Active'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students_Template');
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

// Download Question Import Template (.xlsx)
export function downloadQuestionImportTemplate(): void {
  const sampleTemplate = [
    {
      'Question': 'ସିନ୍ଧୁ ସଭ୍ୟତାର ବୃହତ ସ୍ନାନାଗାର କେଉଁଠାରେ ଆବିଷ୍କୃତ ହୋଇଥିଲା? (Where was the Great Bath discovered?)',
      'Pattern': 'MCQ',
      'Marks': 1,
      'Difficulty': 'medium',
      'Option A': 'ମହେଞ୍ଜୋଦାରୋ (Mohenjo-daro)',
      'Option B': 'ହରପ୍ପା (Harappa)',
      'Option C': 'ଲୋଥାଲ (Lothal)',
      'Option D': 'କାଲିବଙ୍ଗାନ (Kalibangan)',
      'Correct Answer': 'ମହେଞ୍ଜୋଦାରୋ (Mohenjo-daro)',
      'Explanation': 'ମହେଞ୍ଜୋଦାରୋଠାରେ ବୃହତ ସ୍ନାନାଗାର ଆବିଷ୍କୃତ ହୋଇଥିଲା।',
      'Language': 'bilingual'
    },
    {
      'Question': 'ଐତିହାସିକ କଳିଙ୍ଗ ଯୁଦ୍ଧ ଖ୍ରୀଷ୍ଟପୂର୍ବ ୨୬୧ରେ ଦୟାନଦୀ ତଟରେ ସଂଗଠିତ ହୋଇଥିଲା।',
      'Pattern': 'TRUE_FALSE',
      'Marks': 1,
      'Difficulty': 'easy',
      'Option A': 'ସତ୍ୟ (True)',
      'Option B': 'ମିଥ୍ୟା (False)',
      'Option C': '',
      'Option D': '',
      'Correct Answer': 'ସତ୍ୟ (True)',
      'Explanation': 'ଖ୍ରୀଷ୍ଟପୂର୍ବ ୨୬୧ରେ ଅଶୋକ ଓ କଳିଙ୍ଗ ମଧ୍ୟରେ ଏହି ଯୁଦ୍ଧ ହୋଇଥିଲା।',
      'Language': 'bilingual'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleTemplate);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions_Template');
  XLSX.writeFile(workbook, 'ITIHAS_GYAN_Question_Import_Template.xlsx');
}

// Parse Questions File (Excel or CSV)
export async function parseQuestionsFile(
  file: File,
  targetPaperId: string,
  targetChapterId: string,
  paperName = 'History',
  chapterName = 'Chapter'
): Promise<{ parsed: Omit<Question, 'id'>[]; duplicates: string[]; invalidCount: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsed: Omit<Question, 'id'>[] = [];
        const seen = new Set<string>();
        const duplicates: string[] = [];
        let invalidCount = 0;
        const now = new Date().toISOString();

        for (const row of rows) {
          const qText = String(row['Question'] || row['QUESTION'] || row['question'] || '').trim();
          const ans = String(row['Correct Answer'] || row['CORRECT ANSWER'] || row['answer'] || row['Answer'] || '').trim();

          if (!qText || !ans) {
            invalidCount++;
            continue;
          }

          if (seen.has(qText.toLowerCase())) {
            duplicates.push(qText);
            continue;
          }
          seen.add(qText.toLowerCase());

          // Detect pattern
          let pat: QuestionPattern = 'mcq';
          const pStr = String(row['Pattern'] || row['PATTERN'] || '').toLowerCase();
          if (pStr.includes('blank')) pat = 'blanks';
          else if (pStr.includes('true') || pStr.includes('false')) pat = 'true_false';
          else if (pStr.includes('word')) pat = 'one_word';
          else if (pStr.includes('short')) pat = 'short';
          else if (pStr.includes('long')) pat = 'long';

          // Options
          let options: string[] | undefined = undefined;
          if (pat === 'mcq') {
            const optA = String(row['Option A'] || row['OptionA'] || row['A'] || '').trim();
            const optB = String(row['Option B'] || row['OptionB'] || row['B'] || '').trim();
            const optC = String(row['Option C'] || row['OptionC'] || row['C'] || '').trim();
            const optD = String(row['Option D'] || row['OptionD'] || row['D'] || '').trim();
            if (optA && optB) {
              options = [optA, optB, optC, optD].filter(Boolean);
            }
          }

          parsed.push({
            paperId: targetPaperId,
            chapterId: targetChapterId,
            paper: paperName,
            chapter: chapterName,
            subject: 'History',
            department: 'History',
            semester: '1st Semester',
            topic: chapterName,
            question: qText,
            pattern: pat,
            marks: Number(row['Marks'] || row['MARKS'] || 1) || 1,
            difficulty: (String(row['Difficulty'] || 'medium').toLowerCase() as DifficultyLevel) || 'medium',
            language: (String(row['Language'] || 'bilingual').toLowerCase() as QuestionLanguage) || 'bilingual',
            options,
            correctAnswer: ans,
            explanationCorrect: String(row['Explanation'] || row['EXPLANATION'] || '').trim(),
            approved: true,
            createdAt: now,
            updatedAt: now
          });
        }

        resolve({ parsed, duplicates, invalidCount });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
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
