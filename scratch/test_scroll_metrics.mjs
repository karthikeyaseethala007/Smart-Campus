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

  const res = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
      maxScroll: document.documentElement.scrollHeight - window.innerHeight,
      scrollY: window.scrollY
    })`,
  });
  console.log('Scroll dimensions:', JSON.parse(res.result.result.value));

  const testYValues = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500];
  for (const y of testYValues) {
    const evalRes = await send('Runtime.evaluate', {
      expression: `
        JSON.stringify((() => {
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          const rawP = ${y} / maxScroll;
          return { y: ${y}, rawP: rawP.toFixed(4), heroP: Math.min(1, Math.max(0, rawP / 0.24)).toFixed(4) };
        })())
      `,
    });
    console.log(JSON.parse(evalRes.result.result.value));
  }

  ws.close();
}
main().catch(console.error);
