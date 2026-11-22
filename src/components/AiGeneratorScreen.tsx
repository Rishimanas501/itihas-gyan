import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  Trash2, 
  Edit3, 
  RotateCw, 
  Save, 
  BookOpen, 
  AlertCircle, 
  HelpCircle, 
  CheckCircle2, 
  X,
  FileText
} from 'lucide-react';
import { db } from '../db';
import type { Question, QuestionPattern, QuestionLanguage } from '../types';
import { generateQuestionsFromSource } from '../services/aiGenerator';

interface AiGeneratorScreenProps {
  onBack: () => void;
  geminiApiKey?: string;
  onNavigateToBank: () => void;
}

export const AiGeneratorScreen: React.FC<AiGeneratorScreenProps> = ({
  onBack,
  geminiApiKey,
  onNavigateToBank
}) => {
  // Input parameters
  const [sourceText, setSourceText] = useState(
    `ପ୍ରାଚୀନ କଳିଙ୍ଗର ଇତିହାସରେ ସମ୍ରାଟ ଖାରବେଳ ଏବଂ କଳିଙ୍ଗ ଯୁଦ୍ଧ ସର୍ବାଧିକ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ଅଧ୍ୟାୟ। ଖ୍ରୀଷ୍ଟପୂର୍ବ ୨୬୧ ରେ ମଗଧର ସମ୍ରାଟ ଅଶୋକ କଳିଙ୍ଗ ଆକ୍ରମଣ କରିଥିଲେ। ଦୟା ନଦୀ କୂଳରେ ଅନୁଷ୍ଠିତ ଏହି ଭୟଙ୍କର ଯୁଦ୍ଧରେ ଲକ୍ଷାଧିକ ଲୋକ ନିହତ ହୋଇଥିଲେ ଏବଂ ଅଶୋକଙ୍କ ହୃଦୟ ପରିବର୍ତ୍ତିତ ହୋଇ ସେ ଚଣ୍ଡାଶୋକରୁ ଧର୍ମାଶୋକରେ ପରିଣତ ହୋଇଥିଲେ। ପରବର୍ତ୍ତୀ କାଳରେ ମହାମେଘବାହନ ଖାରବେଳ କଳିଙ୍ଗର ଗୌରବ ପୁନଃପ୍ରତିଷ୍ଠା କରିଥିଲେ। ତାଙ୍କ ହାତୀଗୁମ୍ଫା ଶିଳାଲେଖରେ ତାଙ୍କ ୧୩ ବର୍ଷର କୀର୍ତ୍ତି କାହାଣୀ ପ୍ରାକୃତ ଭାଷା ଓ ବ୍ରାହ୍ମୀ ଲିପିରେ ଖୋଦିତ ହୋଇଛି।`
  );
  const [subject, setSubject] = useState('History of Odisha');
  const [department, setDepartment] = useState('History');
  const [semester, setSemester] = useState('4th Semester');
  const [paper, setPaper] = useState('Core Paper VII');
  const [topic, setTopic] = useState('Kalinga War & Kharavela');
  const [language, setLanguage] = useState<QuestionLanguage>('bilingual');
  const [selectedPatterns, setSelectedPatterns] = useState<QuestionPattern[]>([
    'mcq', 'blanks', 'true_false', 'one_word', 'short'
  ]);
  const [questionCount, setQuestionCount] = useState(5);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<{ index: number; q: Question } | null>(null);

  const togglePattern = (pattern: QuestionPattern) => {
    if (selectedPatterns.includes(pattern)) {
      if (selectedPatterns.length > 1) {
        setSelectedPatterns(selectedPatterns.filter(p => p !== pattern));
      }
    } else {
      setSelectedPatterns([...selectedPatterns, pattern]);
    }
  };

  const handleGenerate = async () => {
    if (!sourceText.trim()) {
      alert('Please enter or paste source historical text, notes or questions.');
      return;
    }

    setIsGenerating(true);
    try {
      const results = await generateQuestionsFromSource({
        text: sourceText,
        subject,
        department,
        semester,
        paper,
        topic,
        language,
        patterns: selectedPatterns,
        targetCount: questionCount,
        apiKey: geminiApiKey
      });

      setGeneratedQuestions(results);
      setSelectedIndices(results.map((_, i) => i)); // select all by default
    } catch (err: any) {
      alert('Error generating questions: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSelectIndex = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const selectAll = () => {
    setSelectedIndices(generatedQuestions.map((_, i) => i));
  };

  const deselectAll = () => {
    setSelectedIndices([]);
  };

  const handleDelete = (index: number) => {
    const updated = generatedQuestions.filter((_, i) => i !== index);
    setGeneratedQuestions(updated);
    setSelectedIndices(selectedIndices.filter(i => i !== index).map(i => (i > index ? i - 1 : i)));
  };

  const handleSaveToBank = async (indicesToSave: number[]) => {
    if (indicesToSave.length === 0) {
      alert('Please select at least one question to approve and save.');
      return;
    }

    try {
      let savedCount = 0;
      let duplicateCount = 0;

      for (const idx of indicesToSave) {
        const q = generatedQuestions[idx];
        const existing = await db.questions.where('question').equals(q.question).first();
        if (existing) {
          duplicateCount++;
          continue;
        }

        await db.questions.add({
          ...q,
          approved: true,
          updatedAt: new Date().toISOString()
        });
        savedCount++;
      }

      alert(`Success! Approved and saved ${savedCount} question(s) to permanent Question Bank.${duplicateCount > 0 ? ` (${duplicateCount} duplicate questions skipped)` : ''}`);
      onNavigateToBank();
    } catch (err: any) {
      alert('Failed to save to Question Bank: ' + err.message);
    }
  };

  const handleUpdateEditingQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    const updated = [...generatedQuestions];
    updated[editingQuestion.index] = editingQuestion.q;
    setGeneratedQuestions(updated);
    setEditingQuestion(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-odia font-black text-2xl text-slate-900">
              ୨. AI ସାହାଯ୍ୟରେ ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତି
            </h2>
            <p className="font-heading font-semibold text-xs uppercase text-slate-500">
              AI Question Generator & Approval Workflow
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToBank}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold shadow-xs active:scale-95 transition-all"
        >
          <BookOpen className="w-4 h-4 text-emerald-700" />
          <span>ପ୍ରଶ୍ନ ବ୍ୟାଙ୍କ୍ (Question Bank)</span>
        </button>
      </div>

      {/* Generation Parameters Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
            <span>ମୂଳ ପାଠ୍ୟ, ନୋଟ୍ସ କିମ୍ବା ଉତ୍ତର (Source Content / Notes / Paragraph)*</span>
            <span className="text-[11px] text-emerald-700 lowercase font-medium">
              Odia / English supported
            </span>
          </label>
          <textarea
            rows={5}
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="ପାଠ୍ୟ ପୁସ୍ତକର ଅଧ୍ୟାୟ, ବିଷୟବସ୍ତୁ, ଐତିହାସିକ ଘଟଣାବଳୀ ବା ପ୍ରଶ୍ନୋତ୍ତର ଏଠାରେ ପେଷ୍ଟ କରନ୍ତୁ..."
            className="w-full p-4 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 leading-relaxed font-sans"
          />
        </div>

        {/* Filters and Meta Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">ବିଷୟ (Subject)</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">ସେମିଷ୍ଟାର (Semester)</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium"
            >
              <option value="1st Semester">1st Semester</option>
              <option value="2nd Semester">2nd Semester</option>
              <option value="3rd Semester">3rd Semester</option>
              <option value="4th Semester">4th Semester</option>
              <option value="5th Semester">5th Semester</option>
              <option value="6th Semester">6th Semester</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">ପ୍ରସଙ୍ଗ (Topic)</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">ଭାଷା (Language)</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium"
            >
              <option value="bilingual">Odia & English (ଦ୍ୱିଭାଷୀ)</option>
              <option value="odia">Odia Only (କେବଳ ଓଡ଼ିଆ)</option>
              <option value="english">English Only (English)</option>
            </select>
          </div>
        </div>

        {/* Question Patterns Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-2">
            ପ୍ରଶ୍ନ ପ୍ରକାର ଚୟନ କରନ୍ତୁ (Question Patterns):
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'mcq', label: 'ବହୁବିକଳ୍ପ (MCQ - 1 Mark)', marks: 1 },
              { id: 'blanks', label: 'ଶୂନ୍ୟସ୍ଥାନ (Fill Blanks - 1 Mark)', marks: 1 },
              { id: 'true_false', label: 'ସତ୍ୟ/ମିଥ୍ୟା (True/False - 1 Mark)', marks: 1 },
              { id: 'one_word', label: 'ଗୋଟିଏ ଶବ୍ଦ (One Word - 1 Mark)', marks: 1 },
              { id: 'short', label: 'ସଂକ୍ଷିପ୍ତ ଉତ୍ତର (Short Answer - 2 Marks)', marks: 2 },
              { id: 'long', label: 'ଦୀର୍ଘ ଉତ୍ତର (Long Answer - 5/8 Marks)', marks: 5 }
            ].map(p => {
              const active = selectedPatterns.includes(p.id as QuestionPattern);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePattern(p.id as QuestionPattern)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                    active 
                      ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {geminiApiKey ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Gemini API ସଂଯୁକ୍ତ (Connected)
              </span>
            ) : (
              <span className="text-amber-700 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                ଅଫଲାଇନ୍ ହିଷ୍ଟ୍ରି NLP ଜେନେରେଟର ସକ୍ରିୟ
              </span>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତ ହେଉଛି...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତ କରନ୍ତୁ (Generate Questions)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* PREVIEW AND APPROVAL SECTION */}
      {generatedQuestions.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-2xl shadow-md">
            <div>
              <h3 className="font-odia font-bold text-lg text-amber-300">
                ପ୍ରସ୍ତୁତ ପ୍ରଶ୍ନ ପୂର୍ବାବଲୋକନ ଓ ଅନୁମୋଦନ (Approval Queue)
              </h3>
              <p className="text-xs text-slate-300">
                ଅନୁପଯୁକ୍ତ ପ୍ରଶ୍ନ ସଂଶୋଧନ କିମ୍ବା ଡିଲିଟ୍ କରନ୍ତୁ ଏବଂ ଅନୁମୋଦନ କରି ସ୍ଥାୟୀ ପ୍ରଶ୍ନ ବ୍ୟାଙ୍କରେ ସଞ୍ଚୟ କରନ୍ତୁ।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={selectAll}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                ସବୁ ଚୟନ (Select All)
              </button>
              <button
                onClick={deselectAll}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                ଅଣଚୟନ (Deselect)
              </button>
              <button
                onClick={() => handleSaveToBank(selectedIndices)}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>ଅନୁମୋଦନ କରନ୍ତୁ ({selectedIndices.length} Approved)</span>
              </button>
            </div>
          </div>

          {/* List of Generated Cards */}
          <div className="space-y-3">
            {generatedQuestions.map((q, idx) => {
              const isSelected = selectedIndices.includes(idx);

              return (
                <div
                  key={idx}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isSelected 
                      ? 'bg-white border-amber-400 shadow-sm ring-1 ring-amber-400/30' 
                      : 'bg-slate-50 border-slate-200 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectIndex(idx)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="font-bold text-xs uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        Q{idx + 1} • {q.pattern.toUpperCase()} ({q.marks} Mark{q.marks > 1 ? 's' : ''})
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingQuestion({ index: idx, q: { ...q } })}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-blue-600"
                        title="Edit Question"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <h4 className="font-odia font-bold text-base sm:text-lg text-slate-900 mt-2.5 leading-snug">
                    {q.question}
                  </h4>

                  {/* Options if MCQ or Blanks */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = opt === q.correctAnswer;
                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                              isCorrect 
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' 
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-slate-200/80 flex items-center justify-center font-bold text-[10px]">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                            {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Model Answer for Short / Long */}
                  {q.modelAnswer && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-100 text-slate-800 text-xs">
                      <span className="font-bold text-slate-900 block mb-1">ମଡେଲ ଉତ୍ତର (Model Answer):</span>
                      <p className="leading-relaxed">{q.modelAnswer}</p>
                    </div>
                  )}

                  {/* Explanation Preview */}
                  {q.explanationCorrect && (
                    <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-emerald-950">
                      <span className="font-bold text-emerald-900 block mb-0.5">ବ୍ୟାଖ୍ୟା (Explanation):</span>
                      <p className="leading-relaxed">{q.explanationCorrect}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-odia font-bold text-xl text-slate-900">
                ପ୍ରଶ୍ନ ସଂଶୋଧନ (Edit Question)
              </h3>
              <button onClick={() => setEditingQuestion(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEditingQuestion} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">ପ୍ରଶ୍ନ (Question Text)*</label>
                <textarea
                  rows={3}
                  required
                  value={editingQuestion.q.question}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    q: { ...editingQuestion.q, question: e.target.value }
                  })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">ସଠିକ୍ ଉତ୍ତର (Correct Answer)*</label>
                <input
                  type="text"
                  required
                  value={editingQuestion.q.correctAnswer}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    q: { ...editingQuestion.q, correctAnswer: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">ସଠିକ୍ ଉତ୍ତରର ବିସ୍ତୃତ ବ୍ୟାଖ୍ୟା (Explanation)*</label>
                <textarea
                  rows={2}
                  value={editingQuestion.q.explanationCorrect}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    q: { ...editingQuestion.q, explanationCorrect: e.target.value }
                  })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                >
                  ବାତିଲ୍
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold text-xs"
                >
                  ଅପଡେଟ୍ କରନ୍ତୁ (Save Changes)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
