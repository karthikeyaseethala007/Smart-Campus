import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = '/Users/karthikeya.s/.gemini/antigravity-ide/brain/22ef5f52-84c8-42d0-93f2-3b0506e3f1da/verification';
fs.mkdirSync(outDir, { recursive: true });

async function capture() {
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9229',
    '--user-data-dir=/tmp/cap_prof_' + Date.now(),
    '--window-size=1440,900',
    '--hide-scrollbars',
    'about:blank'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch('http://127.0.0.1:9229/json/list');
    const pages = await listRes.json();
    const pageTarget = pages.find(p => p.type === 'page') || pages[0];
    console.log('Connecting to page:', pageTarget.title || pageTarget.url);
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let id = 1;
    const send = (m, p = {}) => new Promise((res, rej) => {
      const cur = id++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === cur) {
          ws.removeEventListener('message', handler);
          if (d.error) rej(d.error);
          else res(d.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: cur, method: m, params: p }));
    });

    await new Promise(r => ws.onopen = r);
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('Navigating to http://localhost:5173/?skipIntro=true ...');
    await send('Page.navigate', { url: 'http://localhost:5173/?skipIntro=true' });
    await new Promise(r => setTimeout(r, 2500));

    const totalScroll = await send('Runtime.evaluate', {
      expression: 'document.documentElement.scrollHeight - window.innerHeight',
      returnByValue: true
    });
    const maxScroll = totalScroll.result.value;
    console.log('Total scrollable height:', maxScroll);

    const states = [
      { id: '01_hero_beginning', p: 0.00, desc: 'Hero Beginning (Globe State)' },
      { id: '02_hero_middle', p: 0.10, desc: 'Hero Middle (Electricity Morph)' },
      { id: '03_hero_end', p: 0.20, desc: 'Hero End (Lock State)' },
      { id: '04_editorial_scene', p: 0.29, desc: 'Editorial Statement 01' },
      { id: '05_cinematic_stage', p: 0.53, desc: 'Cinematic Stage' },
      { id: '06_four_pillars_scene', p: 0.65, desc: 'Four Pillars Floating System' },
      { id: '07_dark_showcase', p: 0.78, desc: 'Dark Visual Showcase' },
      { id: '08_contact_scene', p: 0.88, desc: 'Contact / Command Center Entry' },
      { id: '09_footer', p: 1.00, desc: 'Massive Editorial Footer' },
      { id: '10_menu_closed', p: 0.00, desc: 'Menu Closed (Header with Minimal Trigger)' }
    ];

    for (const s of states) {
      const y = Math.round(s.p * maxScroll);
      console.log(`[State ${s.id}] Scrolling to p=${s.p} (y=${y}px)...`);
      await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${y});` });
      // Allow spring dampening to settle
      await new Promise(r => setTimeout(r, 1200));

      const debug = await send('Runtime.evaluate', {
        expression: `({
          scrollY: window.scrollY,
          videoTime: document.querySelector('video')?.currentTime,
          videoReady: document.querySelector('video')?.readyState
        })`,
        returnByValue: true
      });
      console.log(`  Actual state: scrollY=${debug.result.value?.scrollY}, videoTime=${debug.result.value?.videoTime}`);

      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(shot.data, 'base64');
      fs.writeFileSync(path.join(outDir, `${s.id}.png`), buf);
      console.log(`  Saved ${s.id}.png (${buf.length} bytes)`);
    }

    // Capture 11_menu_opened
    console.log('Capturing 11_menu_opened...');
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
    await new Promise(r => setTimeout(r, 600));

    // Click menu trigger button
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[aria-label="Open navigation menu"]');
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true
    });
    // Wait for fullscreen menu entrance animation
    await new Promise(r => setTimeout(r, 1000));

    const shotMenu = await send('Page.captureScreenshot', { format: 'png' });
    const bufMenu = Buffer.from(shotMenu.data, 'base64');
    fs.writeFileSync(path.join(outDir, '11_menu_opened.png'), bufMenu);
    console.log(`Saved 11_menu_opened.png (${bufMenu.length} bytes)`);

    ws.close();
    console.log('All 11 states captured successfully!');
  } catch (e) {
    console.error('Capture error:', e);
  } finally {
    chrome.kill();
  }
}

capture();
