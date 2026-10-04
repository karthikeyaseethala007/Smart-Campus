import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function main() {
  const artifactDir = '/Users/karthikeya.s/.gemini/antigravity-ide/brain/22ef5f52-84c8-42d0-93f2-3b0506e3f1da/verification';
  fs.mkdirSync(artifactDir, { recursive: true });

  const chromeUserData = '/tmp/chrome_verification_profile_' + Date.now();
  
  // Launch Chrome with remote debugging
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=' + chromeUserData,
    '--window-size=1440,900',
    '--hide-scrollbars',
    'about:blank'
  ], { stdio: 'ignore' });

  // Wait 1.5s for Chrome to start
  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json/list');
    const pages = await listRes.json();
    const wsUrl = pages[0].webSocketDebuggerUrl;
    
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

    console.log('Navigating to http://localhost:5173/?skipIntro=true ...');
    await send('Page.navigate', { url: 'http://localhost:5173/?skipIntro=true' });
    await new Promise(r => setTimeout(r, 2500));

    const getMetrics = async () => {
      const res = await send('Runtime.evaluate', {
        expression: `({
          scrollY: window.scrollY,
          bodyHeight: document.body.scrollHeight,
          windowHeight: window.innerHeight
        })`,
        returnByValue: true
      });
      return res.result.value;
    };

    const metrics = await getMetrics();
    console.log('Page loaded. Metrics:', metrics);

    const captures = [
      { name: '01_hero_beginning.png', scroll: 0 },
      { name: '02_hero_middle.png', scroll: Math.round(metrics.bodyHeight * 0.08) },
      { name: '03_hero_end.png', scroll: Math.round(metrics.bodyHeight * 0.16) },
      { name: '04_editorial_scene.png', scroll: Math.round(metrics.bodyHeight * 0.28) },
      { name: '05_cinematic_stage.png', scroll: Math.round(metrics.bodyHeight * 0.52) },
      { name: '06_four_pillars.png', scroll: Math.round(metrics.bodyHeight * 0.65) },
      { name: '07_dark_showcase.png', scroll: Math.round(metrics.bodyHeight * 0.78) },
      { name: '08_contact_scene.png', scroll: Math.round(metrics.bodyHeight * 0.88) },
      { name: '09_footer.png', scroll: metrics.bodyHeight }
    ];

    for (const cap of captures) {
      console.log(`Scrolling to ${cap.scroll}px for ${cap.name}...`);
      await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${cap.scroll});` });
      await new Promise(r => setTimeout(r, 800));
      const ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(artifactDir, cap.name), Buffer.from(ss.data, 'base64'));
      console.log(`Saved ${cap.name}`);
    }

    // Capture Menu Closed (at top)
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
    await new Promise(r => setTimeout(r, 600));
    const ssMenuClosed = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, '10_menu_closed.png'), Buffer.from(ssMenuClosed.data, 'base64'));
    console.log('Saved 10_menu_closed.png');

    // Click menu button to open fullscreen menu
    console.log('Opening menu...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[aria-label="Open navigation menu"]');
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
    const ssMenuOpened = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, '11_menu_opened.png'), Buffer.from(ssMenuOpened.data, 'base64'));
    console.log('Saved 11_menu_opened.png');

    ws.close();
    console.log('All verification captures completed successfully!');
  } catch (err) {
    console.error('CDP capture error:', err);
  } finally {
    chromeProcess.kill();
  }
}

main();
