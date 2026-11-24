import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  FileText, 
  Users, 
  Trophy, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Award,
  Search,
  Filter
} from 'lucide-react';
import { db } from '../db';
import type { QuizSession, QuestionScoreRecord, Student, StudentSessionSummary } from '../types';
import { exportResultsToExcel } from '../services/excelService';
import { exportResultsToPDF } from '../services/pdfService';

interface ReportsScreenProps {
  onBack: () => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ onBack }) => {
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [scores, setScores] = useState<QuestionScoreRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [summaries, setSummaries] = useState<StudentSessionSummary[]>([]);
  const [displayFilter, setDisplayFilter] = useState<'all' | 'top3' | 'top5'>('all');
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<StudentSessionSummary | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const sesList = await db.sessions.toArray();
      const stList = await db.students.toArray();
      setSessions(sesList);
      setStudents(stList);

      if (sesList.length > 0) {
        setSelectedSessionId(sesList[0].id);
      }
    };
    loadData();
  }, []);

  // Compute session summaries when selected session changes
  useEffect(() => {
    const computeSummaries = async () => {
      const allScores = await db.scores.toArray();
      setScores(allScores);

      // Group scores by roll number
      const map = new Map<string, StudentSessionSummary>();

      for (const sc of allScores) {
        if (!map.has(sc.rollNo)) {
          map.set(sc.rollNo, {
            rollNo: sc.rollNo,
            name: sc.name,
            totalMarks: 0,
            correctCount: 0,
            incorrectCount: 0,
            partialCount: 0,
            bonusCount: 0,
            handRaiseCount: 0
          });
        }
        const s = map.get(sc.rollNo)!;
        s.totalMarks += sc.marks;
        if (sc.markingStatus === 'correct') s.correctCount++;
        if (sc.markingStatus === 'incorrect') s.incorrectCount++;
        if (sc.markingStatus === 'partial') s.partialCount++;
        if (sc.markingStatus === 'bonus') s.bonusCount++;
        if (sc.handRaisedRank) s.handRaiseCount++;
      }

      // If no live scores in database yet, generate a comprehensive mock sample for demonstration
      if (map.size === 0 && students.length > 0) {
        students.slice(0, 6).forEach((st, idx) => {
          map.set(st.rollNo, {
            rollNo: st.rollNo,
            name: st.name,
            totalMarks: [8, 6, 5, 4, 3, 2][idx] || 2,
            correctCount: [5, 4, 3, 2, 2, 1][idx] || 1,
            incorrectCount: [1, 1, 2, 2, 3, 2][idx] || 1,
            partialCount: 1,
            bonusCount: idx === 0 ? 1 : 0,
            handRaiseCount: [7, 6, 5, 4, 3, 2][idx] || 2
          });
        });
      }

      const list = Array.from(map.values()).sort((a, b) => b.totalMarks - a.totalMarks);
      setSummaries(list);
    };

    computeSummaries();
  }, [selectedSessionId, students]);

  const currentSession: QuizSession | undefined = sessions.find(s => s.id === selectedSessionId) || {
    id: 'demo_session',
    pin: '5821',
    title: 'ଓଡ଼ିଶା ଇତିହାସ କୁଇଜ୍ ପରୀକ୍ଷା (History of Odisha Quiz)',
    subject: 'History of Odisha',
    topic: 'Kalinga War to Paika Rebellion',
    questionIds: [1, 2, 3, 4, 5],
    currentQuestionIndex: 0,
    status: 'ended',
    revealAnswer: true,
    showDescription: true,
    timerDuration: 30,
    createdAt: new Date().toISOString()
  };

  const displayedList = summaries.slice(
    0,
    displayFilter === 'top3' ? 3 : displayFilter === 'top5' ? 5 : summaries.length
  );

  const handleExportExcel = () => {
    exportResultsToExcel(currentSession.title, summaries);
  };

  const handleExportPDF = () => {
    exportResultsToPDF(currentSession, summaries, students.length);
  };

  const handlePrint = () => {
    window.print();
  };

  // Class statistics
  const totalEnrolled = students.length || summaries.length;
  const totalAttended = summaries.length;
  const nonParticipants = Math.max(0, totalEnrolled - totalAttended);
  const highestMarks = summaries.length > 0 ? summaries[0].totalMarks : 0;
  const lowestMarks = summaries.length > 0 ? summaries[summaries.length - 1].totalMarks : 0;
  const averageMarks = summaries.length > 0 ? (summaries.reduce((a, b) => a + b.totalMarks, 0) / summaries.length).toFixed(1) : '0';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-odia font-black text-2xl text-slate-900">
              ରିପୋର୍ଟ୍ସ ଏବଂ ଫଳାଫଳ
            </h2>
            <p className="font-heading font-semibold text-xs uppercase text-slate-500">
              Classroom Quiz Reports & Academic Evaluation
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold shadow-xs active:scale-95 transition-all"
            title="Export Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Excel ରପ୍ତାନି</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
            title="Download Official PDF Report"
          >
            <FileText className="w-4 h-4" />
            <span>PDF ରିପୋର୍ଟ୍ ଡାଉନଲୋଡ୍</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-xs active:scale-95 transition-all"
            title="Print Report"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Class Performance Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold uppercase">ମୋଟ ନାମଲେଖା (Enrolled)</div>
          <div className="font-mono text-2xl font-black text-slate-900 mt-1">{totalEnrolled}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-emerald-700 font-semibold uppercase">ଉପସ୍ଥିତ (Attended)</div>
          <div className="font-mono text-2xl font-black text-emerald-700 mt-1">{totalAttended}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold uppercase">ହାରାହାରି ମାର୍କ (Average)</div>
          <div className="font-mono text-2xl font-black text-blue-700 mt-1">{averageMarks}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-amber-700 font-semibold uppercase">ସର୍ବୋଚ୍ଚ (Highest)</div>
          <div className="font-mono text-2xl font-black text-amber-700 mt-1">{highestMarks}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-rose-700 font-semibold uppercase">ସର୍ବନିମ୍ନ (Lowest)</div>
          <div className="font-mono text-2xl font-black text-rose-700 mt-1">{lowestMarks}</div>
        </div>
      </div>

      {/* Filter Tabs: Top 3, Top 5, All Participants */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-600 uppercase mr-2">ପ୍ରଦର୍ଶନ ମୋଡ୍:</span>
          {(['all', 'top3', 'top5'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setDisplayFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                displayFilter === filter
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter === 'all' ? 'ସମସ୍ତ ପ୍ରତିଯୋଗୀ (All)' : filter === 'top3' ? 'Top 3 ଶୀର୍ଷ' : 'Top 5 ଶୀର୍ଷ'}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 font-bold">
          ପ୍ରଦର୍ଶିତ: {displayedList.length} Students
        </span>
      </div>

      {/* Main Results Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">ରାଙ୍କ୍ (Rank)</th>
                <th className="px-4 py-3.5">ରୋଲ୍ ନମ୍ବର (Roll No)</th>
                <th className="px-4 py-3.5">ଛାତ୍ରଙ୍କ ନାମ (Student Name)</th>
                <th className="px-4 py-3.5 text-center">ମୋଟ ମାର୍କ (Marks)</th>
                <th className="px-4 py-3.5 text-center">ସଠିକ୍ (Correct)</th>
                <th className="px-4 py-3.5 text-center">ଭୁଲ୍ (Wrong)</th>
                <th className="px-4 py-3.5 text-center">ହାତ ଟେକା (Raises)</th>
                <th className="px-4 py-3.5 text-right">ବ୍ୟକ୍ତିଗତ ରିପୋର୍ଟ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedList.map((st, idx) => (
                <tr key={st.rollNo} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`w-7 h-7 rounded-xl inline-flex items-center justify-center font-black text-xs ${
                      idx === 0 ? 'bg-amber-400 text-slate-950 shadow-xs' :
                      idx === 1 ? 'bg-slate-300 text-slate-900' :
                      idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      #{idx + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-900">
                    {st.rollNo}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {st.name}
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-black text-base text-purple-900">
                    {st.totalMarks}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-700">
                    {st.correctCount}
                  </td>
                  <td className="px-4 py-3 text-center text-rose-600">
                    {st.incorrectCount}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-slate-600">
                    {st.handRaiseCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedStudentForReport(st)}
                      className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 hover:text-purple-800 text-slate-700 text-xs font-bold transition-colors"
                    >
                      ଦେଖନ୍ତୁ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INDIVIDUAL STUDENT SCORECARD MODAL */}
      {selectedStudentForReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-odia font-bold text-lg text-slate-900">
                ବ୍ୟକ୍ତିଗତ ମୂଲ୍ୟାଙ୍କନ ରିପୋର୍ଟ (Student Scorecard)
              </h3>
              <button onClick={() => setSelectedStudentForReport(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">ଛାତ୍ରଙ୍କ ନାମ:</span>
                <span className="font-bold text-slate-900">{selectedStudentForReport.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">ରୋଲ୍ ନମ୍ବର:</span>
                <span className="font-mono font-bold text-blue-900">{selectedStudentForReport.rollNo}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">କୁଇଜ୍ ଶୀର୍ଷକ:</span>
                <span className="font-medium text-slate-700">{currentSession.title}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200">
                <div className="text-[10px] text-purple-700 font-bold uppercase">ମୋଟ ମାର୍କ</div>
                <div className="font-mono text-xl font-black text-purple-900 mt-0.5">
                  {selectedStudentForReport.totalMarks}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="text-[10px] text-emerald-700 font-bold uppercase">ସଠିକ୍ ଉତ୍ତର</div>
                <div className="font-mono text-xl font-black text-emerald-900 mt-0.5">
                  {selectedStudentForReport.correctCount}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="text-[10px] text-amber-700 font-bold uppercase">ହାତ ଟେକା</div>
                <div className="font-mono text-xl font-black text-amber-900 mt-0.5">
                  {selectedStudentForReport.handRaiseCount}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedStudentForReport(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              ବନ୍ଦ କରନ୍ତୁ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
