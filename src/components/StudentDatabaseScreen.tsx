import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Upload, 
  Download, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  FileSpreadsheet, 
  X,
  Filter,
  GraduationCap,
  Check,
  BookOpen,
  Layers,
  Eye,
  Award,
  Sparkles
} from 'lucide-react';
import { db } from '../db';
import type { Student, CourseCategory, CourseType, CourseEnrolment } from '../types';
import { 
  parseStudentFile, 
  autoDetectMapping, 
  mapRowsToStudents, 
  exportStudentsToExcel, 
  downloadStudentImportTemplate,
  type ColumnMapping 
} from '../services/excelService';
import {
  initStudentsAndEnrolments,
  getStudentsWithEnrolments,
  calculateCategoryCounts,
  getAvailableSubjectsWithCounts,
  getAvailableSemesters,
  matchesBatch,
  normalizeCourseCategory,
  normalizeSemester,
  getFilteredStudents,
  filterStudentsWithEnrolments,
  getExpectedSemesterForBatch,
  SEMESTER_OPTIONS
} from '../services/studentDataService';

interface StudentDatabaseScreenProps {
  onBack: () => void;
}

export const STANDARD_BATCHES = ['2024-27', '2025-28', '2026-29'] as const;

export const STANDARD_DEPARTMENTS = [
  'History',
  'Political Science',
  'Odia',
  'Economics',
  'Education',
  'English',
  'Sanskrit',
  'Mathematics'
] as const;

