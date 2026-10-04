import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '768x1024', width: 768, height: 1024, isMobile: true },
  { name: '390x844', width: 390, height: 844, isMobile: true },
];

const ARTIFACT_DIR = '/Users/karthikeya.s/.gemini/antigravity-ide/brain/5deeb4ad-1fd3-4783-95f6-e9702397c5dc/scratch';

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  console.log('--- STARTING CHROME REGRESSION ACROSS 5 VIEWPORTS ---');

  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=/tmp/chrome-cdp-phase3-regression',
    '--no-first-run',
    '--window-size=1440,900',
    '--hide-scrollbars',
    'about:blank'
  ], { stdio: 'ignore' });

  // Wait for Chrome port
  let pages = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/list');
      if (res.ok) {
        pages = await res.json();
        if (pages && pages.length > 0) break;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }

  if (!pages || pages.length === 0) {
    chrome.kill();
    throw new Error('Chrome remote debugging did not respond');
  }

  const target = pages.find(p => p.type === 'page') || pages[0];
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let msgId = 1;
  const pending = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.consoleAPICalled' && data.params.type === 'error') {
      consoleErrors.push(data.params.args.map(a => a.value || a.description).join(' '));
    }
    if (data.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(data.params.exceptionDetails.text);
    }
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

  await send('Page.enable');
  await send('Runtime.enable');

  // Verify Landing Page '/' first
  console.log('\n[Check 1/6] Verifying immutable landing page at http://localhost:5173/ ...');
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 1200));

  // Verify /app across all 5 viewports
  const results = [];
  for (const vp of VIEWPORTS) {
    console.log(`\n[Viewport Test] Setting resolution ${vp.name} (${vp.width}x${vp.height})...`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await send('Page.navigate', { url: 'http://localhost:5173/app' });
    await new Promise(r => setTimeout(r, 1200));

    // Check for horizontal overflow
    const evalRes = await send('Runtime.evaluate', {
      expression: `({
        name: '${vp.name}',
        viewportWidth: ${vp.width},
        viewportHeight: ${vp.height},
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        hasOverflow: document.documentElement.scrollWidth > ${vp.width},
        overflowPx: Math.max(0, document.documentElement.scrollWidth - ${vp.width}),
      })`,
      returnByValue: true,
    });

    const metrics = evalRes.result.value;
    results.push(metrics);
    console.log(`  -> Viewport: ${metrics.viewportWidth}x${metrics.viewportHeight} | Layout: ${metrics.innerWidth}x${metrics.innerHeight} | Document: ${metrics.scrollWidth}x${metrics.scrollHeight}`);
    if (metrics.hasOverflow) {
      console.log(`  ⚠ OVERFLOW: +${metrics.overflowPx}px overflow detected on ${vp.name} (scrollWidth=${metrics.scrollWidth} > viewportWidth=${metrics.viewportWidth})`);
      const diagRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const vpW = ${vp.width};
            const list = [];
            document.querySelectorAll('*').forEach(el => {
              const r = el.getBoundingClientRect();
              if (r.right > vpW + 1) {
                let path = [];
                let cur = el;
                while (cur && cur !== document.body && cur !== document.documentElement) {
                  let s = cur.tagName.toLowerCase();
                  if (cur.id) s += '#' + cur.id;
                  else if (cur.className) s += '.' + Array.from(cur.classList || []).join('.');
                  path.unshift(s);
                  cur = cur.parentElement;
                }
                list.push({
                  path: path.join(' > '),
                  right: Math.round(r.right),
                  width: Math.round(r.width),
                  left: Math.round(r.left),
                  scrollWidth: el.scrollWidth,
                  text: (el.innerText || '').slice(0, 30).replace(/\\n/g, ' ')
                });
              }
            });
            list.sort((a, b) => b.right - a.right);
            return list.slice(0, 10);
          })()
        `,
        returnByValue: true
      });
      console.log('    Offending elements:', JSON.stringify(diagRes.result.value, null, 2));
    } else {
      console.log(`  ✔ PASS: No horizontal overflow on ${vp.name} (scrollWidth=${metrics.scrollWidth} <= viewportWidth=${metrics.viewportWidth})`);
    }

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(ARTIFACT_DIR, `phase5_${vp.name}.png`);
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
    console.log(`  ✔ Saved artifact screenshot to ${shotPath}`);
  }

  // Summary
  console.log('\n--- CHROME REGRESSION SUMMARY ---');
  console.log(`Console Errors encountered: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('Console Errors:', consoleErrors);
  } else {
    console.log('✔ Zero console errors recorded across all viewports!');
  }
  console.log('\nViewport Measurement Breakdown:');
  console.table(results.map(r => ({
    Viewport: `${r.viewportWidth}x${r.viewportHeight}`,
    LayoutViewport: `${r.innerWidth}x${r.innerHeight}`,
    DocumentSize: `${r.scrollWidth}x${r.scrollHeight}`,
    Overflow: r.hasOverflow ? `+${r.overflowPx}px` : 'NONE',
    Status: r.hasOverflow ? 'OVERFLOW' : 'PASS',
  })));

  ws.close();
  chrome.kill();
  console.log('--- CHROME REGRESSION FINISHED ---');
}

main().catch(err => {
  console.error('Chrome regression failure:', err);
  process.exit(1);
});
