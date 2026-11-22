import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Download, 
  Play, 
  Trash2, 
  Edit3, 
  Plus, 
  CheckCircle2, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import { db } from '../db';
import type { Question, QuestionPattern } from '../types';
import { exportQuestionsToExcel } from '../services/excelService';

interface QuestionBankScreenProps {
  onBack: () => void;
  onStartQuizWithQuestions: (questions: Question[]) => void;
  onNavigateToAi: () => void;
}

export const QuestionBankScreen: React.FC<QuestionBankScreenProps> = ({
  onBack,
  onStartQuizWithQuestions,
  onNavigateToAi
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedPattern, setSelectedPattern] = useState('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Manual Add / Edit Question modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Question>>({
    question: '',
    pattern: 'mcq',
    marks: 1,
    options: ['', '', '', ''],
    correctAnswer: '',
    explanationCorrect: '',
    subject: 'History of Odisha',
    department: 'History',
    semester: '4th Semester',
    paper: 'Core Paper VII',
    topic: 'Ancient Odisha',
    language: 'bilingual',
    approved: true
  });

  const loadQuestions = async () => {
    const list = await db.questions.toArray();
    setQuestions(list);
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSem = selectedSemester === 'all' || q.semester === selectedSemester;
    const matchesPat = selectedPattern === 'all' || q.pattern === selectedPattern;
    return matchesSearch && matchesSem && matchesPat;
  });

  const toggleSelect = (id?: number) => {
    if (!id) return;
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAllFiltered = () => {
    const ids = filteredQuestions.map(q => q.id!).filter(Boolean);
    setSelectedIds(ids);
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this question?')) {
      await db.questions.delete(id);
      loadQuestions();
      setSelectedIds(selectedIds.filter(i => i !== id));
    }
  };

  const handleStartQuiz = () => {
    const toPlay = questions.filter(q => selectedIds.includes(q.id!));
    if (toPlay.length === 0) {
      alert('Please select at least 1 question to start a live quiz session.');
      return;
    }
    onStartQuizWithQuestions(toPlay);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question?.trim() || !formData.correctAnswer?.trim()) {
      alert('Please provide question text and correct answer.');
      return;
    }

    try {
      const now = new Date().toISOString();
      if (editingId) {
        await db.questions.update(editingId, {
          ...formData,
          updatedAt: now
        });
      } else {
        await db.questions.add({
          ...formData,
          approved: true,
          createdAt: now,
          updatedAt: now
        } as Question);
      }

      setIsModalOpen(false);
      setEditingId(null);
      loadQuestions();
    } catch (err: any) {
      alert('Error saving question: ' + err.message);
    }
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id || null);
    setFormData({ ...q });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      question: '',
      pattern: 'mcq',
      marks: 1,
      options: ['', '', '', ''],
      correctAnswer: '',
      explanationCorrect: '',
      subject: 'History of Odisha',
      department: 'History',
      semester: '4th Semester',
      paper: 'Core Paper VII',
      topic: 'Ancient Odisha',
      language: 'bilingual',
      approved: true
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-odia font-black text-2xl text-slate-900">
              ୩. ସ୍ଥାୟୀ ପ୍ରଶ୍ନ ବ୍ୟାଙ୍କ
            </h2>
            <p className="font-heading font-semibold text-xs uppercase text-slate-500">
              Permanent Question Bank & Live Quiz Launcher
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onNavigateToAi}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>AI ସାହାଯ୍ୟରେ ନୂଆ ପ୍ରଶ୍ନ</span>
          </button>

          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>ମାନୁଆଲ୍ ପ୍ରଶ୍ନ ଯୋଗ</span>
          </button>

          <button
            onClick={() => exportQuestionsToExcel(questions)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold shadow-xs active:scale-95 transition-all"
            title="Export Question Bank to Excel"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Excel ରପ୍ତାନି</span>
          </button>
        </div>
      </div>

      {/* Floating Action Bar when questions are selected */}
      {selectedIds.length > 0 && (
        <div className="sticky top-2 z-30 bg-emerald-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 border border-emerald-700 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs">
              {selectedIds.length}
            </span>
            <span className="text-xs sm:text-sm font-bold text-emerald-100">
              ପ୍ରଶ୍ନ ଚୟନ କରାଯାଇଛି (Questions Selected)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={deselectAll}
              className="px-3 py-1 rounded-lg bg-emerald-800 text-emerald-200 hover:bg-emerald-700 text-xs font-semibold"
            >
              ଚୟନ ବାତିଲ୍
            </button>
            <button
              onClick={handleStartQuiz}
              className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>ଏହି ପ୍ରଶ୍ନ ସହ ଲାଇଭ୍ କୁଇଜ୍ ଆରମ୍ଭ କରନ୍ତୁ</span>
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ପ୍ରଶ୍ନ କିମ୍ବା ଟପିକ୍ ସର୍ଚ୍ଚ କରନ୍ତୁ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 bg-slate-50"
          >
            <option value="all">ସମସ୍ତ ସେମିଷ୍ଟାର୍ (All)</option>
            <option value="1st Semester">1st Semester</option>
            <option value="2nd Semester">2nd Semester</option>
            <option value="3rd Semester">3rd Semester</option>
            <option value="4th Semester">4th Semester</option>
            <option value="5th Semester">5th Semester</option>
            <option value="6th Semester">6th Semester</option>
          </select>

          <select
            value={selectedPattern}
            onChange={(e) => setSelectedPattern(e.target.value)}
            className="text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 bg-slate-50"
          >
            <option value="all">ସମସ୍ତ ପ୍ରକାର (All Patterns)</option>
            <option value="mcq">MCQ (ବହୁବିକଳ୍ପ)</option>
            <option value="blanks">ଶୂନ୍ୟସ୍ଥାନ (Fill Blanks)</option>
            <option value="true_false">ସତ୍ୟ/ମିଥ୍ୟା (True/False)</option>
            <option value="one_word">ଗୋଟିଏ ଶବ୍ଦ (One Word)</option>
            <option value="short">ସଂକ୍ଷିପ୍ତ (2 Marks)</option>
            <option value="long">ଦୀର୍ଘ (5/8 Marks)</option>
          </select>

          <button
            onClick={selectAllFiltered}
            className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition-colors"
          >
            ସବୁ ଚୟନ
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 text-slate-400">
            କୌଣସି ପ୍ରଶ୍ନ ମିଳିଲା ନାହିଁ। AI ଦ୍ୱାରା ପ୍ରଶ୍ନ ତିଆରି କରନ୍ତୁ କିମ୍ବା ମାନୁଆଲ୍ ଭାବେ ଯୋଗ କରନ୍ତୁ।
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const isSelected = selectedIds.includes(q.id!);
            return (
              <div
                key={q.id || idx}
                onClick={() => toggleSelect(q.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-emerald-50/60 border-emerald-500 shadow-sm ring-1 ring-emerald-500/30' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent div onClick
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-bold text-xs uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {q.pattern.toUpperCase()} • {q.marks} Mark{q.marks > 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                      {q.subject} • {q.topic}
                    </span>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => startEdit(q)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-slate-100"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h4 className="font-odia font-bold text-base sm:text-lg text-slate-900 mt-2.5 leading-snug">
                  {q.question}
                </h4>

                {/* Options if MCQ */}
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {q.options.map((opt, optIdx) => (
                      <div
                        key={optIdx}
                        className={`p-2 rounded-xl text-xs border ${
                          opt === q.correctAnswer
                            ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="font-bold mr-1.5">{String.fromCharCode(65 + optIdx)}.</span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Correct Answer & Explanation */}
                <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                  <div>
                    <span className="font-bold text-emerald-800">ସଠିକ୍ ଉତ୍ତର: </span>
                    <span className="font-medium text-slate-800">{q.correctAnswer}</span>
                  </div>
                  <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                    {q.semester}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-odia font-bold text-xl text-slate-900">
                {editingId ? 'ପ୍ରଶ୍ନ ସଂଶୋଧନ (Edit Question)' : 'ନୂଆ ପ୍ରଶ୍ନ ଯୋଗ (Add Question)'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  ପ୍ରଶ୍ନ (Question Text)*
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                  placeholder="ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    ପ୍ରକାର (Pattern)
                  </label>
                  <select
                    value={formData.pattern}
                    onChange={(e) => setFormData({ ...formData, pattern: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="mcq">MCQ (1 Mark)</option>
                    <option value="blanks">Fill in Blanks (1 Mark)</option>
                    <option value="true_false">True / False (1 Mark)</option>
                    <option value="one_word">One Word (1 Mark)</option>
                    <option value="short">Short Answer (2 Marks)</option>
                    <option value="long">Long Answer (5/8 Marks)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    ମାର୍କ (Marks)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  ସଠିକ୍ ଉତ୍ତର (Correct Answer)*
                </label>
                <input
                  type="text"
                  required
                  value={formData.correctAnswer}
                  onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  placeholder="ସଠିକ୍ ଉତ୍ତର ଲେଖନ୍ତୁ..."
                />
              </div>

              {formData.pattern === 'mcq' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    ୪ଟି ବିକଳ୍ପ (4 Options)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map(i => (
                      <input
                        key={i}
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        value={formData.options?.[i] || ''}
                        onChange={(e) => {
                          const opts = [...(formData.options || ['', '', '', ''])];
                          opts[i] = e.target.value;
                          setFormData({ ...formData, options: opts });
                        }}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  ସଠିକ୍ ଉତ୍ତରର ବିସ୍ତୃତ ବ୍ୟାଖ୍ୟା (Explanation)
                </label>
                <textarea
                  rows={2}
                  value={formData.explanationCorrect}
                  onChange={(e) => setFormData({ ...formData, explanationCorrect: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                >
                  ବାତିଲ୍
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                >
                  ସେଭ୍ କରନ୍ତୁ (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
