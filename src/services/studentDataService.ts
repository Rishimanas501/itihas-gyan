import { db } from '../db/index';
import type { Student, CourseEnrolment, CourseCategory } from '../types';
import { AUTHENTIC_STUDENTS_SEED, AUTHENTIC_ENROLMENTS_SEED } from '../data/authenticStudentsData';

export type CanonicalSemester = 'SEM_I' | 'SEM_II' | 'SEM_III' | 'SEM_IV' | 'SEM_V' | 'SEM_VI';

/**
 * Normalizes any variation of semester strings into a canonical code:
 * - '1st Semester', 'Sem-I', 'Semester I', 'Semester-I', '1', 'Sem 1', 'SEM_I' -> 'SEM_I'
 * - '2nd Semester', 'Sem-II', 'Semester II', 'Semester-II', '2', 'Sem 2', 'SEM_II' -> 'SEM_II'
 * - '3rd Semester', 'Sem-III', 'Semester III', 'Semester-III', '3', 'Sem 3', 'SEM_III' -> 'SEM_III'
 * - '4th Semester', 'Sem-IV', 'Semester IV', 'Semester-IV', '4', 'Sem 4', 'SEM_IV' -> 'SEM_IV'
 * - '5th Semester', 'Sem-V', 'Semester V', 'Semester-V', '5', 'Sem 5', 'SEM_V' -> 'SEM_V'
 * - '6th Semester', 'Sem-VI', 'Semester VI', 'Semester-VI', '6', 'Sem 6', 'SEM_VI' -> 'SEM_VI'
 */
export function normalizeSemester(sem?: string | null): CanonicalSemester | string {
  if (!sem) return '';
  const s = sem.trim().toUpperCase();
  if (s === 'ALL') return 'all';

  if (
    /^(1|1ST|SEM[\s-_]*1|SEM[\s-_]*I|SEMESTER[\s-_]*1|SEMESTER[\s-_]*I|SEM_I)$/i.test(s) ||
    s === '1ST SEMESTER' ||
    s === 'SEMESTER I'
  ) {
    return 'SEM_I';
  }
  if (
    /^(2|2ND|SEM[\s-_]*2|SEM[\s-_]*II|SEMESTER[\s-_]*2|SEMESTER[\s-_]*II|SEM_II)$/i.test(s) ||
    s === '2ND SEMESTER' ||
    s === 'SEMESTER II'
  ) {
    return 'SEM_II';
  }
  if (
    /^(3|3RD|SEM[\s-_]*3|SEM[\s-_]*III|SEMESTER[\s-_]*3|SEMESTER[\s-_]*III|SEM_III)$/i.test(s) ||
    s === '3RD SEMESTER' ||
    s === 'SEMESTER III'
  ) {
    return 'SEM_III';
  }
  if (
    /^(4|4TH|SEM[\s-_]*4|SEM[\s-_]*IV|SEMESTER[\s-_]*4|SEMESTER[\s-_]*IV|SEM_IV)$/i.test(s) ||
    s === '4TH SEMESTER' ||
    s === 'SEMESTER IV'
  ) {
    return 'SEM_IV';
  }
  if (
    /^(5|5TH|SEM[\s-_]*5|SEM[\s-_]*V|SEMESTER[\s-_]*5|SEMESTER[\s-_]*V|SEM_V)$/i.test(s) ||
    s === '5TH SEMESTER' ||
    s === 'SEMESTER V'
  ) {
    return 'SEM_V';
  }
  if (
    /^(6|6TH|SEM[\s-_]*6|SEM[\s-_]*VI|SEMESTER[\s-_]*6|SEMESTER[\s-_]*VI|SEM_VI)$/i.test(s) ||
    s === '6TH SEMESTER' ||
    s === 'SEMESTER VI'
  ) {
    return 'SEM_VI';
  }

  return s;
}

