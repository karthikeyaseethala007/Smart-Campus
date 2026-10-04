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
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = idCounter++;
    callbacks.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await new Promise((r) => (ws.onopen = r));

  for (const y of [0, 600, 1100, 1550, 2100, 3000, 3300]) {
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: ${y}, behavior: 'instant' });`,
    });
    await new Promise((r) => setTimeout(r, 600));

    const evalRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const canvas = document.querySelector('canvas');
          const poster = document.querySelector('img[src="/assets/hero/poster.png"]');
          return JSON.stringify({
            y: ${y},
            posterOpacity: poster ? window.getComputedStyle(poster).opacity : null,
            canvasDisplay: canvas ? window.getComputedStyle(canvas).display : null,
          });
        })()
      `,
    });
    console.log(evalRes.result.result.value);
  }

  ws.close();
}
main().catch(console.error);
