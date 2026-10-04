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

  const evalRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const testImg = new Image();
        return new Promise((resolve) => {
          testImg.onload = () => resolve({ loaded: true, width: testImg.naturalWidth });
          testImg.onerror = (e) => resolve({ loaded: false, error: String(e) });
          testImg.src = '/assets/hero/frames_alpha/frame_0001.png';
        });
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Frame 1 load test:', evalRes.result.value);

  const stateRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const poster = document.querySelector('img[src="/assets/hero/poster.png"]');
        return {
          posterSrc: poster ? poster.src : null,
          posterComplete: poster ? poster.complete : null,
          posterOpacity: poster ? window.getComputedStyle(poster).opacity : null,
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Poster state:', stateRes.result.value);

  ws.close();
}
main().catch(console.error);
