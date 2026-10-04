import { spawn } from 'child_process';
import fs from 'fs';

async function diagnose() {
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=/tmp/diag_prof_' + Date.now(),
    '--window-size=1440,900',
    'about:blank'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json/list');
    const pages = await listRes.json();
    const ws = new WebSocket(pages[0].webSocketDebuggerUrl);

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
    await new Promise(r => setTimeout(r, 2000));

    const checkAtScroll = async (y) => {
      await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${y});` });
      await new Promise(r => setTimeout(r, 500));
      const info = await send('Runtime.evaluate', {
        expression: `(() => {
          const sticky = document.querySelector('.pinned-light-stage');
          const stageRect = sticky ? sticky.getBoundingClientRect() : null;
          const heroWrapper = document.querySelector('.hero-3d-object-wrapper');
          const heroRect = heroWrapper ? heroWrapper.getBoundingClientRect() : null;
          const ed1 = document.getElementById('editorial-scene-one');
          const ed1Rect = ed1 ? ed1.getBoundingClientRect() : null;
          const darkLayer = document.getElementById('dark-takeover-layer');
          const darkRect = darkLayer ? darkLayer.getBoundingClientRect() : null;
          return {
            scrollY: window.scrollY,
            stageTop: stageRect ? stageRect.top : null,
            heroOpacity: heroWrapper ? window.getComputedStyle(heroWrapper).opacity : null,
            ed1Opacity: ed1 ? window.getComputedStyle(ed1).opacity : null,
            darkTop: darkRect ? darkRect.top : null
          };
        })()`,
        returnByValue: true
      });
      console.log(`Scroll ${y}px:`, info.result.value);
    };

    const docHeightRes = await send('Runtime.evaluate', {
      expression: 'document.body.scrollHeight',
      returnByValue: true
    });
    const totalH = docHeightRes.result.value;
    console.log('Total document height:', totalH);

    for (let pct = 0; pct <= 100; pct += 10) {
      const y = Math.round((pct / 100) * (totalH - 900));
      await checkAtScroll(y);
    }

    ws.close();
  } catch (e) {
    console.error('Error:', e);
  } finally {
    chrome.kill();
  }
}

diagnose();