/**
 * Maps standard academic batches to their expected active semester:
 * - Batch 2024-27 -> Semester V (5th Semester)
 * - Batch 2025-28 -> Semester III (3rd Semester)
 * - Batch 2026-29 -> Semester I (1st Semester)
 */
export function getExpectedSemesterForBatch(batch: string): string {
  if (batch.includes('2024')) return 'Semester V';
  if (batch.includes('2025')) return 'Semester III';
  if (batch.includes('2026')) return 'Semester I';
  return '';
}

export const SEMESTER_OPTIONS = [
  { value: 'Semester I', code: 'SEM_I', label: 'Semester I (1st Sem)' },
  { value: 'Semester II', code: 'SEM_II', label: 'Semester II (2nd Sem)' },
  { value: 'Semester III', code: 'SEM_III', label: 'Semester III (3rd Sem)' },
  { value: 'Semester IV', code: 'SEM_IV', label: 'Semester IV (4th Sem)' },
  { value: 'Semester V', code: 'SEM_V', label: 'Semester V (5th Sem)' },
  { value: 'Semester VI', code: 'SEM_VI', label: 'Semester VI (6th Sem)' }
];

/**
 * Normalizes any category string variant into canonical CourseCategory:
 * - 'Major', 'major', 'Major (Core-I)', 'Core-I', 'Core 1', 'Core-1' -> 'Major'
 * - 'Minor', 'minor', 'Minor (Core-II / Core-III)', 'Minor-I', 'Minor-II', 'Core-II', 'Core-III' -> 'Minor'
 * - 'MDC', 'mcb', 'mdc', 'multidisciplinary' -> 'MDC'
 * - 'AEC', 'aec', 'ability' -> 'AEC'
 * - 'SEC', 'sec', 'skill' -> 'SEC'
 * - 'VAC', 'vac', 'value' -> 'VAC'
 */
export function normalizeCourseCategory(cat?: string | null): CourseCategory | string {
  if (!cat) return '';
  const c = cat.trim();
  const lower = c.toLowerCase();
  if (lower.startsWith('major') || lower.includes('core-i') || lower === 'core 1' || lower === 'core-1') return 'Major';
  if (lower.startsWith('minor') || lower.includes('core-ii') || lower.includes('core-iii') || lower.includes('core 2') || lower.includes('core 3') || lower.includes('core-2') || lower.includes('core-3')) return 'Minor';
  if (lower.startsWith('mdc') || lower.startsWith('mcb') || lower.includes('multidiscipl')) return 'MDC';
  if (lower.startsWith('aec') || lower.includes('ability')) return 'AEC';
  if (lower.startsWith('sec') || lower.includes('skill')) return 'SEC';
  if (lower.startsWith('vac') || lower.includes('value')) return 'VAC';
  return c;
}

export const STUDENTS_REPLACED_FLAG_KEY = 'itihas_students_replaced_by_import';

/**
 * Initializes students and course enrolments safely in Dexie IndexedDB.
 * Preserves authentic student records and links course enrolments,
 * unless the user has explicitly replaced the student list via Excel/CSV import.
 */
