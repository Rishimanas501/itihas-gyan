import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
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

// In-memory active live quiz sessions & ended session PIN registry
// Map: sessionPin -> SessionState
const activeSessions = new Map();
const endedSessionMap = new Map();

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
let activeTunnelProcess = null;
let tunnelStatus = 'idle'; // 'idle' | 'connecting' | 'active' | 'error'
let tunnelError = '';
let tunnelWaiters = [];

function resolveTunnelWaiters(result) {
  const waiters = tunnelWaiters;
  tunnelWaiters = [];
  for (const resolve of waiters) {
    resolve(result);
  }
}

function startCloudflareTunnel() {
  if (cloudflareUrl) {
    return Promise.resolve({ ok: true, cloudflareUrl, status: 'active' });
  }

  const cloudflaredPath = path.join(__dirname, 'cloudflared.exe');
  if (!fs.existsSync(cloudflaredPath)) {
    tunnelStatus = 'error';
    tunnelError = 'cloudflared.exe not found in project folder.';
    return Promise.resolve({ ok: false, cloudflareUrl: null, status: 'error', error: tunnelError });
  }

  if (activeTunnelProcess && tunnelStatus === 'connecting') {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve({ ok: false, cloudflareUrl: null, status: tunnelStatus, error: 'Tunnel connection timed out. Check internet.' });
      }, 15000);
      tunnelWaiters.push((res) => {
        clearTimeout(timer);
        resolve(res);
      });
    });
  }

  tunnelStatus = 'connecting';
  tunnelError = '';

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (!cloudflareUrl) {
        resolve({ ok: false, cloudflareUrl: null, status: tunnelStatus, error: 'Could not obtain online link in 15s. Please check internet connection.' });
      }
    }, 15000);

    tunnelWaiters.push((res) => {
      clearTimeout(timer);
      resolve(res);
    });

    try {
      activeTunnelProcess = spawn(cloudflaredPath, ['tunnel', '--url', `http://127.0.0.1:${PORT}`], {
        cwd: __dirname,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true
      });

      const handleOutput = (chunk) => {
        const text = chunk.toString();
        const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (match && !cloudflareUrl) {
          cloudflareUrl = match[0];
          tunnelStatus = 'active';
          tunnelError = '';
          console.log(`\n>>> Cloudflare Public Tunnel Active: ${cloudflareUrl} <<<\n`);
          io.emit('tunnel_url_updated', { cloudflareUrl, status: 'active' });
          resolveTunnelWaiters({ ok: true, cloudflareUrl, status: 'active' });
        }
      };

      activeTunnelProcess.stdout.on('data', handleOutput);
      activeTunnelProcess.stderr.on('data', handleOutput);

      activeTunnelProcess.on('error', (err) => {
        activeTunnelProcess = null;
        tunnelStatus = 'error';
        tunnelError = err.message || 'Failed to launch cloudflared.exe';
        resolveTunnelWaiters({ ok: false, cloudflareUrl: null, status: 'error', error: tunnelError });
      });

      activeTunnelProcess.on('exit', () => {
        const wasResolved = Boolean(cloudflareUrl);
        activeTunnelProcess = null;
        if (!wasResolved) {
          tunnelStatus = 'error';
          tunnelError = 'Online tunnel closed before connecting. Check internet connection.';
          resolveTunnelWaiters({ ok: false, cloudflareUrl: null, status: 'error', error: tunnelError });
        } else {
          cloudflareUrl = '';
          tunnelStatus = 'idle';
          io.emit('tunnel_url_updated', { cloudflareUrl: null, status: 'idle' });
        }
      });
    } catch (err) {
      activeTunnelProcess = null;
      tunnelStatus = 'error';
      tunnelError = err.message || 'Failed to start tunnel';
      resolveTunnelWaiters({ ok: false, cloudflareUrl: null, status: 'error', error: tunnelError });
    }
  });
}

