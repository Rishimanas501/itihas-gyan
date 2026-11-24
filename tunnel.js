import { spawn, exec } from 'child_process';
import http from 'http';

console.log('\n======================================================');
echoStep('Cloudflare Tunnel ସଂଯୋଗ ହେଉଛି (Connecting)...');
console.log('======================================================\n');

function echoStep(msg) {
  console.log(`[INFO] ${msg}`);
}

const child = spawn('.\\cloudflared.exe', ['tunnel', '--url', 'http://localhost:3000'], {
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe']
});

let found = false;

function scanOutput(chunk) {
  const text = chunk.toString();
  const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match && !found) {
    found = true;
    const url = match[0];

    // Inform local server
    try {
      const payload = JSON.stringify({ url });
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: 3000,
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
    } catch (e) {}

    const studentUrl = `${url}/?view=student`;

    // Copy student join link to clipboard via powershell
    try {
      exec(`powershell -Command "Set-Clipboard -Value '${studentUrl}'"`);
    } catch (e) {}

    console.log('\n================================================================');
    console.log('🎉 WHATSAPP ଲାଇଭ୍ ଲିଙ୍କ୍ ପ୍ରସ୍ତୁତ ଏବଂ COPY ହୋଇଗଲା (COPIED)!');
    console.log('================================================================');
    console.log(`👉 ଛାତ୍ରଙ୍କ ପାଇଁ WhatsApp Link:  ${studentUrl}`);
    console.log('================================================================');
    console.log('✅ ଏହି ଲିଙ୍କ୍‌କୁ WhatsApp ରେ ପଠାନ୍ତୁ (ଛାତ୍ର ସିଧାସଳଖ ଯୋଡ଼ିହେବେ!)');
    console.log('⚠️ ଏହି Window କୁ ବନ୍ଦ କରନ୍ତୁ ନାହିଁ, Minimize କରି ରଖନ୍ତୁ।\n');
  }
}

child.stdout.on('data', scanOutput);
child.stderr.on('data', scanOutput);

child.on('close', (code) => {
  console.log(`Tunnel closed (Code ${code})`);
});
