import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { StudentSessionSummary, QuizSession } from '../types';

export function exportResultsToPDF(
  session: QuizSession,
  summaries: StudentSessionSummary[],
  totalStudentsEnrolled: number = summaries.length
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Background Banner
  doc.setFillColor(6, 78, 59); // Emerald Forest #064e3b
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Title: Odia Name in prominent font & English in smaller font
  doc.setTextColor(254, 240, 138); // Warm Gold
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ITIHASH GYAN (ଇତିହାସ ଜ୍ଞାନ)', pageWidth / 2, 16, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Smart Interactive Classroom Quiz & Examination Report', pageWidth / 2, 24, { align: 'center' });
  doc.text(`Department of History | Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 31, { align: 'center' });

  // Quiz Meta Details Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 44, pageWidth - 28, 26, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Quiz Title: ${session.title}`, 20, 52);
  doc.text(`Subject: ${session.subject}`, 20, 60);

  doc.setFont('helvetica', 'normal');
  doc.text(`Topic: ${session.topic}`, pageWidth / 2 + 10, 52);
  doc.text(`Session PIN: ${session.pin} | Date: ${new Date(session.createdAt).toLocaleDateString()}`, pageWidth / 2 + 10, 60);

  // Statistics Summary Box
  const participantsCount = summaries.length;
  const nonParticipants = Math.max(0, totalStudentsEnrolled - participantsCount);
  const totalScore = summaries.reduce((acc, s) => acc + s.totalMarks, 0);
  const avgScore = participantsCount > 0 ? (totalScore / participantsCount).toFixed(1) : '0';
  const highestMarks = participantsCount > 0 ? Math.max(...summaries.map(s => s.totalMarks)) : 0;
  const lowestMarks = participantsCount > 0 ? Math.min(...summaries.map(s => s.totalMarks)) : 0;

  doc.roundedRect(14, 74, pageWidth - 28, 20, 3, 3, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Enrolled: ${totalStudentsEnrolled}`, 20, 83);
  doc.text(`Attended: ${participantsCount}`, 60, 83);
  doc.text(`Absent: ${nonParticipants}`, 100, 83);
  doc.text(`Average: ${avgScore}`, 135, 83);
  doc.text(`High / Low: ${highestMarks} / ${lowestMarks}`, 165, 83);

  // Table of Student Results
  const tableRows = summaries.map((s, idx) => [
    idx + 1,
    s.rollNo,
    s.name,
    s.totalMarks,
    s.correctCount,
    s.incorrectCount,
    s.bonusCount,
    s.handRaiseCount
  ]);

  autoTable(doc, {
    startY: 100,
    head: [['Rank', 'Roll No', 'Student Name', 'Total Marks', 'Correct', 'Incorrect', 'Bonus', 'Hand Raises']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110], // Teal Emerald
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'center', cellWidth: 26 },
      2: { cellWidth: 'auto' },
      3: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'center', cellWidth: 18 },
      7: { halign: 'center', cellWidth: 22 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer
      const footerText = 'ଇତିହାସ ଜ୍ଞାନ (ITIHASH GYAN) — Official Classroom Academic Quiz Record';
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
  });

  doc.save(`ITIHAS_GYAN_${session.title.replace(/\s+/g, '_')}_Report.pdf`);
}
