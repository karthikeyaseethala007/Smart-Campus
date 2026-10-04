import { createServer } from 'vite';

async function start() {
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
  });
  // Loading server/index.ts automatically starts the campus server on config.port (8080)
  await vite.ssrLoadModule('./server/index.ts');
}

start().catch(err => {
  console.error('Failed to start campus backend:', err);
  process.exit(1);
});
