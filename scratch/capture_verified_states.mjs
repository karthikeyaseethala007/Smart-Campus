import fs from 'fs';

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const page = pages.find((p) => p.type === 'page');

  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let idCounter = 1;
  const callbacks = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg);
      callbacks.delete(msg.id);
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

  console.log('Reloading page to pick up updated component...');
  await send('Page.navigate', { url: 'http://localhost:5173/?skipIntro=true' });
  await new Promise((r) => setTimeout(r, 2000));

  const scrollPositions = [
    { name: '01_globe_state', y: 0 },
    { name: '02_electricity_state', y: 1050 },
    { name: '03_fire_state', y: 2150 },
    { name: '04_lock_state', y: 3250 },
  ];

  for (const item of scrollPositions) {
    await send('Runtime.evaluate', {
      expression: `window.scrollTo(0, ${item.y});`,
    });
    // Wait for frame scrubbing RAF loop
    await new Promise((r) => setTimeout(r, 600));

    const checkRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const poster = document.querySelector('img[src="/assets/hero/poster.png"]');
          return JSON.stringify({
            posterOpacity: poster ? window.getComputedStyle(poster).opacity : null,
          });
        })()
      `,
    });
    console.log(`State at Y=${item.y}:`, checkRes.result.result.value);

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.result.data, 'base64');
    const outPath = `/Users/karthikeya.s/Documents/focus/scratch/verified_${item.name}.png`;
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved ${item.name} to ${outPath}`);
  }

  ws.close();
}

main().catch(console.error);
