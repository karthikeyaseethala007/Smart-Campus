import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9250;
const OUT_DIR = '/Users/karthikeya.s/Documents/focus/references/mdx-analysis/browser_verification_final';

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
  console.log('Launching Google Chrome with GPU acceleration for Final Browser Verification...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--window-size=1920,1080',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    'http://localhost:5173/?skipIntro=true'
  ]);

  let version = null;
  for (let i = 0; i < 25; i++) {
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
  await sleep(3500);

  const totalHeight = 20618;

  // Exact timeline test targets:
  // heroProgress is [0, 0.24] of master scroll
  // smoothProgress = heroProgress * 0.24
  // targetY = smoothProgress * totalHeight
  const tests = [
    // 1. Globe Hold
    { name: '01_browser_globe_hold', p: 0.000, desc: 'Globe Hold' },
    // 2. Globe 25% deformation
    { name: '02_browser_globe_25pct', p: 0.316, desc: 'Globe 25% deformation (pre-swirl)' },
    // 3. Globe 50% deformation
    { name: '03_browser_globe_50pct', p: 0.345, desc: 'Globe 50% deformation (Peak Energy Burst)' },
    // 4. Globe 75% deformation
    { name: '04_browser_globe_75pct', p: 0.373, desc: 'Globe 75% deformation (filaments coalesce)' },
    // 5. Electricity resolved
    { name: '05_browser_electricity_resolved', p: 0.420, desc: 'Electricity Resolved' },
    // 6. Electricity 25% deformation
    { name: '06_browser_electricity_25pct', p: 0.466, desc: 'Electricity 25% deformation (pre-lift)' },
    // 7. Electricity 50% deformation
    { name: '07_browser_electricity_50pct', p: 0.486, desc: 'Electricity 50% deformation (Upward Vortex Surge)' },
    // 8. Electricity 75% deformation
    { name: '08_browser_electricity_75pct', p: 0.502, desc: 'Electricity 75% deformation (flame formation)' },
    // 9. Fire resolved
    { name: '09_browser_fire_resolved', p: 0.540, desc: 'Fire Resolved' },
    // 10. Fire 25% deformation
    { name: '10_browser_fire_25pct', p: 0.582, desc: 'Fire 25% deformation (shackle pinch)' },
    // 11. Fire 50% deformation
    { name: '11_browser_fire_50pct', p: 0.601, desc: 'Fire 50% deformation (Shackle Arch Curl)' },
    // 12. Fire 75% deformation
    { name: '12_browser_fire_75pct', p: 0.617, desc: 'Fire 75% deformation (tumbler consolidation)' },
    // 13. Lock resolved
    { name: '13_browser_lock_resolved', p: 0.660, desc: 'Lock Resolved' },
    // 14. Lock continuous rotation
    { name: '14_browser_lock_rotating', p: 0.760, desc: 'Lock Steady Rotation' },
    // 15. Hero -> Editorial transition
    { name: '15_browser_hero_editorial_handoff', frac: 0.280, desc: 'Hero -> Editorial 01 Handoff' },
    // 16. Editorial Statement 02
    { name: '16_browser_editorial_statement_02', frac: 0.400, desc: 'Editorial Statement 02' },
    // 17. Four Pillars Central Orbit
    { name: '17_browser_four_pillars_orbit', frac: 0.650, desc: 'Four Pillars Central Orbit' },
    // 18. Backward scrub to Lock
    { name: '18_browser_bwd_lock', p: 0.660, desc: 'Backward Scrub: Lock Resolved' },
    // 19. Backward scrub to Fire Vortex
    { name: '19_browser_bwd_fire_vortex', p: 0.486, desc: 'Backward Scrub: Fire Upward Vortex' },
    // 20. Backward scrub to Electricity Hold
    { name: '20_browser_bwd_electricity_hold', p: 0.420, desc: 'Backward Scrub: Electricity Hold' },
    // 21. Backward scrub to Globe
    { name: '21_browser_bwd_globe_hold', p: 0.000, desc: 'Backward Scrub: Return to Globe Hold' }
  ];

  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    let frac = t.frac !== undefined ? t.frac : (t.p * 0.24);
    const targetY = Math.round(frac * totalHeight);

    console.log(`[${i+1}/${tests.length}] Scrubbing to ${t.name} (${t.desc})...`);
    console.log(`    Target scroll: ${targetY}px (frac: ${frac.toFixed(4)})`);

    await client.send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: ${targetY}, behavior: 'instant' })`
    });

    // Wait for damped lerp and video seek to settle completely
    for (let w = 0; w < 16; w++) {
      await sleep(80);
      const state = await client.send('Runtime.evaluate', {
        expression: `(() => {
          const v = document.querySelector('video');
          return {
            currentTime: v ? v.currentTime : -1,
            seeking: v ? v.seeking : false,
            readyState: v ? v.readyState : 0
          };
        })()`,
        returnByValue: true
      });
      if (!state.result.value.seeking && state.result.value.readyState >= 2 && w >= 10) {
        break;
      }
    }

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
    console.log(`    Settled: video.currentTime = ${telemetry.result.value.currentTime.toFixed(3)}s, scrollY = ${telemetry.result.value.scrollY}`);

    const shot = await client.send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(OUT_DIR, `${t.name}.png`);
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
    console.log(`    Saved: ${outPath}`);
  }

  console.log('=== All 21 Final Browser Frames Captured Successfully ===');
  client.close();
  chrome.kill();
}

main().catch(err => {
  console.error('Final browser recording failed:', err);
  process.exit(1);
});
