import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9222;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (msg) => {
        const res = JSON.parse(msg.data);
        if (res.id && this.callbacks.has(res.id)) {
          const { resolve, reject } = this.callbacks.get(res.id);
          this.callbacks.delete(res.id);
          if (res.error) reject(res.error);
          else resolve(res.result);
        }
      };
    });
  }

  send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function main() {
  console.log('Spawning Chrome with remote debugging on port', PORT);
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--window-size=1920,1080',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-gpu',
    'http://localhost:5173/'
  ]);

  // Wait for Chrome remote debugging to be responsive
  let version = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      version = await httpGet(`http://127.0.0.1:${PORT}/json/version`);
      if (version && version.webSocketDebuggerUrl) break;
    } catch (e) {}
  }

  if (!version) {
    chrome.kill();
    throw new Error('Chrome did not respond on debugging port');
  }

  console.log('Chrome connected. Version:', version['Browser']);

  // Find page target
  const list = await httpGet(`http://127.0.0.1:${PORT}/json/list`);
  const pageTarget = list.find(t => t.type === 'page');
  console.log('Target page found:', pageTarget.url);

  const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await client.connect();
  console.log('Connected to Page WebSocket!');

  // Enable Page & Runtime
  await client.send('Page.enable');
  await client.send('Runtime.enable');

  // Wait 2.5s for page to load
  await sleep(2500);

  // Click skip intro
  const skipResult = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const skipBtn = btns.find(b => b.textContent.includes('SKIP INTRO'));
      if (skipBtn) {
        skipBtn.click();
        return 'Clicked SKIP INTRO';
      }
      return 'No skip button found';
    })()`
  });
  console.log('Skip intro result:', skipResult.result.value);

  await sleep(1500);

  // Capture screenshot
  const shot = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('test_cdp_shot.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved test_cdp_shot.png!');

  client.close();
  chrome.kill();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
