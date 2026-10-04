import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function main() {
  const outDir = '/Users/karthikeya.s/Documents/focus/references/mdx-analysis/final-difference-audit/bidirectional_tests';
  fs.mkdirSync(outDir, { recursive: true });

  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=/tmp/chrome-cdp-profile-reverse',
    '--no-first-run',
    '--window-size=1440,900',
    '--hide-scrollbars',
    'about:blank'
  ], { stdio: 'ignore' });

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
    throw new Error('Chrome connection failed');
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

    console.log('Navigating to landing page...');
    await send('Page.navigate', { url: 'http://localhost:5173/?skipIntro=true' });
    await new Promise(r => setTimeout(r, 3500));

    // 1. Initial Globe at scroll 0
    console.log('Step 1: Capture at top (0px)...');
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 0);` });
    await new Promise(r => setTimeout(r, 500));
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, '01_initial_globe.png'), Buffer.from(shot.data, 'base64'));

    // 2. Scroll forward to Peak Morph 1 (Globe -> Electricity at 1439px)
    console.log('Step 2: Scroll FORWARD to Peak Morph 1 (1439px)...');
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 1439);` });
    await new Promise(r => setTimeout(r, 800));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, '02_forward_peak_morph_1.png'), Buffer.from(shot.data, 'base64'));

    // 3. Scroll forward to Electricity Resolve (1685px)
    console.log('Step 3: Scroll FORWARD to Electricity Resolve (1685px)...');
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 1685);` });
    await new Promise(r => setTimeout(r, 800));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, '03_forward_elec_resolve.png'), Buffer.from(shot.data, 'base64'));

    // 4. Scroll BACKWARD to Peak Morph 1 (1439px)
    console.log('Step 4: Scroll BACKWARD to Peak Morph 1 (1439px)...');
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 1439);` });
    await new Promise(r => setTimeout(r, 800));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, '04_reverse_peak_morph_1.png'), Buffer.from(shot.data, 'base64'));

    // 5. Scroll BACKWARD to Globe Start (0px)
    console.log('Step 5: Scroll BACKWARD to Globe Start (0px)...');
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 0);` });
    await new Promise(r => setTimeout(r, 800));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, '05_reverse_globe_start.png'), Buffer.from(shot.data, 'base64'));

    ws.close();
    console.log('=== BIDIRECTIONAL TEST COMPLETED ===');
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    chromeProcess.kill();
  }
}

main();
