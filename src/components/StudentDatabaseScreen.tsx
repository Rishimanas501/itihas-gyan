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
  CheckCircle2, 
  FileSpreadsheet, 
  X,
  Filter
} from 'lucide-react';
import { db } from '../db';
import type { Student } from '../types';
import { 
  parseStudentFile, 
  autoDetectMapping, 
  mapRowsToStudents, 
  exportStudentsToExcel, 
  exportStudentsToCSV, 
  downloadStudentImportTemplate,
  type ColumnMapping 
} from '../services/excelService';

interface StudentDatabaseScreenProps {
  onBack: () => void;
}

export const StudentDatabaseScreen: React.FC<StudentDatabaseScreenProps> = ({ onBack }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Import flow states
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    rollNo: '',
    name: '',
    department: '',
    semester: '',
    batch: '',
    subjectClass: '',
    status: ''
  });
  const [importPreview, setImportPreview] = useState<Omit<Student, 'id'>[]>([]);
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const [missingRollCount, setMissingRollCount] = useState(0);

  // New Student Form
  const [formData, setFormData] = useState({
    rollNo: '',
    name: '',
    department: 'History',
    semester: '4th Semester',
    batch: '2024-27',
    subjectClass: 'Core Paper VII: History of Odisha',
    status: 'active' as 'active' | 'inactive'
  });

  const loadStudents = async () => {
    const list = await db.students.toArray();
    setStudents(list);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { headers, rawRows } = await parseStudentFile(file);
      setImportHeaders(headers);
      setImportRows(rawRows);

      const detected = autoDetectMapping(headers);
      setColumnMapping(detected);

      const result = mapRowsToStudents(headers, rawRows, detected);
      setImportPreview(result.parsedStudents);
      setDuplicates(result.duplicates);
      setMissingRollCount(result.missingRolls);
      setIsImportModalOpen(true);
    } catch (err: any) {
      alert('Error reading Excel/CSV file: ' + err.message);
    }
  };

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    const newMapping = { ...columnMapping, [field]: value };
    setColumnMapping(newMapping);
    const result = mapRowsToStudents(importHeaders, importRows, newMapping);
    setImportPreview(result.parsedStudents);
    setDuplicates(result.duplicates);
    setMissingRollCount(result.missingRolls);
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
        const existing = await db.students.where('rollNo').equals(st.rollNo).first();
        if (existing && existing.id) {
          await db.students.update(existing.id, {
            ...st,
            updatedAt: new Date().toISOString()
          });
          updated++;
        } else {
          await db.students.add(st);
          added++;
        }
      }

      alert(`Import Successful! Added ${added} new students, updated ${updated} existing records.`);
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
      if (editingStudent && editingStudent.id) {
        await db.students.update(editingStudent.id, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        const existing = await db.students.where('rollNo').equals(formData.rollNo.trim()).first();
        if (existing) {
          alert(`Roll number "${formData.rollNo}" already exists!`);
          return;
        }
        await db.students.add({
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
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

  const handleDeleteStudent = async (id?: number) => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this student record?')) {
      await db.students.delete(id);
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
      subjectClass: st.subjectClass,
      status: st.status
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
      subjectClass: 'Core Paper VII: History of Odisha',
      status: 'active'
    });
    setEditingStudent(null);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSemester = selectedSemester === 'all' || s.semester === selectedSemester;
    return matchesSearch && matchesSemester;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-odia font-black text-2xl text-slate-900">
                ୪. ଛାତ୍ରଛାତ୍ରୀ ଡାଟାବେସ୍
              </h2>
              <p className="font-heading font-semibold text-xs uppercase text-slate-500">
                Student Database & Excel Import / Export
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* File Upload Button */}
          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all">
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>ନୂଆ ଛାତ୍ର (Add Student)</span>
          </button>

          {/* Export to Excel */}
          <button
            onClick={() => exportStudentsToExcel(students)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold shadow-xs active:scale-95 transition-all"
            title="Excel ଡାଉନଲୋଡ୍"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Excel ରପ୍ତାନି</span>
          </button>

          {/* Download Template */}
          <button
            onClick={downloadStudentImportTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold shadow-xs active:scale-95 transition-all"
            title="Download Sample Format"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-700" />
            <span>ଟେମ୍ପଲେଟ୍</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ରୋଲ୍ ନମ୍ବର କିମ୍ବା ନାମ ସର୍ଚ୍ଚ କରନ୍ତୁ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">ସମସ୍ତ ସେମିଷ୍ଟାର୍ (All Semesters)</option>
            <option value="1st Semester">1st Semester</option>
            <option value="2nd Semester">2nd Semester</option>
            <option value="3rd Semester">3rd Semester</option>
            <option value="4th Semester">4th Semester</option>
            <option value="5th Semester">5th Semester</option>
            <option value="6th Semester">6th Semester</option>
          </select>
          <span className="text-xs text-slate-500 font-bold ml-2">
            ମୋଟ: {filteredStudents.length}
          </span>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">SL</th>
                <th className="px-4 py-3.5">କଲେଜ ରୋଲ୍ ନଂ (Roll No)</th>
                <th className="px-4 py-3.5">ଛାତ୍ରଙ୍କ ନାମ (Student Name)</th>
                <th className="px-4 py-3.5">ବିଭାଗ / ସେମିଷ୍ଟାର</th>
                <th className="px-4 py-3.5">ବ୍ୟାଚ୍ (Batch)</th>
                <th className="px-4 py-3.5">ସ୍ଥିତି (Status)</th>
                <th className="px-4 py-3.5 text-right">କାର୍ଯ୍ୟ (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    କୌଣସି ଛାତ୍ର ରେକର୍ଡ ମିଳିଲା ନାହିଁ। Excel ଫାଇଲ୍ Import କରନ୍ତୁ କିମ୍ବା ନୂଆ ଛାତ୍ର ଯୋଗ କରନ୍ତୁ।
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => (
                  <tr key={st.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-900 bg-blue-50/40 rounded-lg">
                      {st.rollNo}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {st.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="font-medium text-slate-800">{st.department}</span>
                      <span className="text-xs text-slate-400 block">{st.semester}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {st.batch}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                        st.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {st.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => startEditStudent(st)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        title="Edit Student"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(st.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Add / Edit Student Form */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-odia font-bold text-xl text-slate-900">
                {editingStudent ? 'ଛାତ୍ର ତଥ୍ୟ ସଂଶୋଧନ (Edit Student)' : 'ନୂଆ ଛାତ୍ର ପଞ୍ଜୀକରଣ (Add Student)'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  କଲେଜ ରୋଲ୍ ନମ୍ବର (College Roll Number)*
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BA24-001"
                  value={formData.rollNo}
                  onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  ଛାତ୍ରଙ୍କ ନାମ (Student Name)*
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ସୁଭାଶିଷ ମହାନ୍ତି (Subhasis Mohanty)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    ବିଭାଗ (Department)
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    ସେମିଷ୍ଟାର (Semester)
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="3rd Semester">3rd Semester</option>
                    <option value="4th Semester">4th Semester</option>
                    <option value="5th Semester">5th Semester</option>
                    <option value="6th Semester">6th Semester</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    ବ୍ୟାଚ୍ (Batch / Session)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2024-27"
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    ସ୍ଥିତି (Status)
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100"
                >
                  ବାତିଲ୍ (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                >
                  ସେଭ୍ କରନ୍ତୁ (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Excel / CSV Import & Column Mapping Preview */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-odia font-bold text-xl text-slate-900">
                  Excel / CSV ସ୍ତମ୍ଭ ମ୍ୟାପିଂ ଓ ପୂର୍ବାବଲୋକନ (Import Preview)
                </h3>
                <p className="text-xs text-slate-500">
                  ସ୍ପ୍ରେଡ୍‌ସିଟ୍ ଶୀର୍ଷକଗୁଡ଼ିକୁ ଡାଟାବେସ୍ କ୍ଷେତ୍ର ସହିତ ଯାଞ୍ଚ କରନ୍ତୁ।
                </p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning alerts if missing or duplicates */}
            <div className="space-y-2">
              {duplicates.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    ଡୁପ୍ଲିକେଟ୍ ରୋଲ୍ ନମ୍ବର ମିଳିଲା: {duplicates.slice(0, 5).join(', ')} {duplicates.length > 5 && `+${duplicates.length - 5} ଅଧିକ`} (ଏହା ସ୍ୱୟଂଚାଳିତ ଭାବେ ଅପଡେଟ୍ ହେବ)।
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

            {/* Column Mapping Selectors */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Roll No *</label>
                <select
                  value={columnMapping.rollNo}
                  onChange={(e) => handleMappingChange('rollNo', e.target.value)}
                  className="w-full p-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">-- Select Header --</option>
                  {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Student Name *</label>
                <select
                  value={columnMapping.name}
                  onChange={(e) => handleMappingChange('name', e.target.value)}
                  className="w-full p-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">-- Select Header --</option>
                  {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Department</label>
                <select
                  value={columnMapping.department}
                  onChange={(e) => handleMappingChange('department', e.target.value)}
                  className="w-full p-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">-- Select Header --</option>
                  {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Semester</label>
                <select
                  value={columnMapping.semester}
                  onChange={(e) => handleMappingChange('semester', e.target.value)}
                  className="w-full p-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">-- Select Header --</option>
                  {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            {/* Table Preview of Extracted Students */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2">SL</th>
                    <th className="px-3 py-2">Roll No</th>
                    <th className="px-3 py-2">Student Name</th>
                    <th className="px-3 py-2">Department</th>
                    <th className="px-3 py-2">Semester</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importPreview.slice(0, 100).map((st, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono font-bold text-blue-900">{st.rollNo}</td>
                      <td className="px-3 py-2 font-medium">{st.name}</td>
                      <td className="px-3 py-2 text-slate-600">{st.department}</td>
                      <td className="px-3 py-2 text-slate-600">{st.semester}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom confirmation buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-bold">
                ସମୁଦାୟ ଆମଦାନୀ ହେବାକୁ ଥିବା ଛାତ୍ର: {importPreview.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100"
                >
                  ବାତିଲ୍ (Cancel)
                </button>
                <button
                  onClick={confirmImport}
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
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