export const StudentDatabaseScreen: React.FC<StudentDatabaseScreenProps> = ({ onBack: _onBack }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Filters: Batch, Course Category, Dynamic Subject, Department, Semester, Status
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory | 'all'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudentEnrolments, setViewingStudentEnrolments] = useState<Student | null>(null);

  // Import flow states
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [defaultImportBatch, setDefaultImportBatch] = useState<string>('2024-27');
  const [defaultImportDepartment, setDefaultImportDepartment] = useState<string>('History');
  const [defaultImportCourseType, setDefaultImportCourseType] = useState<string>('Major');
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    rollNo: '',
    name: '',
    department: '',
    semester: '',
    batch: '',
    courseType: '',
    subjectClass: '',
    status: ''
  });
  const [importPreview, setImportPreview] = useState<Omit<Student, 'id'>[]>([]);
  const [importEnrolmentsPreview, setImportEnrolmentsPreview] = useState<Omit<CourseEnrolment, 'id'>[]>([]);
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const [missingRollCount, setMissingRollCount] = useState(0);

  // Add / Edit Student Form State
  const [formData, setFormData] = useState({
    rollNo: '',
    name: '',
    department: 'History',
    semester: '4th Semester',
    batch: '2024-27',
    courseType: 'Major' as CourseType | string,
    subjectClass: 'History',
    status: 'active' as 'active' | 'inactive',
    universityRoll: '',
    gender: 'Male',
    category: 'General',
    mobile: ''
  });

  const loadStudents = async () => {
    await initStudentsAndEnrolments();
    const list = await getStudentsWithEnrolments();
    setStudents(list);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Compute unique dynamic departments from loaded students
  const allDepartments = Array.from(
    new Set([
      ...STANDARD_DEPARTMENTS,
      ...students.map(s => s.department).filter(Boolean)
    ])
  ).sort();

  // Category counts calculated from real course enrolments scoped to the selected batch
  const categoryCounts = calculateCategoryCounts(students, selectedBatch);

  // Dynamic subjects based on selected batch & course category with enrolled student counts
  const availableSubjectsWithCounts = getAvailableSubjectsWithCounts(students, selectedCategory, selectedBatch, selectedSemester);

  // Dynamic valid semesters strictly derived from selected batch, category, and subject
  const availableSemesters = getAvailableSemesters(students, selectedBatch, selectedCategory, selectedSubject);

  // Level 1: Handle batch change -> Resets Category, Subject, and Semester
  const handleBatchChange = (batch: string) => {
    setSelectedBatch(batch);
    setSelectedCategory('all');
    setSelectedSubject('all');
    setSelectedSemester('all');
  };

  // Level 2: Handle category change -> Preserves Batch, Resets Subject and Semester
  const handleCategoryChange = (cat: CourseCategory | 'all') => {
    setSelectedCategory(cat);
    setSelectedSubject('all');
    setSelectedSemester('all');
  };

  // Level 3: Handle subject change -> Preserves Batch & Category, Resets Semester if no longer valid
  const handleSubjectChange = (subj: string) => {
    setSelectedSubject(subj);
    if (selectedSemester !== 'all') {
      const validSems = getAvailableSemesters(students, selectedBatch, selectedCategory, subj);
      if (!validSems.some(s => s.value === selectedSemester || s.code === normalizeSemester(selectedSemester))) {
        setSelectedSemester('all');
      }
    }
  };

  // Level 4: Handle semester change -> Preserves all previous selections
  const handleSemesterChange = (sem: string) => {
    setSelectedSemester(sem);
  };

  // Clear all filters completely
  const handleClearFilters = () => {
    setSelectedBatch('all');
    setSelectedCategory('all');
    setSelectedSubject('all');
    setSelectedSemester('all');
    setSelectedStatus('all');
    setSearchQuery('');
  };

  // Total students belonging to the currently selected batch scope
  const scopedBatchStudents = selectedBatch === 'all'
    ? students
    : students.filter(s => matchesBatch(s.batch, selectedBatch));

  // Filtered Students list using the unified central filtering engine
  const filteredStudents = getFilteredStudents(students, {
    category: selectedCategory,
    subject: selectedSubject,
    batch: selectedBatch,
    semester: selectedSemester,
    status: selectedStatus,
    searchQuery
  });

  // Students matching the academic filters alone (without text search query)
  const academicFilteredStudents = getFilteredStudents(students, {
    category: selectedCategory,
    subject: selectedSubject,
    batch: selectedBatch,
    semester: selectedSemester,
    status: selectedStatus
  });

  // Handle Excel / CSV File Selection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { headers, rawRows } = await parseStudentFile(file);
      setImportHeaders(headers);
      setImportRows(rawRows);

      const detected = autoDetectMapping(headers);
      setColumnMapping(detected);

      const result = mapRowsToStudents(headers, rawRows, detected, {
        defaultBatch: defaultImportBatch,
        defaultDepartment: defaultImportDepartment,
        defaultCourseType: defaultImportCourseType
      });
      setImportPreview(result.parsedStudents);
      setImportEnrolmentsPreview(result.parsedEnrolments || []);
      setDuplicates(result.duplicates);
      setMissingRollCount(result.missingRolls);
      setIsImportModalOpen(true);
    } catch (err: any) {
      alert('Error reading Excel/CSV file: ' + err.message);
    }
  };

  const updateImportPreview = (
    mapping: ColumnMapping, 
    defBatch: string, 
    defDept: string,
    defCourseType: string
  ) => {
    const result = mapRowsToStudents(importHeaders, importRows, mapping, {
      defaultBatch: defBatch,
      defaultDepartment: defDept,
      defaultCourseType: defCourseType
    });
    setImportPreview(result.parsedStudents);
    setImportEnrolmentsPreview(result.parsedEnrolments || []);
    setDuplicates(result.duplicates);
    setMissingRollCount(result.missingRolls);
  };

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    const newMapping = { ...columnMapping, [field]: value };
    setColumnMapping(newMapping);
    updateImportPreview(newMapping, defaultImportBatch, defaultImportDepartment, defaultImportCourseType);
  };

  const handleDefaultBatchChange = (batch: string) => {
    setDefaultImportBatch(batch);
    updateImportPreview(columnMapping, batch, defaultImportDepartment, defaultImportCourseType);
  };

  const handleDefaultDeptChange = (dept: string) => {
    setDefaultImportDepartment(dept);
    updateImportPreview(columnMapping, defaultImportBatch, dept, defaultImportCourseType);
  };

  const handleDefaultCourseTypeChange = (cType: string) => {
    setDefaultImportCourseType(cType);
    updateImportPreview(columnMapping, defaultImportBatch, defaultImportDepartment, cType);
  };

  const confirmImport = async () => {
    if (importPreview.length === 0) {
      alert('No valid student rows to import.');
      return;
    }

    try {
      let added = 0;
      let updated = 0;

      for (const st of importPreview) {
        let studentId: number | undefined;
        const existing = await db.students.where('rollNo').equals(st.rollNo).first();
        if (existing && existing.id) {
          await db.students.update(existing.id, {
            ...st,
            updatedAt: new Date().toISOString()
          });
          studentId = existing.id;
          updated++;
        } else {
          studentId = await db.students.add(st);
          added++;
        }

        // Save enrolments
        if (st.enrolments && st.enrolments.length > 0) {
          await db.enrolments.where('rollNo').equals(st.rollNo).delete();
          const toAdd = st.enrolments.map(e => ({
            ...e,
            studentId,
            rollNo: st.rollNo
          }));
          await db.enrolments.bulkAdd(toAdd);
        }
      }

      alert(`Import Successful! Processed ${added + updated} students (${added} added, ${updated} updated).`);
      setIsImportModalOpen(false);
      loadStudents();
    } catch (err: any) {
      alert('Failed to save students to database: ' + err.message);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.rollNo.trim() || !formData.name.trim()) {
      alert('Please fill in Roll Number and Student Name.');
      return;
    }

    try {
      const now = new Date().toISOString();
      let studentId: number;

      if (editingStudent && editingStudent.id) {
        await db.students.update(editingStudent.id, {
          ...formData,
          updatedAt: now
        });
        studentId = editingStudent.id;
      } else {
        const existing = await db.students.where('rollNo').equals(formData.rollNo.trim()).first();
        if (existing) {
          alert(`Roll number "${formData.rollNo}" already exists!`);
          return;
        }
        studentId = await db.students.add({
          ...formData,
          createdAt: now,
          updatedAt: now
        });
      }

      // Ensure at least a Major enrolment exists
      const existingEnrolments = await db.enrolments.where('rollNo').equals(formData.rollNo.trim()).toArray();
      if (existingEnrolments.length === 0) {
        await db.enrolments.add({
          studentId,
          rollNo: formData.rollNo.trim(),
          courseCategory: 'Major',
          specificCategory: 'Major (Core-I)',
          subject: formData.department,
          department: formData.department,
          semester: formData.semester,
          batch: formData.batch,
          academicSession: formData.batch,
          createdAt: now,
          updatedAt: now
        });
      }

      setIsAddModalOpen(false);
      setEditingStudent(null);
      resetForm();
      loadStudents();
    } catch (err: any) {
      alert('Error saving student: ' + err.message);
    }
  };

  const handleDeleteStudent = async (id?: number, rollNo?: string) => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this student record and their enrolments?')) {
      await db.students.delete(id);
      if (rollNo) {
        await db.enrolments.where('rollNo').equals(rollNo).delete();
      }
      loadStudents();
    }
  };

  const startEditStudent = (st: Student) => {
    setEditingStudent(st);
    setFormData({
      rollNo: st.rollNo,
      name: st.name,
      department: st.department,
      semester: st.semester,
      batch: st.batch,
      courseType: st.courseType || 'Major',
      subjectClass: st.subjectClass || st.department,
      status: st.status,
      universityRoll: st.universityRoll || '',
      gender: st.gender || 'Male',
      category: st.category || 'General',
      mobile: st.mobile || ''
    });
    setIsAddModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      rollNo: '',
      name: '',
      department: 'History',
      semester: '4th Semester',
      batch: '2024-27',
      courseType: 'Major',
      subjectClass: 'History',
      status: 'active',
      universityRoll: '',
      gender: 'Male',
      category: 'General',
      mobile: ''
    });
    setEditingStudent(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-odia font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                ଛାତ୍ରଛାତ୍ରୀ ଡାଟାବେସ୍
              </h1>
              <p className="font-heading font-semibold text-xs uppercase text-slate-500">
                Student Database & Multi-Batch Management (2024-27 • 2025-28 • 2026-29)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* File Upload Button */}
          <label className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs hover:shadow-md cursor-pointer active:scale-95 transition-all">
            <Upload className="w-4 h-4" />
            <span>Excel / CSV ଆମଦାନୀ (Import)</span>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </label>

          {/* Add Student Button */}
          <button
            onClick={() => { resetForm(); setIsAddModalOpen(true); }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs hover:shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ନୂଆ ଛାତ୍ର (Add Student)</span>
          </button>

          {/* Export to Excel */}
          <button
            onClick={() => exportStudentsToExcel(filteredStudents)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            title="Download Filtered Students in Excel"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Excel ରପ୍ତାନି</span>
          </button>

          {/* Download Template */}
          <button
            onClick={downloadStudentImportTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            title="Download Multi-Batch Sample Template (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-700" />
            <span>ଟେମ୍ପଲେଟ୍ (Template)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. BATCH QUICK-OVERVIEW TABS (2024-27, 2025-28, 2026-29) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* All Students Tab */}
        <button
          onClick={() => handleBatchChange('all')}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            selectedBatch === 'all'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-4 ring-blue-500/10'
              : 'bg-white text-slate-800 border-slate-200/90 hover:border-blue-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedBatch === 'all' ? 'text-blue-100' : 'text-slate-400'}`}>
              ସମସ୍ତ ଛାତ୍ର (All)
            </span>
            <Users className={`w-4 h-4 ${selectedBatch === 'all' ? 'text-white' : 'text-blue-600'}`} />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-heading mt-1">
            {students.length}
          </div>
          <div className={`text-[11px] font-medium truncate ${selectedBatch === 'all' ? 'text-blue-100' : 'text-slate-500'}`}>
            All Batches Combined
          </div>
        </button>

        {/* Batch 2024-27 */}
        <button
          onClick={() => handleBatchChange('2024-27')}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            selectedBatch === '2024-27'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-4 ring-blue-500/10'
              : 'bg-white text-slate-800 border-slate-200/90 hover:border-blue-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedBatch === '2024-27' ? 'text-blue-100' : 'text-slate-400'}`}>
              ବ୍ୟାଚ୍ 2024-27
            </span>
            <GraduationCap className={`w-4 h-4 ${selectedBatch === '2024-27' ? 'text-white' : 'text-emerald-600'}`} />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-heading mt-1">
            <span className={selectedBatch === '2024-27' ? 'text-white' : 'text-emerald-600'}>
              {students.filter(s => matchesBatch(s.batch, '2024-27')).length}
            </span>
          </div>
          <div className={`text-[11px] font-medium truncate ${selectedBatch === '2024-27' ? 'text-blue-100' : 'text-slate-500'}`}>
            3rd Year • Semester V
          </div>
        </button>

        {/* Batch 2025-28 */}
        <button
          onClick={() => handleBatchChange('2025-28')}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            selectedBatch === '2025-28'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-4 ring-blue-500/10'
              : 'bg-white text-slate-800 border-slate-200/90 hover:border-blue-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedBatch === '2025-28' ? 'text-blue-100' : 'text-slate-400'}`}>
              ବ୍ୟାଚ୍ 2025-28
            </span>
            <GraduationCap className={`w-4 h-4 ${selectedBatch === '2025-28' ? 'text-white' : 'text-blue-600'}`} />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-heading mt-1">
            <span className={selectedBatch === '2025-28' ? 'text-white' : 'text-blue-600'}>
              {students.filter(s => matchesBatch(s.batch, '2025-28')).length}
            </span>
          </div>
          <div className={`text-[11px] font-medium truncate ${selectedBatch === '2025-28' ? 'text-blue-100' : 'text-slate-500'}`}>
            2nd Year • Semester III
          </div>
        </button>

        {/* Batch 2026-29 */}
        <button
          onClick={() => handleBatchChange('2026-29')}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            selectedBatch === '2026-29'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-4 ring-blue-500/10'
              : 'bg-white text-slate-800 border-slate-200/90 hover:border-blue-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedBatch === '2026-29' ? 'text-blue-100' : 'text-slate-400'}`}>
              ବ୍ୟାଚ୍ 2026-29
            </span>
            <GraduationCap className={`w-4 h-4 ${selectedBatch === '2026-29' ? 'text-white' : 'text-purple-600'}`} />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-heading mt-1">
            <span className={selectedBatch === '2026-29' ? 'text-white' : 'text-purple-600'}>
              {students.filter(s => matchesBatch(s.batch, '2026-29')).length}
            </span>
          </div>
          <div className={`text-[11px] font-medium truncate ${selectedBatch === '2026-29' ? 'text-blue-100' : 'text-slate-500'}`}>
            1st Year • Semester I
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. NEP 2020 COURSE CATEGORY FILTER TABS WITH AUTHENTIC ENROLMENT COUNTS */}
      {/* ========================================================================= */}
      <div className="bg-white p-3.5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span className="font-odia font-bold text-xs text-slate-800">
              ପାଠ୍ୟକ୍ରମ ବର୍ଗ (NEP Course Category Enrolments):
            </span>
            {selectedBatch !== 'all' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                ବ୍ୟାଚ୍ {selectedBatch}
              </span>
            )}
          </div>
          <span className="hidden sm:inline text-[11px] text-slate-400 font-semibold">
            {selectedBatch === 'all' ? 'ପ୍ରଥମେ ବ୍ୟାଚ୍ ଚୟନ କରନ୍ତୁ (Select Batch First)' : 'Major • Minor • MDC • AEC • SEC • VAC'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* All Categories */}
          <button
            onClick={() => selectedBatch !== 'all' && handleCategoryChange('all')}
            disabled={selectedBatch === 'all'}
            title={selectedBatch === 'all' ? 'ପ୍ରଥମେ ବ୍ୟାଚ୍ ଚୟନ କରନ୍ତୁ (Select Batch First)' : 'ସମସ୍ତ ବର୍ଗ'}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedBatch === 'all'
                ? 'bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
                : selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs cursor-pointer'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer'
            }`}
          >
            <span>ସମସ୍ତ ବର୍ଗ (All)</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${selectedCategory === 'all' && selectedBatch !== 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {categoryCounts.all}
            </span>
          </button>

          {/* Major */}
          <button
            onClick={() => selectedBatch !== 'all' && handleCategoryChange('Major')}
            disabled={selectedBatch === 'all'}
            title={selectedBatch === 'all' ? 'ପ୍ରଥମେ ବ୍ୟାଚ୍ ଚୟନ କରନ୍ତୁ (Select Batch First)' : 'Major (Core-I)'}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedBatch === 'all'
                ? 'bg-blue-50/50 text-blue-300 border border-blue-100 opacity-60 cursor-not-allowed'
                : selectedCategory === 'Major'
                ? 'bg-blue-600 text-white shadow-xs cursor-pointer'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/60 cursor-pointer'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Major (Core-I)</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${selectedCategory === 'Major' ? 'bg-white/20 text-white' : 'bg-blue-200 text-blue-900'}`}>
              {categoryCounts.major}
            </span>
          </button>

          {/* Minor */}
          <button
            onClick={() => selectedBatch !== 'all' && handleCategoryChange('Minor')}
            disabled={selectedBatch === 'all'}
            title={selectedBatch === 'all' ? 'ପ୍ରଥମେ ବ୍ୟାଚ୍ ଚୟନ କରନ୍ତୁ (Select Batch First)' : 'Minor (Core-II / III)'}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedBatch === 'all'
                ? 'bg-indigo-50/50 text-indigo-300 border border-indigo-100 opacity-60 cursor-not-allowed'
                : selectedCategory === 'Minor'
                ? 'bg-indigo-600 text-white shadow-xs cursor-pointer'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/60 cursor-pointer'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Minor (Core-II / III)</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${selectedCategory === 'Minor' ? 'bg-white/20 text-white' : 'bg-indigo-200 text-indigo-900'}`}>
              {categoryCounts.minor}
            </span>
          </button>

          {/* MDC */}
          <button
            onClick={() => selectedBatch !== 'all' && handleCategoryChange('MDC')}
            disabled={selectedBatch === 'all'}
            title={selectedBatch === 'all' ? 'ପ୍ରଥମେ ବ୍ୟାଚ୍ ଚୟନ କରନ୍ତୁ (Select Batch First)' : 'MDC / MCB'}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedBatch === 'all'
                ? 'bg-rose-50/50 text-rose-300 border border-rose-100 opacity-60 cursor-not-allowed'
                : selectedCategory === 'MDC'
                ? 'bg-rose-600 text-white shadow-xs cursor-pointer'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/60 cursor-pointer'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>MDC / MCB</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${selectedCategory === 'MDC' ? 'bg-white/20 text-white' : 'bg-rose-200 text-rose-900'}`}>
              {categoryCounts.mdc}
            </span>
          </button>

          {/* AEC */}
          <button
            onClick={() => selectedBatch !== 'all' && handleCategoryChange('AEC')}
            disabled={selectedBatch === 'all'}
            title={selectedBatch === 'all' ? 'ପ୍ରଥମେ ବ୍ୟାଚ୍ ଚୟନ କରନ୍ତୁ (Select Batch First)' : 'AEC (Ability Enhancement)'}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedBatch === 'all'
                ? 'bg-emerald-50/50 text-emerald-300 border border-emerald-100 opacity-60 cursor-not-allowed'
                : selectedCategory === 'AEC'
                ? 'bg-emerald-600 text-white shadow-xs cursor-pointer'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 cursor-pointer'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>AEC (Ability Enh.)</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${selectedCategory === 'AEC' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900'}`}>
              {categoryCounts.aec}
            </span>
          </button>

          {/* SEC */}
          <button
            onClick={() => selectedBatch !== 'all' && handleCategoryChange('SEC')}
            disabled={selectedBatch === 'all'}
            title={selectedBatch === 'all' ? 'ପ୍ରଥମେ ବ୍ୟାଚ୍ ଚୟନ କରନ୍ତୁ (Select Batch First)' : 'SEC (Skill Enhancement)'}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedBatch === 'all'
                ? 'bg-amber-50/50 text-amber-300 border border-amber-100 opacity-60 cursor-not-allowed'
                : selectedCategory === 'SEC'
                ? 'bg-amber-600 text-white shadow-xs cursor-pointer'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60 cursor-pointer'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>SEC (Skill Enh.)</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${selectedCategory === 'SEC' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'}`}>
              {categoryCounts.sec}
            </span>
          </button>

          {/* VAC */}
          <button
            onClick={() => selectedBatch !== 'all' && handleCategoryChange('VAC')}
            disabled={selectedBatch === 'all'}
            title={selectedBatch === 'all' ? 'ପ୍ରଥମେ ବ୍ୟାଚ୍ ଚୟନ କରନ୍ତୁ (Select Batch First)' : 'VAC (Value Added Course)'}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedBatch === 'all'
                ? 'bg-purple-50/50 text-purple-300 border border-purple-100 opacity-60 cursor-not-allowed'
                : selectedCategory === 'VAC'
                ? 'bg-purple-600 text-white shadow-xs cursor-pointer'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200/60 cursor-pointer'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>VAC (Value Added)</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${selectedCategory === 'VAC' ? 'bg-white/20 text-white' : 'bg-purple-200 text-purple-900'}`}>
              {categoryCounts.vac}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SEQUENTIAL CASCADING FILTER BAR (STRICT ORDER: BATCH -> CATEGORY -> SUBJECT -> SEMESTER -> SEARCH) */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* LEVEL 1: BATCH FILTER */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              1. ବ୍ୟାଚ୍ (Batch) *
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => handleBatchChange(e.target.value)}
              className={`w-full px-3 py-2 text-xs font-bold rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                selectedBatch !== 'all'
                  ? 'border-blue-500 bg-blue-50/70 text-blue-900 shadow-xs ring-1 ring-blue-500/30'
                  : 'border-slate-200 bg-slate-50 text-slate-800'
              }`}
            >
              <option value="all">ସମସ୍ତ ବ୍ୟାଚ୍ (All Batches)</option>
              <option value="2024-27">2024-27 (3rd Yr • Sem V)</option>
              <option value="2025-28">2025-28 (2nd Yr • Sem III)</option>
              <option value="2026-29">2026-29 (1st Yr • Sem I)</option>
            </select>
          </div>

          {/* LEVEL 2: COURSE CATEGORY FILTER (Enabled only when Batch is selected) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              2. ପାଠ୍ୟକ୍ରମ ବର୍ଗ (Category)
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value as any)}
              disabled={selectedBatch === 'all'}
              className={`w-full px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                selectedBatch === 'all'
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-75'
                  : selectedCategory !== 'all'
                  ? 'border-blue-500 bg-blue-50/70 text-blue-900 shadow-xs ring-1 ring-blue-500/30'
                  : 'border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
              }`}
            >
              {selectedBatch === 'all' ? (
                <option value="all">ପ୍ରଥମେ ବ୍ୟାଚ୍ ଚୟନ କରନ୍ତୁ (Select Batch First)</option>
              ) : (
                <>
                  <option value="all">ସମସ୍ତ ବର୍ଗ (All Categories)</option>
                  <option value="Major">Major (Core-I) ({categoryCounts.major})</option>
                  <option value="Minor">Minor (Core-II / Core-III) ({categoryCounts.minor})</option>
                  <option value="MDC">MDC / MCB ({categoryCounts.mdc})</option>
                  <option value="AEC">AEC (Ability Enhancement) ({categoryCounts.aec})</option>
                  <option value="SEC">SEC (Skill Enhancement) ({categoryCounts.sec})</option>
                  <option value="VAC">VAC (Value Added Course) ({categoryCounts.vac})</option>
                </>
              )}
            </select>
          </div>

          {/* LEVEL 3: DYNAMIC SUBJECT FILTER (Enabled only when Batch & Category are selected) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              3. ବିଷୟ (Subject)
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              disabled={selectedBatch === 'all' || selectedCategory === 'all'}
              className={`w-full px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                selectedBatch === 'all' || selectedCategory === 'all'
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-75'
                  : selectedSubject !== 'all'
                  ? 'border-blue-500 bg-blue-50/70 text-blue-900 shadow-xs ring-1 ring-blue-500/30'
                  : 'border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
              }`}
            >
              {selectedBatch === 'all' ? (
                <option value="all">ପ୍ରଥମେ ବ୍ୟାଚ୍ ଚୟନ କରନ୍ତୁ (Select Batch First)</option>
              ) : selectedCategory === 'all' ? (
                <option value="all">ପ୍ରଥମେ ବର୍ଗ ଚୟନ କରନ୍ତୁ (Select Category First)</option>
              ) : (
                <>
                  <option value="all">
                    ସମସ୍ତ {selectedCategory} ବିଷୟ ({availableSubjectsWithCounts.length})
                  </option>
                  {availableSubjectsWithCounts.map(item => (
                    <option key={item.subject} value={item.subject}>
                      {item.subject} ({item.count} {item.count === 1 ? 'Student' : 'Students'})
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* LEVEL 4: SEMESTER FILTER (Enabled only when previous filters are selected) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              4. ସେମିଷ୍ଟାର୍ (Semester)
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => handleSemesterChange(e.target.value)}
              disabled={selectedBatch === 'all' || selectedCategory === 'all' || selectedSubject === 'all'}
              className={`w-full px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                selectedBatch === 'all' || selectedCategory === 'all' || selectedSubject === 'all'
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-75'
                  : selectedSemester !== 'all'
                  ? 'border-blue-500 bg-blue-50/70 text-blue-900 shadow-xs ring-1 ring-blue-500/30'
                  : 'border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
              }`}
            >
              {selectedBatch === 'all' ? (
                <option value="all">ପ୍ରଥମେ ବ୍ୟାଚ୍ ଚୟନ କରନ୍ତୁ (Select Batch First)</option>
              ) : selectedCategory === 'all' ? (
                <option value="all">ପ୍ରଥମେ ବର୍ଗ ଚୟନ କରନ୍ତୁ (Select Category First)</option>
              ) : selectedSubject === 'all' ? (
                <option value="all">ପ୍ରଥମେ ବିଷୟ ଚୟନ କରନ୍ତୁ (Select Subject First)</option>
              ) : (
                <>
                  <option value="all">ସମସ୍ତ ସେମିଷ୍ଟାର୍ (All Semesters)</option>
                  {availableSemesters.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.count} {opt.count === 1 ? 'Student' : 'Students'})
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* LEVEL 5: SEARCH INPUT (Filters within the currently filtered student list) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              5. ଖୋଜନ୍ତୁ (Search)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ରୋଲ୍ ନଂ / ନାମ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Filter Summary & Reset Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-2 border-t border-slate-100 text-slate-500">
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              ଦର୍ଶାଯାଉଛି: <b className="text-slate-900 font-extrabold text-sm">{filteredStudents.length}</b> / <span className="font-semibold text-slate-700">{scopedBatchStudents.length}</span> ଛାତ୍ରଛାତ୍ରୀ {selectedBatch !== 'all' ? `(ବ୍ୟାଚ୍ ${selectedBatch})` : '(ସମସ୍ତ ବ୍ୟାଚ୍)'}
            </span>

            {/* Active Cascade Trail */}
            {selectedBatch !== 'all' && (
              <div className="inline-flex flex-wrap items-center gap-1 ml-1 font-semibold text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-bold border border-purple-200">
                  {selectedBatch}
                </span>
                {selectedCategory !== 'all' && (
                  <>
                    <span className="text-slate-400 font-bold">→</span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-bold border border-blue-200">
                      {selectedCategory}
                    </span>
                  </>
                )}
                {selectedSubject !== 'all' && (
                  <>
                    <span className="text-slate-400 font-bold">→</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold border border-emerald-200">
                      {selectedSubject}
                    </span>
                  </>
                )}
                {selectedSemester !== 'all' && (
                  <>
                    <span className="text-slate-400 font-bold">→</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold border border-amber-200">
                      {selectedSemester}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {(selectedBatch !== 'all' || selectedCategory !== 'all' || selectedSubject !== 'all' || selectedSemester !== 'all' || selectedStatus !== 'all' || searchQuery) && (
            <button
              onClick={handleClearFilters}
              className="text-blue-600 font-bold hover:underline cursor-pointer text-xs shrink-0 self-start sm:self-auto"
            >
              ଫିଲ୍ଟର୍ ରିସେଟ୍ କରନ୍ତୁ (Clear Filters)
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. FILTER RESULT & HEADING DISPLAY (Strict Source-of-Truth Sync) */}
      {/* ========================================================================= */}
      <div className="bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-4 rounded-3xl shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-bold text-blue-200 tracking-wider uppercase font-mono">
                ନିର୍ବାଚିତ ଫିଲ୍ଟର୍ ବିବରଣୀ (Active Filter Criteria)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold font-odia">
              <span className="px-2.5 py-1 rounded-xl bg-white/10 text-white border border-white/15">
                ବ୍ୟାଚ୍ (Batch): <span className="text-amber-300 font-extrabold">{selectedBatch !== 'all' ? selectedBatch : 'ସମସ୍ତ (All Batches)'}</span>
              </span>
              <span className="text-white/40 font-bold">•</span>
              <span className="px-2.5 py-1 rounded-xl bg-white/10 text-white border border-white/15">
                ବର୍ଗ (Category): <span className="text-blue-300 font-extrabold">{
                  selectedCategory === 'all' 
                    ? 'ସମସ୍ତ ବର୍ଗ (All Categories)' 
                    : selectedCategory === 'Major' 
                    ? 'Major / Core-I' 
                    : selectedCategory === 'Minor' 
                    ? 'Minor / Core-II & III' 
                    : selectedCategory === 'MDC' 
                    ? 'MDC / MCB' 
                    : selectedCategory
                }</span>
              </span>
              <span className="text-white/40 font-bold">•</span>
              <span className="px-2.5 py-1 rounded-xl bg-white/10 text-white border border-white/15">
                ବିଷୟ (Subject): <span className="text-emerald-300 font-extrabold">{selectedSubject !== 'all' ? selectedSubject : 'ସମସ୍ତ ବିଷୟ (All Subjects)'}</span>
              </span>
              <span className="text-white/40 font-bold">•</span>
              <span className="px-2.5 py-1 rounded-xl bg-white/10 text-white border border-white/15">
                ସେମିଷ୍ଟାର୍ (Semester): <span className="text-purple-300 font-extrabold">{selectedSemester !== 'all' ? selectedSemester : 'ସମସ୍ତ ସେମିଷ୍ଟାର୍ (All Semesters)'}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto bg-white/10 backdrop-blur-xs px-4 py-3 rounded-2xl border border-white/20">
            <div className="p-2.5 rounded-xl bg-blue-500/30 text-blue-300">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">
                Total Students (ମୋଟ ଛାତ୍ରଛାତ୍ରୀ)
              </div>
              <div className="text-2xl sm:text-3xl font-black font-heading text-white">
                {filteredStudents.length}
                {searchQuery && (
                  <span className="text-xs font-normal text-blue-200 ml-1.5">
                    (of {academicFilteredStudents.length})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. STUDENTS DATA TABLE WITH COURSE ENROLMENTS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">SL</th>
                <th className="px-4 py-3.5">କଲେଜ ରୋଲ୍ ନଂ (Roll No)</th>
                <th className="px-4 py-3.5">ଛାତ୍ରଙ୍କ ନାମ (Student Name)</th>
                <th className="px-4 py-3.5">ପାଠ୍ୟକ୍ରମ ବର୍ଗ (Course Category)</th>
                <th className="px-4 py-3.5">ବିଷୟ (Subject)</th>
                <th className="px-4 py-3.5">ବ୍ୟାଚ୍ (Batch)</th>
                <th className="px-4 py-3.5">ସେମିଷ୍ଟାର (Semester)</th>
                <th className="px-4 py-3.5">ସ୍ଥିତି (Status)</th>
                <th className="px-4 py-3.5 text-right">କାର୍ଯ୍ୟ (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    {students.length === 0 ? (
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-600">କୌଣସି ଛାତ୍ର ରେକର୍ଡ ମିଳିଲା ନାହିଁ।</p>
                        <p className="text-xs text-slate-400">Please import an Excel or CSV file to add students.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="font-semibold text-slate-700 text-sm">ନିର୍ଦ୍ଦିଷ୍ଟ ଫିଲ୍ଟର୍ ସହିତ କୌଣସି ଛାତ୍ର ମିଳିଲା ନାହିଁ।</p>
                        <p className="text-xs text-slate-400">No students found matching the selected filters.</p>
                        <button
                          onClick={handleClearFilters}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all cursor-pointer mt-2"
                        >
                          ଫିଲ୍ଟର୍ ରିସେଟ୍ କରନ୍ତୁ (Reset Filters)
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => {
                  const enrs = st.enrolments || [];
                  const activeCategoryEnrolments = selectedCategory === 'all'
                    ? enrs
                    : enrs.filter(e => normalizeCourseCategory(e.courseCategory) === selectedCategory);

                  const subjectFilteredEnrolments = selectedSubject !== 'all'
                    ? activeCategoryEnrolments.filter(e => e.subject.toLowerCase() === selectedSubject.toLowerCase())
                    : activeCategoryEnrolments;

                  const displayEnrolments = selectedSemester !== 'all'
                    ? subjectFilteredEnrolments.filter(e => normalizeSemester(e.semester) === normalizeSemester(selectedSemester))
                    : subjectFilteredEnrolments;

                  const matchingEnrolment = displayEnrolments[0] || subjectFilteredEnrolments[0] || activeCategoryEnrolments[0];

                  const catDisplay = selectedCategory === 'all'
                    ? (matchingEnrolment?.specificCategory || (st.courseType ? String(st.courseType) : 'Major (Core-I)'))
                    : (selectedCategory === 'Major' 
                      ? 'Major (Core-I)' 
                      : selectedCategory === 'Minor' 
                      ? 'Minor (Core-II/III)' 
                      : selectedCategory);

                  const displaySemester = matchingEnrolment?.semester || st.semester;

                  return (
                    <tr key={st.id || st.rollNo} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-blue-900">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50/80 border border-blue-200/60 inline-block">
                            {st.rollNo}
                          </span>
                        </div>
                        {st.universityRoll && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Univ: {st.universityRoll}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 font-odia">
                        {st.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          selectedCategory === 'Major' || selectedCategory === 'all'
                            ? 'bg-blue-50 text-blue-800 border-blue-200/60'
                            : selectedCategory === 'Minor'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200/60'
                            : selectedCategory === 'MDC'
                            ? 'bg-rose-50 text-rose-800 border-rose-200/60'
                            : selectedCategory === 'AEC'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                            : selectedCategory === 'SEC'
                            ? 'bg-amber-50 text-amber-800 border-amber-200/60'
                            : 'bg-purple-50 text-purple-800 border-purple-200/60'
                        }`}>
                          {catDisplay}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {displayEnrolments.length > 0 ? (
                            displayEnrolments.map((enr, i) => (
                              <span
                                key={i}
                                className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${
                                  normalizeCourseCategory(enr.courseCategory) === 'Major'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200/60'
                                    : normalizeCourseCategory(enr.courseCategory) === 'Minor'
                                    ? 'bg-indigo-50 text-indigo-800 border-indigo-200/60'
                                    : normalizeCourseCategory(enr.courseCategory) === 'MDC'
                                    ? 'bg-rose-50 text-rose-800 border-rose-200/60'
                                    : normalizeCourseCategory(enr.courseCategory) === 'AEC'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                                    : normalizeCourseCategory(enr.courseCategory) === 'SEC'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200/60'
                                    : 'bg-purple-50 text-purple-800 border-purple-200/60'
                                }`}
                              >
                                {enr.subject}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-700 text-xs font-semibold">
                              {st.subjectClass || st.department}
                            </span>
                          )}

                          {enrs.length > displayEnrolments.length && (
                            <button
                              onClick={() => setViewingStudentEnrolments(st)}
                              className="px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold cursor-pointer transition-colors"
                              title="View all subjects enrolled by this student"
                            >
                              +{enrs.length - displayEnrolments.length} More
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          st.batch === '2024-27'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                            : st.batch === '2025-28'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200/60'
                            : 'bg-purple-50 text-purple-800 border border-purple-200/60'
                        }`}>
                          {st.batch}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 text-xs font-medium">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-semibold text-slate-800 border border-slate-200/60 inline-block">
                          {displaySemester}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          st.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {st.status === 'active' ? 'ସକ୍ରିୟ (Active)' : 'ନିଷ୍କ୍ରିୟ (Inactive)'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          onClick={() => setViewingStudentEnrolments(st)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="View Complete Academic Enrolments"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEditStudent(st)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Student Record"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(st.id, st.rollNo)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Student Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW COMPLETE ACADEMIC ENROLMENTS FOR A STUDENT */}
      {/* ========================================================================= */}
      {viewingStudentEnrolments && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-odia font-bold text-xl text-slate-900">
                  {viewingStudentEnrolments.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="font-mono font-bold text-blue-900">
                    Roll: {viewingStudentEnrolments.rollNo}
                  </span>
                  {viewingStudentEnrolments.universityRoll && (
                    <span className="font-mono">
                      Univ: {viewingStudentEnrolments.universityRoll}
                    </span>
                  )}
                  <span>•</span>
                  <span>Batch: <b className="text-slate-800">{viewingStudentEnrolments.batch}</b></span>
                  <span>•</span>
                  <span>Dept: <b className="text-slate-800">{viewingStudentEnrolments.department}</b></span>
                </div>
              </div>
              <button 
                onClick={() => setViewingStudentEnrolments(null)} 
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Academic Enrolments Grid */}
            <div className="space-y-3">
              <h4 className="font-odia font-bold text-sm text-slate-800 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>ପଞ୍ଜୀକୃତ ବିଷୟ ସୂଚୀ (Academic Course Enrolments):</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(viewingStudentEnrolments.enrolments || []).map((enr, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl border ${
                      enr.courseCategory === 'Major'
                        ? 'bg-blue-50/70 border-blue-200'
                        : enr.courseCategory === 'Minor'
                        ? 'bg-indigo-50/70 border-indigo-200'
                        : enr.courseCategory === 'MDC'
                        ? 'bg-rose-50/70 border-rose-200'
                        : enr.courseCategory === 'AEC'
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : enr.courseCategory === 'SEC'
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-purple-50/70 border-purple-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className={`px-2 py-0.5 rounded-full ${
                        enr.courseCategory === 'Major'
                          ? 'bg-blue-200 text-blue-900'
                          : enr.courseCategory === 'Minor'
                          ? 'bg-indigo-200 text-indigo-900'
                          : enr.courseCategory === 'MDC'
                          ? 'bg-rose-200 text-rose-900'
                          : enr.courseCategory === 'AEC'
                          ? 'bg-emerald-200 text-emerald-900'
                          : enr.courseCategory === 'SEC'
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-purple-200 text-purple-900'
                      }`}>
                        {enr.courseCategory}
                      </span>
                      <span className="text-slate-500 font-medium">
                        {enr.semester || viewingStudentEnrolments.semester}
                      </span>
                    </div>

                    <div className="font-bold text-slate-900 text-sm mt-1.5">
                      {enr.subject}
                    </div>

                    {enr.specificCategory && (
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {enr.specificCategory}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                ମୋଟ ବିଷୟ ପଞ୍ଜୀକରଣ: <b className="text-slate-900">{(viewingStudentEnrolments.enrolments || []).length} Courses</b>
              </span>
              <button
                onClick={() => setViewingStudentEnrolments(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                ବନ୍ଦ କରନ୍ତୁ (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT STUDENT */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-odia font-bold text-xl text-slate-900">
                {editingStudent ? 'ଛାତ୍ର ତଥ୍ୟ ସଂଶୋଧନ (Edit Student)' : 'ନୂଆ ଛାତ୍ର ପଞ୍ଜୀକରଣ (Add Student)'}
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  କଲେଜ ରୋଲ୍ ନମ୍ବର (College Roll Number)*
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BA24-001"
                  value={formData.rollNo}
                  onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  ଛାତ୍ରଙ୍କ ନାମ (Student Name)*
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ସୁଭାଶିଷ ମହାନ୍ତି (Subhasis Mohanty)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-odia font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Department Dropdown */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    ମୁଖ୍ୟ ବିଭାଗ (Major Department)
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-blue-500/20"
                  >
                    {allDepartments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Batch Dropdown */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    ବ୍ୟାଚ୍ (Batch)
                  </label>
                  <select
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="2024-27">2024-27 (3rd Year)</option>
                    <option value="2025-28">2025-28 (2nd Year)</option>
                    <option value="2026-29">2026-29 (1st Year)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Semester Dropdown */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    ସେମିଷ୍ଟାର (Semester)
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="3rd Semester">3rd Semester</option>
                    <option value="4th Semester">4th Semester</option>
                    <option value="5th Semester">5th Semester</option>
                    <option value="6th Semester">6th Semester</option>
                  </select>
                </div>

                {/* Status Dropdown */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    ସ୍ଥିତି (Status)
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="active">Active (ସକ୍ରିୟ)</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  ବାତିଲ୍ (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  ସେଭ୍ କରନ୍ତୁ (Save Student)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EXCEL / CSV IMPORT WITH NEP MULTI-ENROLMENT SUPPORT */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-odia font-bold text-xl text-slate-900">
                  Excel / CSV ଛାତ୍ର ତଥ୍ୟ ଆମଦାନୀ (Student & Course Enrolments Import)
                </h3>
                <p className="text-xs text-slate-500">
                  ସ୍ପ୍ରେଡ୍‌ସିଟ୍ ଶୀର୍ଷକଗୁଡ଼ିକ ଏବଂ NEP ବହୁ-ବିଷୟ ପଞ୍ଜୀକରଣ (Major, Minor, MDC, AEC, SEC, VAC) ଯାଞ୍ଚ କରନ୍ତୁ।
                </p>
              </div>
              <button 
                onClick={() => setIsImportModalOpen(false)} 
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Default Batch, Course Type & Department Assignment Strip */}
            <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs shrink-0">
              <div>
                <label className="block font-bold text-blue-950 uppercase text-[10px] mb-1">
                  ଡିଫଲ୍ଟ ବ୍ୟାଚ୍ (Default Batch)
                </label>
                <select
                  value={defaultImportBatch}
                  onChange={(e) => handleDefaultBatchChange(e.target.value)}
                  className="w-full p-2 rounded-xl border border-blue-300 bg-white font-bold text-blue-900 focus:outline-none"
                >
                  <option value="2024-27">ବ୍ୟାଚ୍ 2024-27 (3rd Year)</option>
                  <option value="2025-28">ବ୍ୟାଚ୍ 2025-28 (2nd Year)</option>
                  <option value="2026-29">ବ୍ୟାଚ୍ 2026-29 (1st Year)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-blue-950 uppercase text-[10px] mb-1">
                  ଡିଫଲ୍ଟ କୋର୍ସ (Default Course Type)
                </label>
                <select
                  value={defaultImportCourseType}
                  onChange={(e) => handleDefaultCourseTypeChange(e.target.value)}
                  className="w-full p-2 rounded-xl border border-blue-300 bg-white font-bold text-blue-900 focus:outline-none"
                >
                  <option value="Major">Major (ମୁଖ୍ୟ ବିଷୟ / Honours)</option>
                  <option value="Minor">Minor (ସହାୟକ ବିଷୟ / Elective)</option>
                  <option value="MDC">MDC / MCB</option>
                  <option value="AEC">AEC (Ability Enhancement)</option>
                  <option value="SEC">SEC (Skill Enhancement)</option>
                  <option value="VAC">VAC (Value Added Course)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-blue-950 uppercase text-[10px] mb-1">
                  ଡିଫଲ୍ଟ ବିଭାଗ (Default Department)
                </label>
                <select
                  value={defaultImportDepartment}
                  onChange={(e) => handleDefaultDeptChange(e.target.value)}
                  className="w-full p-2 rounded-xl border border-blue-300 bg-white font-bold text-blue-900 focus:outline-none"
                >
                  {allDepartments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Warning alerts if missing or duplicates */}
            {(duplicates.length > 0 || missingRollCount > 0) && (
              <div className="space-y-2 shrink-0">
                {duplicates.length > 0 && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      ଡୁପ୍ଲିକେଟ୍ ରୋଲ୍ ନମ୍ବର: {duplicates.slice(0, 5).join(', ')} (ସ୍ୱୟଂଚାଳିତ ଭାବେ ଅପଡେଟ୍ ହେବ)।
                    </span>
                  </div>
                )}
                {missingRollCount > 0 && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>
                      {missingRollCount} ଟି ଧାଡ଼ିରେ ରୋଲ୍ ନମ୍ବର ନାହିଁ ଏବଂ ତାହା ବାଦ୍ ଦିଆଯିବ।
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Column Mapping Selectors */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Roll No Column *</label>
                <select
                  value={columnMapping.rollNo}
                  onChange={(e) => handleMappingChange('rollNo', e.target.value)}
                  className="w-full p-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                >
                  <option value="">-- Auto / Header --</option>
                  {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Student Name *</label>
                <select
                  value={columnMapping.name}
                  onChange={(e) => handleMappingChange('name', e.target.value)}
                  className="w-full p-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                >
                  <option value="">-- Auto / Header --</option>
                  {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Batch Column</label>
                <select
                  value={columnMapping.batch}
                  onChange={(e) => handleMappingChange('batch', e.target.value)}
                  className="w-full p-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                >
                  <option value="">-- Use Default Batch ({defaultImportBatch}) --</option>
                  {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Major Dept Column</label>
                <select
                  value={columnMapping.department}
                  onChange={(e) => handleMappingChange('department', e.target.value)}
                  className="w-full p-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                >
                  <option value="">-- Use Default Dept ({defaultImportDepartment}) --</option>
                  {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            {/* Table Preview of Extracted Students */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2.5">SL</th>
                    <th className="px-3 py-2.5">Roll No</th>
                    <th className="px-3 py-2.5">Student Name</th>
                    <th className="px-3 py-2.5">Major Dept</th>
                    <th className="px-3 py-2.5">Batch</th>
                    <th className="px-3 py-2.5">Enrolments Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importPreview.slice(0, 100).map((st, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono font-bold text-blue-900">{st.rollNo}</td>
                      <td className="px-3 py-2 font-semibold font-odia">{st.name}</td>
                      <td className="px-3 py-2 text-slate-700 font-semibold">{st.department}</td>
                      <td className="px-3 py-2 font-bold text-blue-700">{st.batch}</td>
                      <td className="px-3 py-2 text-slate-600 font-mono">
                        {(st.enrolments || []).length} Courses
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom confirmation buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-600 font-bold">
                ସମୁଦାୟ ଆମଦାନୀ ହେବାକୁ ଥିବା ଛାତ୍ର: <span className="text-blue-700 text-sm">{importPreview.length}</span> ({importEnrolmentsPreview.length} Course Enrolments)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  ବାତିଲ୍ (Cancel)
                </button>
                <button
                  onClick={confirmImport}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  ଆମଦାନୀ ନିଶ୍ଚିତ କରନ୍ତୁ ({importPreview.length} Students)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
