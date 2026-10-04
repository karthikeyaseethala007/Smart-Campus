import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = '/Users/karthikeya.s/.gemini/antigravity-ide/brain/22ef5f52-84c8-42d0-93f2-3b0506e3f1da/restored_mdx_audit';
const framesDir = path.join(outDir, 'scroll_video_frames');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(framesDir, { recursive: true });

async function runAudit() {
  console.log('============================================================');
  console.log('VERIFYING RESTORED MDX-STYLE LANDING PAGE & RECORDING');
  console.log('============================================================');

  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9233',
    '--user-data-dir=/tmp/restored_prof_' + Date.now(),
    '--window-size=1440,900',
    '--hide-scrollbars',
    'about:blank'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 1600));

  try {
    const listRes = await fetch('http://127.0.0.1:9233/json/list');
    const pages = await listRes.json();
    const pageTarget = pages.find(p => p.type === 'page') || pages[0];
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

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

    // 1. DESKTOP VIEWPORT SETUP (1440x900)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('1. Loading restored homepage...');
    await send('Page.navigate', { url: 'http://localhost:5173/?skipIntro=true' });
    await new Promise(r => setTimeout(r, 1200));

    // Measure total scroll height
    const scrollMetrics = await send('Runtime.evaluate', {
      expression: 'document.documentElement.scrollHeight - window.innerHeight',
      returnByValue: true
    });
    const maxScroll = scrollMetrics.result.value;
    console.log(`   Total page scroll range: ${maxScroll}px`);

    // Helper to capture target screenshot
    async function captureAt(yPct, filename, label) {
      const y = Math.round(maxScroll * yPct);
      await send('Runtime.evaluate', {
        expression: `window.scrollTo({ top: ${y}, behavior: 'instant' });`
      });
      await new Promise(r => setTimeout(r, 350));
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(outDir, filename), Buffer.from(shot.data, 'base64'));
      console.log(`   ✓ [${Math.round(yPct * 100)}%] ${label} -> ${filename}`);
    }

    // 2. CAPTURE REQUIRED FIDELITY MOMENTS
    console.log('2. Capturing required visual checkpoints...');
    await captureAt(0.00, 'hero-start.png', 'Hero Globe Anchored');
    await captureAt(0.08, 'hero-mid.png', 'Hero Morph Electricity / Fire');
    await captureAt(0.18, 'hero-end.png', 'Hero Lock State');
    await captureAt(0.28, 'editorial.png', 'Editorial Statement 01');
    await captureAt(0.52, 'system-experience.png', 'Cinematic System Experience Stage');
    await captureAt(0.68, 'four-pillars.png', 'Four-Pillar Floating Orbit');
    await captureAt(0.86, 'command-entry.png', 'Contact / Command Entry Scene');
    await captureAt(1.00, 'footer.png', 'Monolithic SMART CAMPUS Footer');

    // 3. GENERATE CONTINUOUS SMOOTH SCROLL JOURNEY VIDEO
    console.log('3. Generating continuous smooth scroll sequence for MP4 recording...');
    const totalFrames = 80;
    for (let i = 0; i <= totalFrames; i++) {
      const progress = i / totalFrames;
      const y = Math.round(maxScroll * progress);
      await send('Runtime.evaluate', {
        expression: `window.scrollTo({ top: ${y}, behavior: 'instant' });`
      });
      await new Promise(r => setTimeout(r, 70));
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const fnum = String(i).padStart(4, '0');
      fs.writeFileSync(path.join(framesDir, `frame_${fnum}.png`), Buffer.from(shot.data, 'base64'));
      if (i % 20 === 0 || i === totalFrames) {
        console.log(`   Captured frame ${i}/${totalFrames}`);
      }
    }

    const videoOutPath = path.join(outDir, 'restored_continuous_scroll_journey.mp4');
    console.log(`\nEncoding continuous video recording to ${videoOutPath}...`);
    try {
      execSync(`ffmpeg -y -framerate 15 -i "${framesDir}/frame_%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 20 "${videoOutPath}"`, { stdio: 'ignore' });
      console.log('   ✓ restored_continuous_scroll_journey.mp4 successfully created!');
    } catch (e) {
      console.error('   Error encoding video with ffmpeg:', e.message);
    }

    // 4. VERIFY PROTECTED /app COMMAND CENTER
    console.log('4. Verifying Command Center Protected Product (/app)...');
    await send('Page.navigate', { url: 'http://localhost:5173/app' });
    await new Promise(r => setTimeout(r, 1200));

    const appShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'app-verified.png'), Buffer.from(appShot.data, 'base64'));
    console.log('   ✓ Saved app-verified.png');

    const appEvaluation = await send('Runtime.evaluate', {
      expression: `({
        url: window.location.pathname,
        camerasCount: document.body.innerText.includes('6 CAMERAS'),
        iotCount: document.body.innerText.includes('16 IOT DEVICES'),
        operationsTitle: document.body.innerText.includes('Campus Operations Overview'),
        allSystemsNominal: document.body.innerText.includes('ALL SYSTEMS NOMINAL')
      })`,
      returnByValue: true
    });
    console.log('   Command Center Health Check:', JSON.stringify(appEvaluation.result.value));

    // 5. VERIFY MOBILE VIEWPORT (390x844)
    console.log('5. Verifying Mobile Viewport (390x844)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Page.navigate', { url: 'http://localhost:5173/?skipIntro=true' });
    await new Promise(r => setTimeout(r, 1200));

    const mobileHero = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'mobile-hero.png'), Buffer.from(mobileHero.data, 'base64'));
    console.log('   ✓ Saved mobile-hero.png');

    // Scroll to bottom on mobile
    await send('Runtime.evaluate', {
      expression: "window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });"
    });
    await new Promise(r => setTimeout(r, 500));

    const mobileFooter = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'mobile-footer.png'), Buffer.from(mobileFooter.data, 'base64'));
    console.log('   ✓ Saved mobile-footer.png');

    console.log('\n============================================================');
    console.log('RESTORED MDX AUDIT COMPLETE: All moments captured.');
    console.log('============================================================');

    ws.close();
    chrome.kill();
  } catch (err) {
    console.error('Audit failed with error:', err);
    chrome.kill();
    process.exit(1);
  }
}

runAudit();