export async function initStudentsAndEnrolments(): Promise<{ studentsCount: number; enrolmentsCount: number }> {
  try {
    const existingStudents = await db.students.toArray();
    const existingEnrolmentsCount = await db.enrolments.count();
    const existingMinorCount = await db.enrolments.filter(e => normalizeCourseCategory(e.courseCategory) === 'Minor').count();
    const wasReplacedByImport =
      typeof localStorage !== 'undefined' &&
      localStorage.getItem(STUDENTS_REPLACED_FLAG_KEY) === 'true';

    // If user explicitly replaced the student list with their own Excel/CSV import,
    // never overwrite or re-seed the default 401 authentic students.
    if (wasReplacedByImport && existingStudents.length > 0) {
      const existingEnrolmentRolls = new Set((await db.enrolments.toArray()).map(e => e.rollNo));
      const now = new Date().toISOString();
      for (const st of existingStudents) {
        if (!existingEnrolmentRolls.has(st.rollNo)) {
          const batch = st.batch || '2024-27';
          const sem = st.semester || 'Semester I';
          const dept = st.department || 'History';
          await db.enrolments.add({
            studentId: st.id,
            rollNo: st.rollNo,
            courseCategory: 'Major',
            specificCategory: 'Major (Core-I)',
            subject: dept,
            department: dept,
            semester: sem,
            batch,
            academicSession: batch,
            createdAt: now,
            updatedAt: now
          });
        }
      }
      return {
        studentsCount: existingStudents.length,
        enrolmentsCount: await db.enrolments.count()
      };
    }

    const hasDummyStudents = existingStudents.some(s => s.rollNo.startsWith('HIST-2024-00'));
    const needsStudentsSeed = existingStudents.length < AUTHENTIC_STUDENTS_SEED.length || hasDummyStudents;
    const needsEnrolmentsSync = existingEnrolmentsCount !== AUTHENTIC_ENROLMENTS_SEED.length || existingMinorCount === 0 || hasDummyStudents;

    if (hasDummyStudents) {
      for (const st of existingStudents) {
        if (st.id && st.rollNo.startsWith('HIST-2024-00')) {
          await db.students.delete(st.id);
        }
      }
    }

    if (needsStudentsSeed) {
      for (const st of AUTHENTIC_STUDENTS_SEED) {
        const found = await db.students.where('rollNo').equals(st.rollNo).first();
        if (!found) {
          await db.students.add(st);
        } else if (found.id) {
          await db.students.update(found.id, {
            name: st.name,
            department: st.department,
            batch: st.batch,
            semester: st.semester,
            courseType: 'Major',
            subjectClass: st.subjectClass,
            universityRoll: st.universityRoll || found.universityRoll,
            gender: st.gender || found.gender,
            category: st.category || found.category,
            mobile: st.mobile || found.mobile,
            admissionDate: st.admissionDate || found.admissionDate,
            updatedAt: new Date().toISOString()
          });
        }
      }
    } else {
      // Ensure all students have normalized semester & batch
      const seedMap = new Map(AUTHENTIC_STUDENTS_SEED.map(s => [s.rollNo, s]));
      for (const st of existingStudents) {
        if (!st.id) continue;
        const authData = seedMap.get(st.rollNo);
        if (authData) {
          if (st.semester !== authData.semester || st.batch !== authData.batch || st.department !== authData.department || !st.universityRoll) {
            await db.students.update(st.id, {
              department: authData.department,
              batch: authData.batch,
              semester: authData.semester,
              subjectClass: authData.subjectClass,
              universityRoll: authData.universityRoll || st.universityRoll,
              updatedAt: new Date().toISOString()
            });
          }
        }
      }
    }

    // Always ensure all authentic enrolments (from all 401 students across 3 batches) are present
    if (needsEnrolmentsSync) {
      await db.enrolments.clear();
      const allCurrentStudents = await db.students.toArray();
      const studentIdByRoll = new Map<string, number>();
      allCurrentStudents.forEach(s => {
        if (s.id) studentIdByRoll.set(s.rollNo, s.id);
      });

      const enrolmentsToInsert: Omit<CourseEnrolment, 'id'>[] = AUTHENTIC_ENROLMENTS_SEED.map(e => ({
        ...e,
        studentId: studentIdByRoll.get(e.rollNo)
      }));

      const chunkSize = 500;
      for (let i = 0; i < enrolmentsToInsert.length; i += chunkSize) {
        const chunk = enrolmentsToInsert.slice(i, i + chunkSize);
        await db.enrolments.bulkAdd(chunk);
      }
    }

    // For any custom-imported or manually added students without enrolments, ensure only their declared major exists
    const allStudentsAfterSeed = await db.students.toArray();
    const existingEnrolmentRolls = new Set((await db.enrolments.toArray()).map(e => e.rollNo));
    const now = new Date().toISOString();

    for (const st of allStudentsAfterSeed) {
      if (!existingEnrolmentRolls.has(st.rollNo)) {
        const batch = st.batch || '2024-27';
        const sem = st.semester || 'Semester I';
        const dept = st.department || 'History';

        // Add single authentic Major enrolment declared by the student record
        await db.enrolments.add({
          studentId: st.id,
          rollNo: st.rollNo,
          courseCategory: 'Major',
          specificCategory: 'Major (Core-I)',
          subject: dept,
          department: dept,
          semester: sem,
          batch,
          academicSession: batch,
          createdAt: now,
          updatedAt: now
        });
      }
    }

    const finalStudentsCount = await db.students.count();
    const finalEnrolmentsCount = await db.enrolments.count();
    return { studentsCount: finalStudentsCount, enrolmentsCount: finalEnrolmentsCount };
  } catch (error) {
    console.error('Error in initStudentsAndEnrolments:', error);
    return { studentsCount: 0, enrolmentsCount: 0 };
  }
}