// Health & network info endpoint
app.get('/api/info', (req, res) => {
  const localIp = getLocalIPAddress();
  res.json({
    status: 'ok',
    appName: 'ଇତିହାସ ଜ୍ଞାନ (ITIHASH GYAN)',
    localIp,
    cloudflareUrl: cloudflareUrl || null,
    tunnelStatus: cloudflareUrl ? 'active' : tunnelStatus,
    hasCloudflared: fs.existsSync(path.join(__dirname, 'cloudflared.exe')),
    port: PORT,
    joinUrlBase: `http://${localIp}:${PORT}/student`
  });
});

// Active Live Session summary (for auto-filling PIN when student opens base join link)
app.get('/api/active-session', (_req, res) => {
  if (activeSessions.size === 0) {
    return res.json({ found: false });
  }
  const sessionsArr = Array.from(activeSessions.values());
  const latest = sessionsArr[sessionsArr.length - 1];
  res.json({
    found: true,
    count: sessionsArr.length,
    pin: latest.pin,
    title: latest.title
  });
});

// Direct Session Status endpoint
app.get('/api/session/:pin', (req, res) => {
  const pin = String(req.params.pin || '').trim();
  const session = activeSessions.get(pin);
  if (!session) {
    return res.json({
      found: false,
      ended: endedSessionMap.has(pin),
      message: endedSessionMap.has(pin)
        ? 'ଏହି କ୍ଲାସ୍ ଏବଂ QR କୋଡ୍ ଶିକ୍ଷକ ବନ୍ଦ କରିଦେଇଛନ୍ତି। (Class closed by teacher.)'
        : 'Session not active'
    });
  }
  const currentQ = (session.questions && session.questions[session.currentQuestionIndex])
    ? session.questions[session.currentQuestionIndex]
    : null;
  res.json({
    found: true,
    pin: session.pin,
    title: session.title,
    subject: session.subject,
    topic: session.topic,
    currentQuestionIndex: session.currentQuestionIndex,
    currentQuestion: currentQ,
    questions: session.questions || [],
    handRaises: session.handRaises,
    studentCount: session.students.size,
    students: Array.from(session.students.values()),
    isTeacherOnline: session.isTeacherOnline !== false,
    revealAnswer: session.revealAnswer,
    showDescription: session.showDescription,
    leaderboard: Array.from(session.scores.values()).sort((a, b) => b.totalMarks - a.totalMarks)
  });
});

app.post('/api/tunnel', (req, res) => {
  if (req.body && req.body.url) {
    cloudflareUrl = req.body.url;
    tunnelStatus = 'active';
    tunnelError = '';
    io.emit('tunnel_url_updated', { cloudflareUrl, status: 'active' });
    console.log(`\n>>> Cloudflare Public Tunnel Active: ${cloudflareUrl} <<<\n`);
  }
  res.json({ ok: true, cloudflareUrl });
});

