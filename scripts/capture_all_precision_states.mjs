import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function main() {
  const outDir = '/Users/karthikeya.s/Documents/focus/references/mdx-analysis/final-difference-audit/current_precision_captures';
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Launching Headless Chrome with native Metal GPU acceleration...');
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=/tmp/chrome-cdp-profile-precision',
    '--no-first-run',
    '--window-size=1440,900',
    '--hide-scrollbars',
    'about:blank'
  ], { stdio: 'ignore' });

  // Give Chrome time to bind port
  let pages = null;
  for (let i = 0; i < 20; i++) {
    try {
      const listRes = await fetch('http://127.0.0.1:9222/json/list');
      if (listRes.ok) {
        pages = await listRes.json();
        if (pages && pages.length > 0) break;
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 250));
  }

  if (!pages || pages.length === 0) {
    throw new Error('Failed to connect to Chrome remote debugging port 9222 after retries');
  }

  try {
    const pageTarget = pages.find(p => p.type === 'page') || pages[0];
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let msgId = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };

    await new Promise(r => ws.onopen = r);

    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Runtime.enable');
    await send('Page.enable');
    await send('DOM.enable');

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('Navigating to http://localhost:5173/?skipIntro=true ...');
    await send('Page.navigate', { url: 'http://localhost:5173/?skipIntro=true' });

    // Wait for hydration and WebGL video ready
    await new Promise(r => setTimeout(r, 3500));

    const maxScrollRes = await send('Runtime.evaluate', {
      expression: `document.documentElement.scrollHeight - window.innerHeight`,
      returnByValue: true
    });
    const maxScroll = maxScrollRes.result.value;
    console.log('Total Scrollable Distance (maxScroll):', maxScroll, 'px');

    const layoutRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const getTop = (id) => {
          const el = document.getElementById(id);
          if (!el) return null;
          return Math.round(el.getBoundingClientRect().top + window.scrollY);
        };
        return {
          darkShowcaseTop: getTop('dark-showcase'),
          contactTop: getTop('contact-entry'),
          prefooterTop: getTop('dark-prefooter'),
          footerTop: getTop('mdx-footer'),
        };
      })()`,
      returnByValue: true
    });
    const L = layoutRes.result.value || {};

    // Defined captures covering ALL required states and intermediate morphs
    const captures = [
      // Hero States & Intermediate Morphs
      { name: '01_hero_start', normP: 0.000 },
      { name: '01b_hero_25pct', normP: 0.060 },
      { name: '02_hero_morph_01_start', normP: 0.069 },
      { name: '02_hero_morph_01_peak', normP: 0.082 },
      { name: '02_hero_electricity_resolve', normP: 0.096 },
      { name: '02_hero_electricity_settle', normP: 0.103 },
      { name: '02b_hero_50pct', normP: 0.120 },
      { name: '02c_hero_morph_02_start', normP: 0.108 },
      { name: '02c_hero_morph_02_peak', normP: 0.116 },
      { name: '02c_hero_fire_resolve', normP: 0.124 },
      { name: '02c_hero_fire_settle', normP: 0.131 },
      { name: '02d_hero_morph_03_start', normP: 0.135 },
      { name: '02d_hero_morph_03_peak', normP: 0.144 },
      { name: '02d_hero_lock_resolve', normP: 0.152 },
      { name: '02d_hero_lock_settle', normP: 0.162 },
      { name: '02e_hero_75pct', normP: 0.180 },
      { name: '03_hero_transition', normP: 0.230 },
      { name: '03b_hero_end', normP: 0.240 },

      // Subsequent Scenes
      { name: '04_editorial_01', normP: 0.280 },
      { name: '05_editorial_02', normP: 0.410 },
      { name: '06_cinematic', normP: 0.540 },
      { name: '07_floating', normP: 0.660 },
      { name: '08_dark_takeover', normP: 0.725 },
      { name: '09_showcase', normP: 0.785, absY: L.darkShowcaseTop },
      { name: '10_contact', normP: 0.890, absY: L.contactTop },
      { name: '11_prefooter', normP: 0.950, absY: L.prefooterTop },
      { name: '12_footer', normP: 1.000, absY: maxScroll },
    ];

    for (const c of captures) {
      const scrollY = c.absY !== undefined && c.absY !== null ? c.absY : Math.round(c.normP * maxScroll);
      console.log(`Capturing ${c.name} at scrollY: ${scrollY}px (progress: ${(scrollY/maxScroll).toFixed(3)})...`);
      
      await send('Runtime.evaluate', {
        expression: `window.scrollTo({ top: ${scrollY}, behavior: 'instant' });`
      });
      // Wait for spring damping and WebGL render loop to complete
      await new Promise(r => setTimeout(r, 700));

      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(shot.data, 'base64');
      fs.writeFileSync(path.join(outDir, `${c.name}.png`), buf);
      console.log(` Saved ${c.name}.png`);
    }

    ws.close();
    console.log('=== ALL SCREENSHOTS CAPTURED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    chromeProcess.kill();
  }
}

main();