/**
 * Returns all students with their linked course enrolments attached.
 */
export async function getStudentsWithEnrolments(): Promise<Student[]> {
  const students = await db.students.toArray();
  const allEnrolments = await db.enrolments.toArray();

  const enrolmentsByRoll = new Map<string, CourseEnrolment[]>();
  for (const enr of allEnrolments) {
    const list = enrolmentsByRoll.get(enr.rollNo) || [];
    list.push(enr);
    enrolmentsByRoll.set(enr.rollNo, list);
  }

  return students.map(st => ({
    ...st,
    enrolments: enrolmentsByRoll.get(st.rollNo) || []
  }));
}

/**
 * Checks whether a student's batch string matches the requested batch filter.
 * Handles canonical representations ('2024-27' vs '2024-2027', etc.).
 */
export function matchesBatch(studentBatch?: string, filterBatch?: string): boolean {
  if (!filterBatch || filterBatch === 'all') return true;
  if (!studentBatch) return false;
  const s = studentBatch.trim();
  const f = filterBatch.trim();
  if (s === f) return true;
  if (f === '2024-27' && (s === '2024-2027' || s === '2024-27')) return true;
  if (f === '2025-28' && (s === '2025-2028' || s === '2025-28')) return true;
  if (f === '2026-29' && (s === '2026-2029' || s === '2026-29')) return true;
  return false;
}

export interface StudentFilterParams {
  batch?: string;
  category?: CourseCategory | 'all' | string;
  subject?: string;
  semester?: string;
  status?: string;
  searchQuery?: string;
  department?: string;
}

/**
 * SINGLE CENTRAL FILTERING ENGINE (getFilteredStudents)
 * Source of truth for:
 * 1. Filtered student list displayed in the UI
 * 2. Total student counts in the Heading and Active Filter Trail
 * 3. Subject option counts in the Subject dropdown
 * 4. Semester option counts in the Semester dropdown
 * 5. NEP Course Category student counts
 *
 * Enforces strict relational AND logic between:
 * College Roll No + Batch + Category + Subject + Semester.
 * Strictly prevents assuming that a student studies the same subject in every semester
 * or assuming a subject is available across all semesters.
 */
