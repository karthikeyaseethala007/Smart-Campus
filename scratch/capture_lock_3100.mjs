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

  await send('Runtime.evaluate', { expression: `window.scrollTo(0, 3100);` });
  await new Promise((r) => setTimeout(r, 600));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(shot.result.data, 'base64');
  const outPath = `/Users/karthikeya.s/Documents/focus/scratch/verified_lock_3100.png`;
  fs.writeFileSync(outPath, buffer);
  console.log(`Saved lock at Y=3100 to ${outPath}`);

  ws.close();
}

main().catch(console.error);
