import fs from 'fs';

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  let page = pages.find((p) => p.type === 'page');

  if (!page) {
    const putRes = await fetch('http://127.0.0.1:9222/json/new', { method: 'PUT' });
    page = await putRes.json();
  }

  const pageWsUrl = page.webSocketDebuggerUrl;
  console.log('Connecting to page ws:', pageWsUrl);

  const ws = new WebSocket(pageWsUrl);

  let idCounter = 1;
  const callbacks = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params);
    }
    if (msg.id && callbacks.has(msg.id)) {
      const cb = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      cb(msg);
    }
  };

  const send = (method, params = {}) => {
    return new Promise((resolve) => {
      const id = idCounter++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await new Promise((r) => (ws.onopen = r));

  await send('Page.enable');
  await send('Runtime.enable');

  console.log('Navigating to http://localhost:5173/?skipIntro=true');
  await send('Page.navigate', { url: 'http://localhost:5173/?skipIntro=true' });

  console.log('Waiting 2s for page and frames to load...');
  await new Promise((r) => setTimeout(r, 2000));

  const scrollPositions = [
    { name: '01_globe', y: 0 },
    { name: '02_globe_to_elec', y: 600 },
    { name: '03_electricity', y: 1100 },
    { name: '04_fire', y: 1550 },
    { name: '05_lock', y: 2100 },
  ];

  for (const item of scrollPositions) {
    await send('Runtime.evaluate', {
      expression: `window.scrollTo(0, ${item.y});`,
    });
    // Wait for frame scrubbing RAF loop
    await new Promise((r) => setTimeout(r, 500));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.result.data, 'base64');
    const outPath = `/Users/karthikeya.s/Documents/focus/scratch/cdp_scroll_${item.name}.png`;
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot for ${item.name} at Y=${item.y} (${buffer.length} bytes) to ${outPath}`);
  }

  console.log('Console errors:', consoleErrors.length);
  for (const ce of consoleErrors) {
    console.error('Console error:', ce.args);
  }

  ws.close();
}

main().catch(console.error);