export function getFilteredStudents(students: Student[], filters: StudentFilterParams = {}): Student[] {
  const {
    batch = 'all',
    category = 'all',
    subject = 'all',
    semester = 'all',
    status = 'all',
    searchQuery = '',
    department = 'all'
  } = filters;

  const q = (searchQuery || '').trim().toLowerCase();
  const hasBatch = Boolean(batch && batch !== 'all');
  const hasCat = Boolean(category && category !== 'all');
  const hasSubj = Boolean(subject && subject !== 'all' && subject.trim());
  const hasSem = Boolean(semester && semester !== 'all' && semester.trim());
  const hasStatus = Boolean(status && status !== 'all');
  const hasDept = Boolean(department && department !== 'all');

  const normCat = hasCat ? normalizeCourseCategory(category) : '';
  const normSubj = hasSubj ? subject.trim().toLowerCase() : '';
  const normSem = hasSem ? normalizeSemester(semester) : '';

  // Use a map/set by rollNo to guarantee unique students
  const matchedStudents: Student[] = [];
  const seenRolls = new Set<string>();

  for (const st of students) {
    if (seenRolls.has(st.rollNo)) continue;

    // 1. Level 1: Batch Filter Scope
    if (hasBatch && !matchesBatch(st.batch, batch)) {
      continue;
    }

    // Status Filter
    if (hasStatus && st.status !== status) {
      continue;
    }

    // Optional Department Filter
    if (hasDept && st.department.toLowerCase() !== department.toLowerCase()) {
      continue;
    }

    // 2. Levels 2, 3, 4: Relational Academic Course Enrolment Filter
    if (hasCat || hasSubj || hasSem) {
      const enrs = st.enrolments || [];
      if (enrs.length > 0) {
        // Must match an authentic enrolment record satisfying ALL specified academic criteria (AND logic)
        const hasMatchingEnrolment = enrs.some(e => {
          if (hasBatch && !matchesBatch(e.batch, batch)) return false;
          if (hasCat && normalizeCourseCategory(e.courseCategory) !== normCat) return false;
          if (hasSubj && e.subject.trim().toLowerCase() !== normSubj) return false;
          if (hasSem && normalizeSemester(e.semester) !== normSem) return false;
          return true;
        });

        if (!hasMatchingEnrolment) {
          continue;
        }
      } else {
        // Fallback for standalone student without detailed enrolment records
        if (hasCat && normCat !== 'Major') continue;
        if (hasSubj && (st.subjectClass || st.department).trim().toLowerCase() !== normSubj) continue;
        if (hasSem && normalizeSemester(st.semester) !== normSem) continue;
      }
    }

    // 3. Level 5: Text Search within filtered scope
    if (q) {
      const matchRoll = (st.rollNo || '').toLowerCase().includes(q);
      const matchUnivRoll = (st.universityRoll || '').toLowerCase().includes(q);
      const matchName = (st.name || '').toLowerCase().includes(q);
      const matchDept = (st.department || '').toLowerCase().includes(q);
      const matchBatch = (st.batch || '').toLowerCase().includes(q);
      const matchEnrolmentSubj = (st.enrolments || []).some(e => 
        (e.subject && e.subject.toLowerCase().includes(q)) || 
        (e.specificCategory && e.specificCategory.toLowerCase().includes(q))
      );
      if (!matchRoll && !matchUnivRoll && !matchName && !matchDept && !matchBatch && !matchEnrolmentSubj) {
        continue;
      }
    }

    seenRolls.add(st.rollNo);
    matchedStudents.push(st);
  }

  return matchedStudents;
}

/**
 * Backward-compatible wrapper delegating directly to getFilteredStudents
 */
export function filterStudentsWithEnrolments(
  students: Student[],
  filters: {
    category: CourseCategory | 'all';
    subject: string;
    department?: string;
    batch: string;
    semester: string;
    status: string;
    searchQuery: string;
  }
): Student[] {
  return getFilteredStudents(students, filters);
}

/**
 * Calculates distinct student counts for each course category within a given batch.
 * Uses the central filtering engine to ensure 100% consistency with the student list.
 */
export function calculateCategoryCounts(
  students: Student[],
  selectedBatch: string = 'all'
): {
  all: number;
  major: number;
  minor: number;
  mdc: number;
  aec: number;
  sec: number;
  vac: number;
} {
  return {
    all: getFilteredStudents(students, { batch: selectedBatch }).length,
    major: getFilteredStudents(students, { batch: selectedBatch, category: 'Major' }).length,
    minor: getFilteredStudents(students, { batch: selectedBatch, category: 'Minor' }).length,
    mdc: getFilteredStudents(students, { batch: selectedBatch, category: 'MDC' }).length,
    aec: getFilteredStudents(students, { batch: selectedBatch, category: 'AEC' }).length,
    sec: getFilteredStudents(students, { batch: selectedBatch, category: 'SEC' }).length,
    vac: getFilteredStudents(students, { batch: selectedBatch, category: 'VAC' }).length,
  };
}

