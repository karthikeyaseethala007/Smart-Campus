import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9240;
const OUT_DIR = '/Users/karthikeya.s/Documents/focus/references/mdx-analysis/browser_journey_frames';

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
  console.log('Spawning Chrome for Browser Journey Recording on port', PORT);
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
    await sleep(400);
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
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('Waiting for initial WebGL canvas and video load...');
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

  const journeySteps = [
    // 1. FORWARD SCRUBBING: HERO DEFORMATION PHASES
    { id: '01_fwd_globe_hold', frac: 0.000, desc: 'Globe Hold (f1)' },
    { id: '02_fwd_globe_rotating', frac: 0.034, desc: 'Globe Pure Rotation (f35)' },
    { id: '03_fwd_globe_pre_distortion', frac: 0.069, desc: 'Globe Pre-distortion (f69)' },
    { id: '04_fwd_globe_to_elec_energy', frac: 0.083, desc: 'Globe->Elec Radial Energy Burst (f83)' },
    { id: '05_fwd_electricity_settle', frac: 0.096, desc: 'Electricity Settle (f96)' },
    { id: '06_fwd_electricity_hold', frac: 0.102, desc: 'Electricity Envelope Hold (f102)' },
    { id: '07_fwd_elec_to_fire_surge', frac: 0.117, desc: 'Elec->Fire Upward Vortex Surge (f116)' },
    { id: '08_fwd_fire_settle', frac: 0.124, desc: 'Fire Flame Settle (f124)' },
    { id: '09_fwd_fire_hold', frac: 0.130, desc: 'Fire Silhouette Hold (f130)' },
    { id: '10_fwd_fire_to_lock_arch', frac: 0.144, desc: 'Fire->Lock Shackle Arch Curl (f144)' },
    { id: '11_fwd_lock_settle', frac: 0.152, desc: 'Lock Padlock Settle (f152)' },
    { id: '12_fwd_lock_rotating', frac: 0.173, desc: 'Lock Steady Rotation (f173)' },
    // 2. HERO TO EDITORIAL HANDOFF
    { id: '13_fwd_hero_editorial_handoff', frac: 0.280, desc: 'Hero -> Editorial 01 Handoff' },
    { id: '14_fwd_editorial_statement_02', frac: 0.400, desc: 'Editorial Statement 02' },
    { id: '15_fwd_cinematic_stage', frac: 0.530, desc: 'Cinematic Stage Overlay' },
    { id: '16_fwd_four_pillars_orbit', frac: 0.650, desc: 'Four Pillars Central Orbit' },
    { id: '17_fwd_dark_takeover_showcase', frac: 0.780, desc: 'Dark Takeover & Capability Showcase' },
    // 3. BACKWARD SCRUBBING VERIFICATION
    { id: '18_bwd_to_four_pillars', frac: 0.650, desc: 'Backward Scrub: Four Pillars' },
    { id: '19_bwd_to_lock_settle', frac: 0.152, desc: 'Backward Scrub: Lock Padlock' },
    { id: '20_bwd_to_fire_vortex', frac: 0.117, desc: 'Backward Scrub: Fire Upward Surge' },
    { id: '21_bwd_to_electricity_hold', frac: 0.102, desc: 'Backward Scrub: Electricity Hold' },
    { id: '22_bwd_return_to_globe', frac: 0.000, desc: 'Backward Scrub: Return to Globe Hold' }
  ];

  for (let i = 0; i < journeySteps.length; i++) {
    const step = journeySteps[i];
    const targetY = Math.round(step.frac * totalHeight);
    console.log(`[${i+1}/${journeySteps.length}] Scrubbing to ${step.id} (${step.desc})...`);

    // Perform smooth multi-step scroll so physics and damping catch up cleanly
    await client.send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: ${targetY}, behavior: 'instant' })`
    });

    // Wait for video seek and WebGL canvas paint
    await sleep(650);

    const telemetry = await client.send('Runtime.evaluate', {
      expression: `(() => {
        const v = document.querySelector('video');
        return {
          currentTime: v ? v.currentTime : -1,
          scrollY: window.scrollY
        };
      })()`,
      returnByValue: true
    });
    console.log(`    State: video.currentTime = ${telemetry.result.value.currentTime.toFixed(3)}s, scrollY = ${telemetry.result.value.scrollY}`);

    const shot = await client.send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(OUT_DIR, `${step.id}.png`);
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
    console.log(`    Saved: ${outPath}`);
  }

  console.log('=== All 22 Journey Frames Captured Successfully ===');
  client.close();
  chrome.kill();
}

main().catch(err => {
  console.error('Browser journey capture failed:', err);
  process.exit(1);
});
