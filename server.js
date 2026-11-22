import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static frontend build if dist exists
app.use(express.static(path.join(__dirname, 'dist')));

// Helper to get local IPv4 address for classroom Wi-Fi
export function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// In-memory active live quiz sessions
// Map: sessionPin -> SessionState
const activeSessions = new Map();

/*
SessionState:
{
  pin: string,
  sessionId: string,
  title: string,
  subject: string,
  topic: string,
  currentQuestionIndex: number,
  questions: any[],
  revealAnswer: boolean,
  showDescription: boolean,
  timerDuration: number,
  timerRemaining: number,
  isTimerRunning: boolean,
  handRaises: [ { rollNo, name, timestamp, sequence, rank } ],
  sequenceCounter: number,
  students: Map<string, { socketId, rollNo, name, joinedAt }>,
  scores: Map<string, { rollNo, name, totalMarks, correctCount, incorrectCount, partialCount, bonusCount, handRaiseCount }>
}
*/

// Health & network info endpoint
app.get('/api/info', (req, res) => {
  const localIp = getLocalIPAddress();
  res.json({
    status: 'ok',
    appName: 'ଇତିହାସ ଜ୍ଞାନ (ITIHASH GYAN)',
    localIp,
    port: PORT,
    joinUrlBase: `http://${localIp}:${PORT}/student`
  });
});

