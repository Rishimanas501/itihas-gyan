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
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

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

let cloudflareUrl = '';

// Health & network info endpoint
app.get('/api/info', (req, res) => {
  const localIp = getLocalIPAddress();
  res.json({
    status: 'ok',
    appName: 'ଇତିହାସ ଜ୍ଞାନ (ITIHASH GYAN)',
    localIp,
    cloudflareUrl: cloudflareUrl || null,
    port: PORT,
    joinUrlBase: `http://${localIp}:${PORT}/student`
  });
});

// Direct Session Status endpoint
app.get('/api/session/:pin', (req, res) => {
  const pin = String(req.params.pin || '').trim();
  const session = activeSessions.get(pin);
  if (!session) return res.json({ found: false });
  const currentQ = (session.questions && session.questions[session.currentQuestionIndex])
    ? session.questions[session.currentQuestionIndex]
    : null;
  res.json({
    found: true,
    pin: session.pin,
    title: session.title,
    currentQuestionIndex: session.currentQuestionIndex,
    currentQuestion: currentQ,
    questions: session.questions || [],
    handRaises: session.handRaises,
    studentCount: session.students.size,
    students: Array.from(session.students.values()),
    revealAnswer: session.revealAnswer,
    showDescription: session.showDescription
  });
});

app.post('/api/tunnel', (req, res) => {
  if (req.body && req.body.url) {
    cloudflareUrl = req.body.url;
    console.log(`\n>>> Cloudflare Public Tunnel Active: ${cloudflareUrl} <<<\n`);
  }
  res.json({ ok: true, cloudflareUrl });
});

// AI Info & Proxy endpoints for secure server-side execution
app.get('/api/ai/models', (req, res) => {
  res.json({
    status: 'ok',
    hasServerGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasServerOpenAiKey: Boolean(process.env.OPENAI_API_KEY)
  });
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { provider, model, messages, currentInput, attachments, geminiApiKey, openaiApiKey, systemInstruction } = req.body;
    
    // Use server environment variable if available, else user-provided key
    const activeGeminiKey = process.env.GEMINI_API_KEY || geminiApiKey;
    const activeOpenAiKey = process.env.OPENAI_API_KEY || openaiApiKey;

    if (provider === 'gemini') {
      if (!activeGeminiKey) {
        return res.status(400).json({ error: 'Gemini API key is required.' });
      }
      const apiModel = model?.startsWith('gemini') ? model : 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${activeGeminiKey}`;

      const contents = [];
      if (Array.isArray(messages)) {
        for (const m of messages.slice(-10)) {
          contents.push({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          });
        }
      }

      const currentParts = [{ text: currentInput || '' }];
      if (Array.isArray(attachments)) {
        for (const att of attachments) {
          if (att.dataUrl && att.dataUrl.includes(';base64,')) {
            const [mimePart, b64Part] = att.dataUrl.split(';base64,');
            const mimeType = mimePart.replace('data:', '');
            currentParts.push({ inlineData: { mimeType, data: b64Part } });
          } else if (att.extractedText) {
            currentParts.push({ text: `\n[Document: ${att.name}]\n${att.extractedText}\n` });
          }
        }
      }
      contents.push({ role: 'user', parts: currentParts });

      const gRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          generationConfig: { temperature: 0.4, maxOutputTokens: 2500 }
        })
      });

      if (!gRes.ok) {
        const errJson = await gRes.json().catch(() => ({}));
        return res.status(gRes.status).json({ error: errJson?.error?.message || gRes.statusText });
      }

      const gData = await gRes.json();
      const output = gData.candidates?.[0]?.content?.parts?.[0]?.text;
      return res.json({ text: output });
    }

    if (provider === 'openai') {
      if (!activeOpenAiKey) {
        return res.status(400).json({ error: 'OpenAI API key is required.' });
      }
      const apiModel = model?.startsWith('gpt') ? model : 'gpt-4o';
      const url = 'https://api.openai.com/v1/chat/completions';

      const formatted = [];
      if (systemInstruction) {
        formatted.push({ role: 'system', content: systemInstruction });
      }
      if (Array.isArray(messages)) {
        for (const m of messages.slice(-8)) {
          formatted.push({ role: m.role, content: m.content });
        }
      }

      const currentContent = [{ type: 'text', text: currentInput || '' }];
      if (Array.isArray(attachments)) {
        for (const att of attachments) {
          if (att.type === 'image' && att.dataUrl) {
            currentContent.push({ type: 'image_url', image_url: { url: att.dataUrl } });
          } else if (att.extractedText) {
            currentContent.push({ type: 'text', text: `\n[Document: ${att.name}]\n${att.extractedText}\n` });
          }
        }
      }
      formatted.push({ role: 'user', content: currentContent });

      const oRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeOpenAiKey}`
        },
        body: JSON.stringify({
          model: apiModel,
          messages: formatted,
          temperature: 0.5,
          max_tokens: 2500
        })
      });

      if (!oRes.ok) {
        const errJson = await oRes.json().catch(() => ({}));
        return res.status(oRes.status).json({ error: errJson?.error?.message || oRes.statusText });
      }

      const oData = await oRes.json();
      const output = oData.choices?.[0]?.message?.content;
      return res.json({ text: output });
    }

    return res.status(400).json({ error: 'Unsupported provider for server proxy' });
  } catch (err) {
    console.error('Server AI Chat error:', err);
    res.status(500).json({ error: err.message || 'Internal server error in AI proxy' });
  }
});

