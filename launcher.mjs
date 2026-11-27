import { spawn, exec } from 'child_process';
import dns from 'dns';
import fs from 'fs';
import http from 'http';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const LOCAL_URL = `http://localhost:${PORT}`;
const NO_BROWSER = process.argv.includes('--no-browser');

let serverProc = null;
let tunnelProc = null;
let startedLocalServer = false;
let localInfo = { localIp: 'localhost', port: PORT, cloudflareUrl: null };
let activeOnlineUrl = '';
let browserOpened = false;
let isShuttingDown = false;

function openUrlInBrowser(url) {
  exec(`start "" "${url}"`, { windowsHide: true }, () => {});
}

function copyToClipboard(text) {
  const safe = text.replace(/'/g, "''");
  exec(`powershell -NoProfile -Command "Set-Clipboard -Value '${safe}'"`, { windowsHide: true }, () => {});
}

function fetchServerInfo() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${PORT}/api/info`, { timeout: 1500 }, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk.toString();
      });
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data && data.status === 'ok') {
            resolve(data);
            return;
          }
        } catch {
          // Ignore invalid JSON
        }
        resolve(null);
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

function postTunnelUrl(url) {
  const payload = JSON.stringify({ url });
  const req = http.request(
    {
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/tunnel',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    },
    () => {}
  );
  req.on('error', () => {});
  req.write(payload);
  req.end();
}

function checkInternetAvailable() {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 3000);
    dns.lookup('trycloudflare.com', (err) => {
      clearTimeout(timer);
      resolve(!err);
    });
  });
}

function printBanner() {
  const lanBase =
    localInfo.localIp && localInfo.localIp !== 'localhost'
      ? `http://${localInfo.localIp}:${PORT}`
      : LOCAL_URL;

  console.clear();
  console.log('====================================================================');
  console.log('  ITIHAS GYAN - Offline & Online Unified Launcher');
  console.log('====================================================================');
  console.log('');
  console.log('  [OFFLINE / CLASSROOM WI-FI]');
  console.log(`    Teacher App : ${LOCAL_URL}`);
  console.log(`    LAN / Wi-Fi : ${lanBase}`);
  console.log(`    Student LAN : ${lanBase}/?view=student`);
  console.log('');
  if (activeOnlineUrl) {
    console.log('  [ONLINE PUBLIC ACCESS - ACTIVE]');
    console.log(`    Public App  : ${activeOnlineUrl}  (Copied to clipboard)`);
    console.log('    Note        : Start Live Quiz inside app & use WhatsApp/QR button for PIN link.');
  } else {
    console.log('  [ONLINE PUBLIC ACCESS]');
    console.log('    Status      : Offline mode (no active tunnel yet)');
  }
  console.log('');
  console.log('--------------------------------------------------------------------');
  console.log('  Shortcuts: [O] Open App  [C] Copy Student Link  [R] Retry Online  [Q] Quit');
  console.log('  Keep this window minimized while using ITIHAS GYAN.');
  console.log('====================================================================\n');
}

async function ensureLocalServer() {
  const existing = await fetchServerInfo();
  if (existing) {
    localInfo = existing;
    if (existing.cloudflareUrl) {
      activeOnlineUrl = existing.cloudflareUrl;
    }
    return true;
  }

  console.log('[1/2] Starting local Offline/Wi-Fi server (server.js)...');
  startedLocalServer = true;
  serverProc = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverProc.stderr.on('data', (chunk) => {
    const msg = chunk.toString().trim();
    if (msg) console.error(`[Server] ${msg}`);
  });

  serverProc.on('exit', (code) => {
    if (!isShuttingDown) {
      console.log(`\n[Server] Stopped unexpectedly (code ${code ?? 'unknown'}).`);
    }
  });

  for (let i = 0; i < 30; i += 1) {
    await new Promise((r) => setTimeout(r, 400));
    const info = await fetchServerInfo();
    if (info) {
      localInfo = info;
      return true;
    }
  }
  return false;
}

function startOnlineTunnel() {
  if (tunnelProc) {
    return;
  }

  const cloudflaredPath = path.join(__dirname, 'cloudflared.exe');
  if (!fs.existsSync(cloudflaredPath)) {
    console.log('[Online] cloudflared.exe not found. Running in Offline/LAN mode only.');
    return;
  }

  console.log('[2/2] Connecting Online Cloudflare Tunnel...');
  let foundUrl = false;
  tunnelProc = spawn(cloudflaredPath, ['tunnel', '--url', LOCAL_URL], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });

  const handleOutput = (chunk) => {
    const text = chunk.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !foundUrl) {
      foundUrl = true;
      activeOnlineUrl = match[0];
      postTunnelUrl(activeOnlineUrl);
      copyToClipboard(activeOnlineUrl);
      printBanner();
    }
  };

  tunnelProc.stdout.on('data', handleOutput);
  tunnelProc.stderr.on('data', handleOutput);
  tunnelProc.on('exit', () => {
    tunnelProc = null;
    if (!isShuttingDown && !foundUrl) {
      console.log('[Online] Tunnel could not connect. Offline & Classroom Wi-Fi remain active.');
    }
  });
}

async function tryConnectOnline() {
  if (activeOnlineUrl || tunnelProc) {
    return;
  }
  const hasInternet = await checkInternetAvailable();
  if (!hasInternet) {
    console.log('[Online] No internet detected. Running in Offline & Classroom Wi-Fi mode.');
    console.log('         Press [R] anytime once connected to internet to enable Online link.\n');
    return;
  }
  startOnlineTunnel();
}

function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('\nStopping ITIHAS GYAN...');

  if (tunnelProc && !tunnelProc.killed) {
    tunnelProc.kill();
  }
  if (startedLocalServer && serverProc && !serverProc.killed) {
    serverProc.kill();
  }

  setTimeout(() => process.exit(0), 250);
}

function setupHotkeys() {
  if (!process.stdin.isTTY) return;
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();

  process.stdin.on('keypress', (_str, key) => {
    if (!key) return;
    if (key.ctrl && key.name === 'c') {
      shutdown();
      return;
    }

    const k = (key.name || '').toLowerCase();
    if (k === 'q') {
      shutdown();
    } else if (k === 'o') {
      openUrlInBrowser(LOCAL_URL);
    } else if (k === 'c') {
      const lanBase =
        localInfo.localIp && localInfo.localIp !== 'localhost'
          ? `http://${localInfo.localIp}:${PORT}`
          : LOCAL_URL;
      const studentLink = activeOnlineUrl
        ? `${activeOnlineUrl}/?view=student`
        : `${lanBase}/?view=student`;
      copyToClipboard(studentLink);
      console.log(`[Copied] Student Join Link copied: ${studentLink}`);
    } else if (k === 'r') {
      if (activeOnlineUrl) {
        console.log(`[Online] Already connected: ${activeOnlineUrl}`);
      } else {
        console.log('[Online] Checking internet & starting tunnel...');
        void tryConnectOnline();
      }
    }
  });
}

async function main() {
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  const serverReady = await ensureLocalServer();
  if (!serverReady) {
    console.error('Error: Could not start local server on port ' + PORT);
    process.exit(1);
  }

  printBanner();

  if (!browserOpened && !NO_BROWSER) {
    browserOpened = true;
    openUrlInBrowser(LOCAL_URL);
  }

  setupHotkeys();
  await tryConnectOnline();
}

void main();
