import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9224;
const OUT_DIR = '/Users/karthikeya.s/Documents/focus/references/mdx-analysis/browser_verification';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

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
    'http://localhost:5173/?skipIntro=true'
  ]);

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

  const list = await httpGet(`http://127.0.0.1:${PORT}/json/list`);
  const pageTarget = list.find(t => t.type === 'page');
  console.log('Target page connected:', pageTarget.url);

  const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Runtime.enable');

  console.log('Waiting for WebGL canvas and video to load...');
  await sleep(4000);

  const scrollInfo = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const v = document.querySelector('video');
      const c = document.querySelector('canvas');
      return {
        total,
        videoReady: v ? v.readyState : 0,
        videoDuration: v ? v.duration : 0,
        canvasWidth: c ? c.width : 0,
        canvasHeight: c ? c.height : 0
      };
    })()`,
    returnByValue: true
  });
  console.log('Page telemetry:', scrollInfo.result.value);

  const totalHeight = scrollInfo.result.value.total || 19134;

  // Exact MDX milestones mapped through heroProgress [0, 0.24]
  const milestones = [
    { name: '01_browser_globe_hold', frac: 0.000, desc: 'Globe Hold (f1)' },
    { name: '02_browser_globe_rotating', frac: 0.034, desc: 'Globe Pure Rotation (f35)' },
    { name: '03_browser_globe_pre_distortion', frac: 0.069, desc: 'Globe Pre-distortion (f69)' },
    { name: '04_browser_globe_elec_energy_expansion', frac: 0.083, desc: 'Globe->Elec Radial Energy Burst (f83)' },
    { name: '05_browser_electricity_settle', frac: 0.096, desc: 'Electricity Settle (f96)' },
    { name: '06_browser_electricity_hold', frac: 0.102, desc: 'Electricity Envelope Hold (f102)' },
    { name: '07_browser_elec_fire_vortex_surge', frac: 0.117, desc: 'Elec->Fire Upward Vortex Surge (f116)' },
    { name: '08_browser_fire_settle', frac: 0.124, desc: 'Fire Flame Settle (f124)' },
    { name: '09_browser_fire_hold', frac: 0.130, desc: 'Fire Silhouette Hold (f130)' },
    { name: '10_browser_fire_lock_arch_curl', frac: 0.144, desc: 'Fire->Lock Shackle Arch Curl (f144)' },
    { name: '11_browser_lock_settle', frac: 0.152, desc: 'Lock Padlock Settle (f152)' },
    { name: '12_browser_lock_hold_rotating', frac: 0.173, desc: 'Lock Steady Rotation (f173)' },
    { name: '13_browser_editorial_handoff', frac: 0.280, desc: 'Hero to Editorial Transition (f240)' },
    { name: '14_browser_editorial_statement_02', frac: 0.400, desc: 'Editorial Statement 02' },
    { name: '15_browser_four_pillars_orbit', frac: 0.650, desc: 'Four Pillars Central Orbit' },
    // Backward scrubbing verification
    { name: '16_browser_bwd_lock_arch_curl', frac: 0.144, desc: 'Backward Scrub: Shackle Arch Curl' },
    { name: '17_browser_bwd_electricity_hold', frac: 0.102, desc: 'Backward Scrub: Electricity Hold' },
    { name: '18_browser_bwd_globe_return', frac: 0.000, desc: 'Backward Scrub: Return to Globe Hold' }
  ];

  for (let i = 0; i < milestones.length; i++) {
    const ms = milestones[i];
    const targetY = Math.round(ms.frac * totalHeight);
    console.log(`[${i+1}/${milestones.length}] Scrubbing to ${ms.name} (${ms.desc})...`);
    console.log(`    frac=${ms.frac.toFixed(4)}, targetY=${targetY}px`);

    await client.send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: ${targetY}, behavior: 'instant' })`
    });

    // Wait 500ms for video seek & requestAnimationFrame WebGL canvas draw
    await sleep(500);

    const frameState = await client.send('Runtime.evaluate', {
      expression: `(() => {
        const v = document.querySelector('video');
        return {
          currentTime: v ? v.currentTime : -1,
          scrollY: window.scrollY
        };
      })()`,
      returnByValue: true
    });
    console.log(`    State: video.currentTime = ${frameState.result.value.currentTime.toFixed(3)}s`);

    const shot = await client.send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(OUT_DIR, `${ms.name}.png`);
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
    console.log(`    Saved: ${outPath}`);
  }

  console.log('All browser verification frames recorded successfully!');
  client.close();
  chrome.kill();
}

main().catch(err => {
  console.error('Browser timeline verification failed:', err);
  process.exit(1);
});
