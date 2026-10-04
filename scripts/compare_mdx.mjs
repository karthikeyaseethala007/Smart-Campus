import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function main() {
  const compDir = '/Users/karthikeya.s/Documents/focus/references/mdx-analysis/comparisons';
  const auditDir = '/Users/karthikeya.s/Documents/focus/references/mdx-analysis/final-difference-audit';
  
  if (!fs.existsSync(compDir)) {
    fs.mkdirSync(compDir, { recursive: true });
  }
  if (!fs.existsSync(auditDir)) {
    fs.mkdirSync(auditDir, { recursive: true });
  }

  console.log('Launching Headless Chrome with native Metal GPU acceleration...');
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=/tmp/chrome-cdp-profile',
    '--no-first-run',
    '--window-size=1440,900',
    '--hide-scrollbars',
    'about:blank'
  ], { stdio: 'ignore' });

  // Give Chrome time to bind port with retry loop
  let pages = null;
  for (let i = 0; i < 20; i++) {
    try {
      const listRes = await fetch('http://127.0.0.1:9222/json/list');
      if (listRes.ok) {
        pages = await listRes.json();
        if (pages && pages.length > 0) break;
      }
    } catch (e) {
      // retry
    }
    await new Promise(r => setTimeout(r, 250));
  }

  if (!pages || pages.length === 0) {
    throw new Error('Failed to connect to Chrome remote debugging port 9222 after retries');
  }

  try {
    const pageTarget = pages.find(p => p.type === 'page') || pages[0];
    console.log('Connecting to page target:', pageTarget.id, pageTarget.url);
    const wsUrl = pageTarget.webSocketDebuggerUrl;
    
    const ws = new WebSocket(wsUrl);
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

    console.log('Configuring desktop viewport metrics (1440x900)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('Navigating to http://localhost:5173/?skipIntro=true ...');
    await send('Page.navigate', { url: 'http://localhost:5173/?skipIntro=true' });

    // Wait for hydration and video load
    await new Promise(r => setTimeout(r, 3000));

    // Measure total scrollable range
    const maxScrollRes = await send('Runtime.evaluate', {
      expression: `document.documentElement.scrollHeight - window.innerHeight`,
      returnByValue: true
    });
    const maxScroll = maxScrollRes.result.value;
    console.log('Total Scrollable Distance (maxScroll):', maxScroll, 'px');

    // Measure exact positions of sections
    const layout = await send('Runtime.evaluate', {
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
    const L = layout.result.value || {};
    console.log('Layout positions:', L);

    // Normalized Master Timeline Targets
    const targets = [
      { name: '01_hero', scrollY: 0, folder1: '01_hero', folder2: '01-hero' },
      { name: '02_editorial_1', scrollY: Math.round(maxScroll * 0.25), folder1: '02_editorial_1', folder2: '02-editorial-1' },
      { name: '03_editorial_2', scrollY: Math.round(maxScroll * 0.38), folder1: '03_editorial_2', folder2: '03-editorial-2' },
      { name: '04_cinematic', scrollY: Math.round(maxScroll * 0.51), folder1: '04_cinematic', folder2: '04-cinematic' },
      { name: '05_floating', scrollY: Math.round(maxScroll * 0.65), folder1: '05_floating', folder2: '05-floating' },
      { name: '06_dark_showcase', scrollY: L.darkShowcaseTop !== null ? L.darkShowcaseTop : Math.round(maxScroll * 0.77), folder1: '06_dark_showcase', folder2: '06-dark-showcase' },
      { name: '07_contact', scrollY: L.contactTop !== null ? L.contactTop : Math.round(maxScroll * 0.89), folder1: '07_contact', folder2: '07-contact' },
      { name: '08_prefooter', scrollY: L.prefooterTop !== null ? L.prefooterTop : Math.round(maxScroll * 0.955), folder1: '08_prefooter', folder2: '08-dark-prefooter' },
      { name: '09_footer', scrollY: maxScroll, folder1: '09_footer', folder2: '09-footer' },
    ];

    for (const t of targets) {
      const scrollY = t.scrollY;
      console.log(`Capturing ${t.name} (scrollY: ${scrollY}px)...`);
      await send('Runtime.evaluate', {
        expression: `window.scrollTo({ top: ${scrollY}, behavior: 'instant' });`
      });
      // Allow transforms & video seeking to update
      await new Promise(r => setTimeout(r, 900));

      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(shot.data, 'base64');

      // Save to comparisons
      const outPath = path.join(compDir, `smart_campus_${t.name}.png`);
      fs.writeFileSync(outPath, buf);

      // Save to both folder naming conventions
      const dir1 = path.join(auditDir, t.folder1);
      const dir2 = path.join(auditDir, t.folder2);
      fs.mkdirSync(dir1, { recursive: true });
      fs.mkdirSync(dir2, { recursive: true });

      fs.writeFileSync(path.join(dir1, 'current_frame.png'), buf);
      fs.writeFileSync(path.join(dir2, 'current_frame.png'), buf);
      fs.writeFileSync(path.join(dir1, 'current_implementation.png'), buf);
      fs.writeFileSync(path.join(dir2, 'current_implementation.png'), buf);

      console.log(`Saved ${t.name} frames successfully.`);
    }

    // Capture Mobile (390x844) Viewport
    console.log('Capturing mobile viewports (390x844)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await send('Runtime.evaluate', { expression: `window.scrollTo({ top: 0, behavior: 'instant' });` });
    await new Promise(r => setTimeout(r, 600));
    const mobileHero = await send('Page.captureScreenshot', { format: 'png' });
    // Capture Menu
    console.log('Capturing navigation menu (1440x900)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[aria-label="Open navigation menu"]');
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 800));
    const menuShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(compDir, 'smart_campus_10_menu.png'), Buffer.from(menuShot.data, 'base64'));
    const menuDir = path.join(auditDir, '10_menu');
    fs.mkdirSync(menuDir, { recursive: true });
    fs.writeFileSync(path.join(menuDir, 'current_frame.png'), Buffer.from(menuShot.data, 'base64'));
    console.log('Saved: smart_campus_10_menu.png');

    ws.close();
    console.log('All visual captures completed!');
  } catch (e) {
    console.error('Error during capture:', e);
  } finally {
    chromeProcess.kill();
  }
}

main();
