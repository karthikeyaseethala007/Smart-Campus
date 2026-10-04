import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function main() {
  const artifactDir = '/Users/karthikeya.s/.gemini/antigravity-ide/brain/1a46610e-7e04-44a3-b2aa-863c1ab8dfea';
  
  // Launch Chrome with remote debugging
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless',
    '--remote-debugging-port=9222',
    '--window-size=1440,900',
    '--disable-gpu',
    'about:blank'
  ], { stdio: 'ignore' });

  // Wait 1s for Chrome to start
  await new Promise(r => setTimeout(r, 1000));

  try {
    // Get websocket target
    const versionRes = await fetch('http://127.0.0.1:9222/json/version');
    const versionData = await versionRes.json();
    console.log('Connected to Chrome:', versionData['Browser']);

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
      if (data.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', data.params.type, data.params.args.map(a => a.value || a.description).join(' '));
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

    // Wait for load
    await new Promise(r => setTimeout(r, 2000));

    // Evaluate scrollY and inspect DOM
    const inspectResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const hero = document.getElementById('hero-scene');
        const p1 = hero ? hero.querySelectorAll('div')[5] : null;
        return {
          scrollY: window.scrollY,
          heroRect: hero ? hero.getBoundingClientRect() : null,
          bodyHeight: document.body.scrollHeight,
          windowHeight: window.innerHeight
        };
      })()`,
      returnByValue: true
    });
    console.log('Page inspection:', JSON.stringify(inspectResult.result.value, null, 2));

    // Capture screenshot at top (scroll = 0)
    const ss0 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'cdp_scroll_0.png'), Buffer.from(ss0.data, 'base64'));
    console.log('Saved cdp_scroll_0.png');

    // Scroll to 500px
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 500);' });
    await new Promise(r => setTimeout(r, 600));
    const ss500 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'cdp_scroll_500.png'), Buffer.from(ss500.data, 'base64'));
    console.log('Saved cdp_scroll_500.png');

    // Scroll to 1200px
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 1200);' });
    await new Promise(r => setTimeout(r, 600));
    const ss1200 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'cdp_scroll_1200.png'), Buffer.from(ss1200.data, 'base64'));
    console.log('Saved cdp_scroll_1200.png');

    // Scroll to 2200px (Editorial Scene 1)
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 2200);' });
    await new Promise(r => setTimeout(r, 600));
    const ss2200 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'cdp_scroll_2200.png'), Buffer.from(ss2200.data, 'base64'));
    console.log('Saved cdp_scroll_2200.png');

    // Scroll to 4000px (Cinematic System Experience / Pillars)
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 4000);' });
    await new Promise(r => setTimeout(r, 600));
    const ss4000 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'cdp_scroll_4000.png'), Buffer.from(ss4000.data, 'base64'));
    console.log('Saved cdp_scroll_4000.png');

    // Scroll to 6500px (Capabilities & Operations)
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 6500);' });
    await new Promise(r => setTimeout(r, 600));
    const ss6500 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'cdp_scroll_6500.png'), Buffer.from(ss6500.data, 'base64'));
    console.log('Saved cdp_scroll_6500.png');

    // Scroll to bottom (Command Center & Footer)
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, document.body.scrollHeight);' });
    await new Promise(r => setTimeout(r, 600));
    const ssBottom = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'cdp_scroll_bottom.png'), Buffer.from(ssBottom.data, 'base64'));
    console.log('Saved cdp_scroll_bottom.png');

    ws.close();
  } catch (err) {
    console.error('CDP error:', err);
  } finally {
    chromeProcess.kill();
  }
}

main();