io.on('connection', (socket) => {
  // TEACHER creates or joins a session
  socket.on('teacher_init_session', ({ session, questions }) => {
    const pin = session.pin;
    socket.join(`session_${pin}`);

    let current = activeSessions.get(pin);
    if (!current) {
      current = {
        pin,
        sessionId: session.id,
        title: session.title,
        subject: session.subject,
        topic: session.topic,
        currentQuestionIndex: 0,
        questions: questions || [],
        revealAnswer: false,
        showDescription: false,
        timerDuration: session.timerDuration || 30,
        timerRemaining: session.timerDuration || 30,
        isTimerRunning: false,
        handRaises: [],
        sequenceCounter: 0,
        students: new Map(),
        scores: new Map()
      };
      activeSessions.set(pin, current);
    } else {
      current.questions = questions || current.questions;
    }

    socket.emit('session_state_updated', serializeSession(current));
    console.log(`[Teacher] Session initialized: PIN ${pin}`);
  });

  // STUDENT joins a session
  socket.on('student_join', ({ pin, rollNo, name }) => {
    const cleanPin = String(pin).trim();
    const session = activeSessions.get(cleanPin);

    if (!session) {
      socket.emit('join_error', { message: 'Invalid or inactive Session PIN. Please check with your teacher.' });
      return;
    }

    // Prevent duplicate participation with different names or sockets
    socket.join(`session_${cleanPin}`);
    session.students.set(rollNo, {
      socketId: socket.id,
      rollNo,
      name,
      joinedAt: Date.now()
    });

    if (!session.scores.has(rollNo)) {
      session.scores.set(rollNo, {
        rollNo,
        name,
        totalMarks: 0,
        correctCount: 0,
        incorrectCount: 0,
        partialCount: 0,
        bonusCount: 0,
        handRaiseCount: 0
      });
    }

    socket.emit('join_success', {
      session: serializeSession(session),
      student: { rollNo, name }
    });

    // Notify teacher & digital presentation panel of new student
    io.to(`session_${cleanPin}`).emit('student_list_updated', {
      studentCount: session.students.size,
      students: Array.from(session.students.values())
    });

    console.log(`[Student] ${name} (${rollNo}) joined session ${cleanPin}`);
  });

  // STUDENT raises hand
  socket.on('student_raise_hand', ({ pin, rollNo, name }) => {
    const session = activeSessions.get(String(pin).trim());
    if (!session) return;

    // Check if already raised hand for this question
    const alreadyRaised = session.handRaises.some(h => h.rollNo === rollNo);
    if (alreadyRaised) {
      socket.emit('raise_hand_ack', { status: 'already_raised' });
      return;
    }

    const serverTimestamp = Date.now();
    session.sequenceCounter += 1;
    const rank = session.handRaises.length + 1;

    const record = {
      rollNo,
      name,
      timestamp: serverTimestamp,
      sequence: session.sequenceCounter,
      rank
    };

    session.handRaises.push(record);

    // Track participation count
    if (session.scores.has(rollNo)) {
      session.scores.get(rollNo).handRaiseCount += 1;
    }

    // Acknowledge student
    socket.emit('raise_hand_ack', { status: 'success', rank });

    // Broadcast to teacher and flat panel
    io.to(`session_${pin}`).emit('hand_raises_updated', {
      handRaises: session.handRaises,
      latest: record
    });

    console.log(`[Hand Raise] #${rank}: ${name} (${rollNo}) at ${serverTimestamp}`);
  });

  // TEACHER controls question navigation
  socket.on('teacher_change_question', ({ pin, questionIndex }) => {
    const session = activeSessions.get(String(pin).trim());
    if (!session) return;

    session.currentQuestionIndex = questionIndex;
    session.revealAnswer = false;
    session.showDescription = false;
    session.handRaises = []; // Reset hand raises for new question
    session.timerRemaining = session.timerDuration;
    session.isTimerRunning = false;

    io.to(`session_${pin}`).emit('question_changed', {
      currentQuestionIndex: questionIndex,
      revealAnswer: false,
      showDescription: false,
      handRaises: []
    });
  });

  // TEACHER reveals answer
  socket.on('teacher_reveal_answer', ({ pin, reveal }) => {
    const session = activeSessions.get(String(pin).trim());
    if (!session) return;

    session.revealAnswer = reveal;
    io.to(`session_${pin}`).emit('answer_revealed', { revealAnswer: reveal });
  });

  // TEACHER toggles description / explanation
  socket.on('teacher_show_description', ({ pin, show }) => {
    const session = activeSessions.get(String(pin).trim());
    if (!session) return;

    session.showDescription = show;
    io.to(`session_${pin}`).emit('description_toggled', { showDescription: show });
  });

  // TEACHER awards marks
  socket.on('teacher_award_marks', ({ pin, rollNo, name, questionIndex, marks, markingStatus }) => {
    const session = activeSessions.get(String(pin).trim());
    if (!session) return;

    if (!session.scores.has(rollNo)) {
      session.scores.set(rollNo, {
        rollNo,
        name,
        totalMarks: 0,
        correctCount: 0,
        incorrectCount: 0,
        partialCount: 0,
        bonusCount: 0,
        handRaiseCount: 0
      });
    }

    const s = session.scores.get(rollNo);
    s.totalMarks += marks;
    if (markingStatus === 'correct') s.correctCount += 1;
    if (markingStatus === 'incorrect') s.incorrectCount += 1;
    if (markingStatus === 'partial') s.partialCount += 1;
    if (markingStatus === 'bonus') s.bonusCount += 1;

    // Broadcast updated leaderboard
    const leaderboard = Array.from(session.scores.values()).sort((a, b) => b.totalMarks - a.totalMarks);
    io.to(`session_${pin}`).emit('leaderboard_updated', { leaderboard });
  });

  // TEACHER ends session
  socket.on('teacher_end_session', ({ pin }) => {
    const session = activeSessions.get(String(pin).trim());
    if (session) {
      io.to(`session_${pin}`).emit('session_ended', { message: 'Session has concluded.' });
      activeSessions.delete(String(pin).trim());
    }
  });

  socket.on('disconnect', () => {
    // Handle socket disconnect
  });
});

function serializeSession(s) {
  return {
    pin: s.pin,
    sessionId: s.sessionId,
    title: s.title,
    subject: s.subject,
    topic: s.topic,
    currentQuestionIndex: s.currentQuestionIndex,
    questions: s.questions,
    revealAnswer: s.revealAnswer,
    showDescription: s.showDescription,
    timerDuration: s.timerDuration,
    timerRemaining: s.timerRemaining,
    isTimerRunning: s.isTimerRunning,
    handRaises: s.handRaises,
    studentCount: s.students.size,
    leaderboard: Array.from(s.scores.values()).sort((a, b) => b.totalMarks - a.totalMarks)
  };
}

// Fallback for client-side routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

httpServer.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIPAddress();
  console.log(`====================================================`);
  console.log(`  ଇତିହାସ ଜ୍ଞାନ (ITIHASH GYAN) - Classroom Server`);
  console.log(`====================================================`);
  console.log(`  Local URL:        http://localhost:${PORT}`);
  console.log(`  Classroom Wi-Fi:  http://${ip}:${PORT}`);
  console.log(`  Student Join URL: http://${ip}:${PORT}/?view=student`);
  console.log(`====================================================`);
});