/**
 * Returns available subjects with real enrolled unique student counts.
 * Uses getFilteredStudents to ensure the count strictly equals the filtered student list.
 */
export function getAvailableSubjectsWithCounts(
  students: Student[], 
  selectedCategory: CourseCategory | 'all' = 'all',
  selectedBatch: string = 'all',
  selectedSemester: string = 'all'
): { subject: string; count: number }[] {
  // Find all distinct subjects enrolled under the given batch and category
  const subjectsSet = new Set<string>();
  const scopedStudents = getFilteredStudents(students, { batch: selectedBatch, category: selectedCategory });

  for (const st of scopedStudents) {
    for (const e of st.enrolments || []) {
      if (selectedBatch !== 'all' && !matchesBatch(e.batch, selectedBatch)) continue;
      if (selectedCategory !== 'all' && normalizeCourseCategory(e.courseCategory) !== normalizeCourseCategory(selectedCategory)) continue;
      const subj = e.subject?.trim();
      if (subj && subj !== '**' && subj !== '-' && subj !== 'NA') {
        subjectsSet.add(subj);
      }
    }
  }

  // Calculate unique student count for each subject using the central filtering engine
  const result: { subject: string; count: number }[] = [];
  for (const subj of Array.from(subjectsSet).sort()) {
    const count = getFilteredStudents(students, {
      batch: selectedBatch,
      category: selectedCategory,
      subject: subj,
      semester: selectedSemester
    }).length;

    // When a specific semester is chosen, only display subjects available in that semester
    if (selectedSemester === 'all' || count > 0) {
      result.push({ subject: subj, count });
    }
  }

  return result.sort((a, b) => a.subject.localeCompare(b.subject));
}

/**
 * Returns available semesters matching the selected Batch, Category, and Subject.
 * Uses authentic enrolment records and the central filtering engine to ensure valid combinations.
 */
export function getAvailableSemesters(
  students: Student[],
  selectedBatch: string = 'all',
  selectedCategory: CourseCategory | 'all' = 'all',
  selectedSubject: string = 'all'
): { value: string; code: string; label: string; count: number }[] {
  const semestersFound = new Set<string>();
  const scopedStudents = getFilteredStudents(students, {
    batch: selectedBatch,
    category: selectedCategory,
    subject: selectedSubject
  });

  for (const st of scopedStudents) {
    for (const e of st.enrolments || []) {
      if (selectedBatch !== 'all' && !matchesBatch(e.batch, selectedBatch)) continue;
      if (selectedCategory !== 'all' && normalizeCourseCategory(e.courseCategory) !== normalizeCourseCategory(selectedCategory)) continue;
      if (selectedSubject !== 'all' && e.subject.trim().toLowerCase() !== selectedSubject.trim().toLowerCase()) continue;

      if (e.semester) {
        semestersFound.add(normalizeSemester(e.semester) as string);
      }
    }
  }

  const result: { value: string; code: string; label: string; count: number }[] = [];

  for (const opt of SEMESTER_OPTIONS) {
    if (semestersFound.has(opt.code)) {
      const count = getFilteredStudents(students, {
        batch: selectedBatch,
        category: selectedCategory,
        subject: selectedSubject,
        semester: opt.value
      }).length;

      if (count > 0) {
        result.push({ ...opt, count });
      }
    }
  }

  return result;
}

/**
 * Returns available subjects under a given course category as simple strings.
 */
export function getAvailableSubjects(
  students: Student[], 
  selectedCategory: CourseCategory | 'all',
  selectedBatch: string = 'all',
  selectedSemester: string = 'all'
): string[] {
  return getAvailableSubjectsWithCounts(students, selectedCategory, selectedBatch, selectedSemester).map(s => s.subject);
}