app.post('/api/tunnel/start', async (_req, res) => {
  const result = await startCloudflareTunnel();
  res.status(result.ok ? 200 : 503).json(result);
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
    endedSessionMap.delete(pin);
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

    current.teacherSocketId = socket.id;
    current.isTeacherOnline = true;
    io.to(`session_${pin}`).emit('teacher_status_changed', { isTeacherOnline: true });

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

  // LG DIGITAL SMART PANEL / PRESENTATION joins a session by PIN
  socket.on('presentation_join', ({ pin }) => {
    if (!pin) return;
    const cleanPin = String(pin).trim();
    if (endedSessionMap.has(cleanPin)) {
      socket.emit('session_ended', {
        pin: cleanPin,
        message: 'ଏହି କ୍ଲାସ୍ ଏବଂ QR କୋଡ୍ ଶିକ୍ଷକ ବନ୍ଦ କରିଦେଇଛନ୍ତି। (Class has been closed.)'
      });
      return;
    }

    const session = activeSessions.get(cleanPin);
    if (!session) {
      socket.emit('join_error', {
        ended: false,
        message: 'ଏହି PIN ସକ୍ରିୟ ନାହିଁ। ଶିକ୍ଷକଙ୍କ ମୋବାଇଲ୍‌ରେ Live Quiz ଆରମ୍ଭ ହେବା ପରେ ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।'
      });
      return;
    }

    socket.join(`session_${cleanPin}`);
    socket.emit('session_state_updated', serializeSession(session));
    socket.emit('hand_raises_updated', {
      handRaises: session.handRaises,
      latest: session.handRaises[session.handRaises.length - 1] || null
    });
    socket.emit('student_list_updated', {
      studentCount: session.students.size,
      students: Array.from(session.students.values())
    });
    console.log(`[Smart Panel] Presentation joined session ${cleanPin}`);
  });

  // STUDENT joins a session
  socket.on('student_join', ({ pin, rollNo, name }) => {
    if (!pin || !rollNo) return;
    const cleanPin = String(pin).trim();
    if (endedSessionMap.has(cleanPin)) {
      socket.emit('join_error', {
        ended: true,
        message: 'ଏହି କ୍ଲାସ୍ ଏବଂ QR କୋଡ୍ ଶିକ୍ଷକ ବନ୍ଦ କରିଦେଇଛନ୍ତି। ନୂଆ କ୍ଲାସ୍‌ର QR କୋଡ୍ ସ୍କାନ୍ କରନ୍ତୁ। (This class & QR code has been closed.)'
      });
      return;
    }

    const session = activeSessions.get(cleanPin);
    if (!session) {
      socket.emit('join_error', {
        ended: false,
        message: 'ଏହି ସେସନ୍‌ଟି ବର୍ତ୍ତମାନ ସକ୍ରିୟ ନାହିଁ କିମ୍ବା ବନ୍ଦ ହୋଇଯାଇଛି। ଦୟାକରି ଶିକ୍ଷକଙ୍କ ନୂଆ QR କୋଡ୍ ସ୍କାନ୍ କରନ୍ତୁ। (Session not active or closed.)'
      });
      return;
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
    if (endedSessionMap.has(cleanPin)) {
      socket.emit('session_ended', { message: 'ଏହି କ୍ଲାସ୍ ଶିକ୍ଷକ ବନ୍ଦ କରିଦେଇଛନ୍ତି। (Class has ended.)' });
      return;
    }

    const session = activeSessions.get(cleanPin);
    if (!session) {
      socket.emit('join_error', { ended: false, message: 'Session is not active or has ended.' });
      return;
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

  // TEACHER ends session (closes class QR code & invalidates old link)
  socket.on('teacher_end_session', ({ pin }) => {
    const cleanPin = String(pin).trim();
    const session = activeSessions.get(cleanPin);
    endedSessionMap.set(cleanPin, { endedAt: Date.now() });
    io.to(`session_${cleanPin}`).emit('session_ended', {
      pin: cleanPin,
      message: 'ଏହି କ୍ଲାସ୍ ଏବଂ QR କୋଡ୍ ଶିକ୍ଷକ ବନ୍ଦ କରିଦେଇଛନ୍ତି। (Class has concluded.)'
    });
    if (session) {
      activeSessions.delete(cleanPin);
      console.log(`[Teacher] Session ended & QR closed: PIN ${cleanPin}`);
    }
  });

  socket.on('disconnect', () => {
    for (const [pin, session] of activeSessions.entries()) {
      if (session.teacherSocketId === socket.id) {
        session.isTeacherOnline = false;
        io.to(`session_${pin}`).emit('teacher_status_changed', {
          isTeacherOnline: false,
          message: 'ଅଧ୍ୟାପକ ସାମୟିକ ଭାବେ ଅଫଲାଇନ୍ ଅଛନ୍ତି... ଦୟାକରି ଅପେକ୍ଷା କରନ୍ତୁ।'
        });
        console.log(`[Session ${pin}] Teacher disconnected (Waiting for teacher relaunch)`);
      }
    }
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
    isTeacherOnline: s.isTeacherOnline !== false,
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

function cleanupTunnel() {
  if (activeTunnelProcess && !activeTunnelProcess.killed) {
    activeTunnelProcess.kill();
    activeTunnelProcess = null;
  }
}

process.on('SIGINT', () => {
  cleanupTunnel();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanupTunnel();
  process.exit(0);
});