io.on('connection', (socket) => {
  // TEACHER creates or joins a session
  socket.on('teacher_init_session', ({ session, questions }) => {
    if (!session || !session.pin) return;
    const pin = String(session.pin).trim();
    socket.join(`session_${pin}`);

    let current = activeSessions.get(pin);
    if (!current) {
      current = {
        pin,
        sessionId: session.id || pin,
        title: session.title || 'Live Quiz',
        subject: session.subject || '',
        topic: session.topic || '',
        currentQuestionIndex: session.currentQuestionIndex || 0,
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
      if (questions && questions.length > 0) {
        current.questions = questions;
      }
      current.title = session.title || current.title;
      current.subject = session.subject || current.subject;
      current.topic = session.topic || current.topic;
    }

    socket.emit('session_state_updated', serializeSession(current));
    // Immediately emit current hand raises and student list to teacher
    socket.emit('hand_raises_updated', {
      handRaises: current.handRaises,
      latest: current.handRaises[current.handRaises.length - 1] || null
    });
    socket.emit('student_list_updated', {
      studentCount: current.students.size,
      students: Array.from(current.students.values())
    });

    console.log(`[Teacher] Session initialized: PIN ${pin} (Socket ID: ${socket.id})`);
  });

  // STUDENT joins a session
  socket.on('student_join', ({ pin, rollNo, name }) => {
    if (!pin || !rollNo) return;
    const cleanPin = String(pin).trim();
    let session = activeSessions.get(cleanPin);

    // Auto-create session if teacher hasn't initialized yet so student is not dropped
    if (!session) {
      session = {
        pin: cleanPin,
        sessionId: cleanPin,
        title: 'Live Quiz Session',
        subject: '',
        topic: '',
        currentQuestionIndex: 0,
        questions: [],
        revealAnswer: false,
        showDescription: false,
        timerDuration: 30,
        timerRemaining: 30,
        isTimerRunning: false,
        handRaises: [],
        sequenceCounter: 0,
        students: new Map(),
        scores: new Map()
      };
      activeSessions.set(cleanPin, session);
    }

    // Prevent duplicate participation with different names or sockets
    socket.join(`session_${cleanPin}`);
    session.students.set(rollNo, {
      socketId: socket.id,
      rollNo,
      name: name || `Student (${rollNo})`,
      joinedAt: Date.now()
    });

    if (!session.scores.has(rollNo)) {
      session.scores.set(rollNo, {
        rollNo,
        name: name || `Student (${rollNo})`,
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
      student: { rollNo, name: name || `Student (${rollNo})` }
    });

    // Notify teacher & digital presentation panel of new student
    io.to(`session_${cleanPin}`).emit('student_list_updated', {
      studentCount: session.students.size,
      students: Array.from(session.students.values())
    });

    console.log(`[Student] ${name || rollNo} (${rollNo}) joined session ${cleanPin}`);
  });

  // STUDENT raises hand
  socket.on('student_raise_hand', ({ pin, rollNo, name }) => {
    if (!pin || !rollNo) return;
    const cleanPin = String(pin).trim();
    let session = activeSessions.get(cleanPin);

    // Auto-create session if not yet present
    if (!session) {
      session = {
        pin: cleanPin,
        sessionId: cleanPin,
        title: 'Live Quiz Session',
        subject: '',
        topic: '',
        currentQuestionIndex: 0,
        questions: [],
        revealAnswer: false,
        showDescription: false,
        timerDuration: 30,
        timerRemaining: 30,
        isTimerRunning: false,
        handRaises: [],
        sequenceCounter: 0,
        students: new Map(),
        scores: new Map()
      };
      activeSessions.set(cleanPin, session);
    }

    // Ensure student socket is in room
    socket.join(`session_${cleanPin}`);

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
      name: name || `Student (${rollNo})`,
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
    io.to(`session_${cleanPin}`).emit('hand_raises_updated', {
      handRaises: session.handRaises,
      latest: record
    });

    console.log(`[Hand Raise] #${rank}: ${name || rollNo} (${rollNo}) in session ${cleanPin} at ${serverTimestamp}`);
  });

  // TEACHER controls question navigation
  socket.on('teacher_change_question', ({ pin, questionIndex }) => {
    const cleanPin = String(pin).trim();
    const session = activeSessions.get(cleanPin);
    if (!session) return;

    session.currentQuestionIndex = questionIndex;
    session.revealAnswer = false;
    session.showDescription = false;
    session.handRaises = []; // Reset hand raises for new question
    session.timerRemaining = session.timerDuration;
    session.isTimerRunning = false;

    const currentQuestion = (session.questions && session.questions[questionIndex])
      ? session.questions[questionIndex]
      : null;

    io.to(`session_${cleanPin}`).emit('question_changed', {
      currentQuestionIndex: questionIndex,
      currentQuestion,
      questions: session.questions || [],
      revealAnswer: false,
      showDescription: false,
      handRaises: []
    });
  });

  // TEACHER reveals answer
  socket.on('teacher_reveal_answer', ({ pin, reveal }) => {
    const cleanPin = String(pin).trim();
    const session = activeSessions.get(cleanPin);
    if (!session) return;

    session.revealAnswer = reveal;
    io.to(`session_${cleanPin}`).emit('answer_revealed', { revealAnswer: reveal });
  });

  // INTERACTIVE OPTION CLICK (Real-time option evaluation & explanation feedback)
  socket.on('client_click_option', ({ pin, optIndex, optionText, isCorrect, explanation }) => {
    const cleanPin = String(pin).trim();
    const session = activeSessions.get(cleanPin);
    if (session && isCorrect) {
      session.revealAnswer = true;
    }
    io.to(`session_${cleanPin}`).emit('option_clicked', {
      optIndex,
      optionText,
      isCorrect,
      explanation
    });
  });

  // TEACHER toggles description / explanation
  socket.on('teacher_show_description', ({ pin, show }) => {
    const cleanPin = String(pin).trim();
    const session = activeSessions.get(cleanPin);
    if (!session) return;

    session.showDescription = show;
    io.to(`session_${cleanPin}`).emit('description_toggled', { showDescription: show });
  });

  // TEACHER awards marks
  socket.on('teacher_award_marks', ({ pin, rollNo, name, questionIndex, marks, markingStatus }) => {
    const cleanPin = String(pin).trim();
    const session = activeSessions.get(cleanPin);
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
    io.to(`session_${cleanPin}`).emit('leaderboard_updated', { leaderboard });
  });

  // TEACHER ends session
  socket.on('teacher_end_session', ({ pin }) => {
    const cleanPin = String(pin).trim();
    const session = activeSessions.get(cleanPin);
    if (session) {
      io.to(`session_${cleanPin}`).emit('session_ended', { message: 'Session has concluded.' });
      activeSessions.delete(cleanPin);
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
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
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
