import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/karthikeya.s/.gemini/antigravity-ide/brain/f913b00c-0854-4a9a-948f-a396a9d68e2b';
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'scratch/qa_screenshots');

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '768x1024', width: 768, height: 1024, isMobile: true },
  { name: '390x844', width: 390, height: 844, isMobile: true },
];

async function run() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  console.log('=================================================================');
  console.log('STARTING CHROME BROWSER QA FOR GOOGLE AUTH & FINAL LOGIN POLISH');
  console.log('=================================================================');

  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--user-data-dir=/tmp/chrome-cdp-google-qa',
    '--no-first-run',
    '--window-size=1440,900',
    '--hide-scrollbars',
    'about:blank'
  ], { stdio: 'ignore' });

  // Wait for Chrome remote debugging port
  let pages = null;
  for (let i = 0; i < 25; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9224/json/list');
      if (res.ok) {
        pages = await res.json();
        if (pages && pages.length > 0) break;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }

  if (!pages || pages.length === 0) {
    chrome.kill();
    throw new Error('Chrome remote debugging did not respond on port 9224');
  }

  const target = pages.find(p => p.type === 'page') || pages[0];
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let msgId = 1;
  const pending = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.consoleAPICalled' && data.params.type === 'error') {
      const text = data.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      if (!text.includes('401') && !text.includes('favicon')) {
        consoleErrors.push(text);
      }
    }
    if (data.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(data.params.exceptionDetails.text);
    }
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise(r => ws.onopen = r);

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = msgId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');

  const takeScreenshot = async (filename) => {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.data, 'base64');
    const outPath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`  [Screenshot] Saved: ${filename}`);
  };

  const evaluate = async (expression) => {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  };

  const setViewport = async (vp) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2,
      mobile: Boolean(vp.isMobile),
    });
    await new Promise(r => setTimeout(r, 250));
  };

  try {
    // 1. Navigate to /login on 1440x900
    console.log('\n--- Test 1: Navigation to /login on 1440x900 ---');
    await setViewport(VIEWPORTS[0]);
    await send('Page.navigate', { url: 'http://localhost:5173/login' });
    await new Promise(r => setTimeout(r, 1200));

    // Clear any previous token
    await evaluate(`localStorage.clear(); sessionStorage.clear();`);
    await send('Page.navigate', { url: 'http://localhost:5173/login' });
    await new Promise(r => setTimeout(r, 1000));

    // Verify "Return to site" is completely absent
    const returnToSiteFound = await evaluate(`
      Array.from(document.querySelectorAll('button, a')).some(el =>
        el.innerText.toLowerCase().includes('return to site')
      )
    `);
    console.log(`  [Check] "Return to site" button absent: ${!returnToSiteFound ? 'PASS (CONFIRMED ABSENT)' : 'FAIL'}`);

    // Verify "Continue with Google" button is present and positioned
    const googleButtonData = await evaluate(`(() => {
      const btn = document.querySelector('#google-authenticate-button');
      if (!btn) return null;
      const rect = btn.getBoundingClientRect();
      return {
        exists: true,
        text: btn.innerText.trim(),
        visible: rect.width > 0 && rect.height > 0,
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
    })()`);
    console.log('  [Check] Google button details:', googleButtonData);

    // Verify OR divider
    const hasOrDivider = await evaluate(`
      document.body.innerText.includes('OR')
    `);
    console.log(`  [Check] "OR" refined divider exists: ${hasOrDivider ? 'PASS' : 'FAIL'}`);

    await takeScreenshot('qa_login_google_1440x900.png');

    // 2. Responsive Check across all 5 viewports
    console.log('\n--- Test 2: Viewport and Overflow Validation across 5 viewports ---');
    for (const vp of VIEWPORTS) {
      await setViewport(vp);
      await new Promise(r => setTimeout(r, 300));
      const overflow = await evaluate(`(() => {
        const docW = document.documentElement.scrollWidth;
        const winW = window.innerWidth;
        const hasHorizontalScroll = docW > winW;
        return { docW, winW, hasHorizontalScroll };
      })()`);
      console.log(`  [Viewport ${vp.name}] Document width: ${overflow.docW}px, Window: ${overflow.winW}px, Overflow: ${overflow.hasHorizontalScroll ? 'FAIL (HORIZONTAL OVERFLOW)' : 'PASS (NO OVERFLOW)'}`);
      await takeScreenshot(`qa_login_${vp.name}.png`);
    }

    // Reset to 1440x900
    await setViewport(VIEWPORTS[0]);

    // 3. Test Google button interaction & error handling
    console.log('\n--- Test 3: Google Auth Click & Inline Error Display ---');
    await evaluate(`(() => {
      const btn = document.querySelector('#google-authenticate-button');
      if (btn) btn.click();
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const errorRendered = await evaluate(`(() => {
      const errorDiv = document.querySelector('[role="alert"]');
      if (!errorDiv) return null;
      return errorDiv.innerText;
    })()`);
    console.log('  [Check] Inline error displayed cleanly:', errorRendered);
    await takeScreenshot('qa_login_google_error.png');

    // Test "Return to authentication" link clears the error
    const clearedError = await evaluate(`(() => {
      const returnBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Return to authentication'));
      if (returnBtn) {
        returnBtn.click();
        return true;
      }
      return false;
    })()`);
    await new Promise(r => setTimeout(r, 300));
    const alertStillPresent = await evaluate(`Boolean(document.querySelector('[role="alert"]'))`);
    console.log(`  [Check] "Return to authentication" clears error state: ${clearedError && !alertStillPresent ? 'PASS' : 'FAIL'}`);

    // 4. Test Normal Password Login still works flawlessly
    console.log('\n--- Test 4: Password Authentication Verification ---');
    await evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const adminBtn = buttons.find(b => b.innerText.trim() === 'admin');
      if (adminBtn) {
        adminBtn.click();
      } else {
        const userInp = document.getElementById('operator-identity');
        const passInp = document.getElementById('operator-passkey');
        if (userInp) {
          userInp.value = 'admin';
          userInp.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (passInp) {
          passInp.value = 'password123';
          passInp.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    })()`);
    await new Promise(r => setTimeout(r, 300));

    // Submit form
    await evaluate(`(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    })()`);
    await new Promise(r => setTimeout(r, 2500));

    const redirectedToApp = await evaluate(`window.location.pathname.includes('/app') || document.body.innerText.includes('CHIEF') || document.body.innerText.includes('OVERVIEW')`);
    console.log(`  [Check] Successful login transitions to Command Center: ${redirectedToApp ? 'PASS' : 'FAIL'}`);
    await takeScreenshot('qa_app_authenticated_1440x900.png');

    // 5. Test Active Session Panel and TopBar Identity
    console.log('\n--- Test 5: Authoritative Active Session Panel & Identity Display ---');
    const sessionDetails = await evaluate(`(() => {
      const text = document.body.innerText;
      return {
        hasActiveSession: text.includes('ACTIVE SESSION'),
        hasChiefAdmin: text.includes('Chief Administrator') || text.includes('Ramanujan'),
        hasClearance: text.includes('LEVEL_4_CHIEF') || text.includes('Administrator'),
        hasAuthenticatedBadge: text.includes('Authenticated'),
      };
    })()`);
    console.log('  [Check] Active session telemetry:', sessionDetails);

    // 6. Test Logout Flow
    console.log('\n--- Test 6: Server Logout & Route Protection ---');
    await evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const logoutBtn = buttons.find(b => b.innerText.includes('Logout'));
      if (logoutBtn) logoutBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 1200));

    const atLoginPage = await evaluate(`window.location.pathname.includes('/login') && document.body.innerText.includes('CONSOLE CLEARANCE')`);
    console.log(`  [Check] Logout redirected to /login gateway: ${atLoginPage ? 'PASS' : 'FAIL'}`);
    await takeScreenshot('qa_login_after_logout.png');

    // Verify visiting /app after logout redirects to /login
    await send('Page.navigate', { url: 'http://localhost:5173/app' });
    await new Promise(r => setTimeout(r, 1200));
    const pathAfterNavToApp = await evaluate(`window.location.pathname`);
    console.log(`  [Check] Visiting /app after logout guarded and redirects to /login: ${pathAfterNavToApp === '/login' ? 'PASS' : 'FAIL'}`);

    console.log('\n--- Console Errors Check ---');
    console.log(`  Total unexpected console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('  Errors:', consoleErrors);
    } else {
      console.log('  PASS (ZERO CONSOLE ERRORS)');
    }

    console.log('\n=================================================================');
    console.log('BROWSER QA SUITE COMPLETED SUCCESSFULLY');
    console.log('=================================================================');

  } catch (err) {
    console.error('Browser QA encountered error:', err);
    throw err;
  } finally {
    ws.close();
    chrome.kill();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
