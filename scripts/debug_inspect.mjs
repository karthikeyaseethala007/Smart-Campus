import { spawn } from 'child_process';

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new',
  '--remote-debugging-port=9223',
  '--window-size=1440,900',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9223/json/list')).json();
    const ws = new WebSocket(list[0].webSocketDebuggerUrl);
    ws.onopen = async () => {
      let id = 1;
      const send = (m, p = {}) => new Promise(r => {
        const i = id++;
        const h = (e) => {
          const d = JSON.parse(e.data);
          if (d.id === i) {
            ws.removeEventListener('message', h);
            r(d.result);
          }
        };
        ws.addEventListener('message', h);
        ws.send(JSON.stringify({ id: i, method: m, params: p }));
      });

      await send('Page.enable');
      await send('Runtime.enable');
      await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
      await send('Page.navigate', { url: 'http://localhost:5173/?skipIntro=true' });
      await new Promise(r => setTimeout(r, 2000));

      await send('Runtime.evaluate', { expression: `
        document.documentElement.scrollTop = 2400;
        document.body.scrollTop = 2400;
        window.scrollTo(0, 2400);
      ` });
      await new Promise(r => setTimeout(r, 800));

      const res = await send('Runtime.evaluate', {
        expression: `(() => {
          const h1 = document.querySelector('h1');
          const hero = document.getElementById('hero-scene');
          return {
            bodyScrollTop: document.body.scrollTop,
            docScrollTop: document.documentElement.scrollTop,
            windowPageYOffset: window.pageYOffset,
            windowInnerHeight: window.innerHeight,
            bodyScrollHeight: document.body.scrollHeight,
            scrollY: window.scrollY
          };
        })()`,
        returnByValue: true
      });
      console.log('DOM INSPECTION RESULT:', JSON.stringify(res.result.value, null, 2));
      chrome.kill();
      process.exit(0);
    };
  } catch (e) {
    console.error(e);
    chrome.kill();
    process.exit(1);
  }
}, 1200);
