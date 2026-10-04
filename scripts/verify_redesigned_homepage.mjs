import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = '/Users/karthikeya.s/.gemini/antigravity-ide/brain/22ef5f52-84c8-42d0-93f2-3b0506e3f1da/verification_redesign';
fs.mkdirSync(outDir, { recursive: true });

async function runVerification() {
  console.log('Launching headless Chrome for verification...');
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9230',
    '--user-data-dir=/tmp/cap_prof_' + Date.now(),
    '--window-size=1440,900',
    '--hide-scrollbars',
    'about:blank'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch('http://127.0.0.1:9230/json/list');
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

    // =========================================================================
    // 1. DESKTOP VERIFICATION (1440 x 900)
    // =========================================================================
    console.log('\n--- 1. DESKTOP TESTING (1440x900) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    // Check Preloader (without skipIntro)
    console.log('Navigating to http://localhost:5173/ to capture Preloader...');
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise(r => setTimeout(r, 400));
    const preloaderShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'desktop_01_preloader.png'), Buffer.from(preloaderShot.data, 'base64'));
    console.log('  Saved desktop_01_preloader.png');

    // Wait for preloader exit to reach Hero
    await new Promise(r => setTimeout(r, 1800));

    // Desktop Hero Start
    const heroShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'desktop_02_hero_start.png'), Buffer.from(heroShot.data, 'base64'));
    console.log('  Saved desktop_02_hero_start.png');

    // Scroll through hero runway
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 500);' });
    await new Promise(r => setTimeout(r, 800));
    const heroMidShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'desktop_02_hero_scrub.png'), Buffer.from(heroMidShot.data, 'base64'));
    console.log('  Saved desktop_02_hero_scrub.png');

    // Check Sections by scrolling each into view
    const sections = [
      { id: 'manifesto-section', name: 'desktop_03_manifesto.png' },
      { id: 'four-pillars-section', name: 'desktop_04_four_pillars.png' },
      { id: 'system-visualization-section', name: 'desktop_05_system_visualization.png' },
      { id: 'surveillance-section', name: 'desktop_06_surveillance.png' },
      { id: 'access-section', name: 'desktop_07_access_control.png' },
      { id: 'sensor-intelligence-section', name: 'desktop_08_sensor_intelligence.png' },
      { id: 'incident-response-section', name: 'desktop_09_incident_response.png' },
      { id: 'dark-takeover-section', name: 'desktop_10_dark_takeover.png' },
      { id: 'site-footer', name: 'desktop_12_footer.png' },
    ];

    for (const sec of sections) {
      console.log(`Scrolling to #${sec.id}...`);
      await send('Runtime.evaluate', {
        expression: `(() => {
          const el = document.getElementById("${sec.id}");
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        })()`
      });
      await new Promise(r => setTimeout(r, 800));
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(outDir, sec.name), Buffer.from(shot.data, 'base64'));
      console.log(`  Saved ${sec.name}`);
    }

    // Test Keypad Interaction: click '1', '2', '3', '4' in AccessControlSection
    console.log('Testing Keypad Interaction in Access Control Section...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById("access-section");
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    });
    await new Promise(r => setTimeout(r, 500));
    await send('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('#access-section button'));
        const clickKey = (digit) => {
          const btn = buttons.find(b => b.textContent && b.textContent.trim().startsWith(digit));
          if (btn) btn.click();
        };
        clickKey('1');
        setTimeout(() => clickKey('2'), 80);
        setTimeout(() => clickKey('3'), 160);
        setTimeout(() => clickKey('4'), 240);
      })()`
    });
    await new Promise(r => setTimeout(r, 800));
    const keypadSuccessShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'desktop_07_access_granted.png'), Buffer.from(keypadSuccessShot.data, 'base64'));
    console.log('  Saved desktop_07_access_granted.png');

    // Test Fullscreen Menu Trigger
    console.log('Testing Fullscreen Menu...');
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
    await new Promise(r => setTimeout(r, 400));
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[aria-label="Open navigation menu"]');
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
    const menuShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'desktop_menu_opened.png'), Buffer.from(menuShot.data, 'base64'));
    console.log('  Saved desktop_menu_opened.png');

    // Close Menu
    await send('Runtime.evaluate', {
      expression: `(() => {
        const closeBtn = document.querySelector('button[aria-label="Close menu"]');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 400));

    // =========================================================================
    // 2. MOBILE VERIFICATION (390 x 844)
    // =========================================================================
    console.log('\n--- 2. MOBILE TESTING (390x844 - iPhone 12/13/14) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    console.log('Navigating to mobile homepage...');
    await send('Page.navigate', { url: 'http://localhost:5173/?skipIntro=true' });
    await new Promise(r => setTimeout(r, 1500));

    const mobileHero = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'mobile_01_hero.png'), Buffer.from(mobileHero.data, 'base64'));
    console.log('  Saved mobile_01_hero.png');

    const mobileSections = [
      { id: 'manifesto-section', name: 'mobile_02_manifesto.png' },
      { id: 'four-pillars-section', name: 'mobile_03_four_pillars.png' },
      { id: 'surveillance-section', name: 'mobile_04_surveillance.png' },
      { id: 'access-section', name: 'mobile_05_access_control.png' },
      { id: 'sensor-intelligence-section', name: 'mobile_06_sensor_intelligence.png' },
      { id: 'dark-takeover-section', name: 'mobile_07_dark_takeover.png' },
      { id: 'site-footer', name: 'mobile_08_footer.png' },
    ];

    for (const mSec of mobileSections) {
      await send('Runtime.evaluate', {
        expression: `(() => {
          const el = document.getElementById("${mSec.id}");
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        })()`
      });
      await new Promise(r => setTimeout(r, 700));
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(outDir, mSec.name), Buffer.from(shot.data, 'base64'));
      console.log(`  Saved ${mSec.name}`);
    }

    // =========================================================================
    // 3. COMMAND CENTER VERIFICATION (/app)
    // =========================================================================
    console.log('\n--- 3. COMMAND CENTER VERIFICATION (/app) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'http://localhost:5173/app' });
    await new Promise(r => setTimeout(r, 2000));

    const appStatus = await send('Runtime.evaluate', {
      expression: `({
        url: window.location.pathname,
        hasDashboardTitle: !!document.querySelector('h1, h2, header'),
        textSnippet: document.body.innerText.slice(0, 200)
      })`,
      returnByValue: true
    });
    console.log('  Command Center check:', JSON.stringify(appStatus.result.value));

    const appShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'command_center_app_verified.png'), Buffer.from(appShot.data, 'base64'));
    console.log('  Saved command_center_app_verified.png');

    ws.close();
    console.log('\n✓ Comprehensive verification completed successfully!');
  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    chrome.kill();
  }
}

runVerification();
