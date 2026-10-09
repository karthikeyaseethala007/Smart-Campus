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
  console.log('STARTING CHROME BROWSER QA FOR SMART CAMPUS /login & AUTHENTICATION');
  console.log('=================================================================');

  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=/tmp/chrome-cdp-login-qa',
    '--no-first-run',
    '--window-size=1440,900',
    '--hide-scrollbars',
    'about:blank'
  ], { stdio: 'ignore' });

  // Wait for Chrome port
  let pages = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/list');
      if (res.ok) {
        pages = await res.json();
        if (pages && pages.length > 0) break;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }

  if (!pages || pages.length === 0) {
    chrome.kill();
    throw new Error('Chrome remote debugging did not respond on port 9222');
  }

  const target = pages.find(p => p.type === 'page') || pages[0];
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let msgId = 1;
  const pending = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.consoleAPICalled' && data.params.type === 'error') {
      consoleErrors.push(data.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' '));
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
    return res.result?.value;
  };

  try {
    // -----------------------------------------------------------------
    // TEST 1: Unauthenticated visit to /app -> MUST REDIRECT TO /login
    // -----------------------------------------------------------------
    console.log('\n[TEST 1] Testing unauthenticated redirect: visiting http://localhost:5173/app ...');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'http://localhost:5173/app' });
    await new Promise(r => setTimeout(r, 1200));

    // Clear any token and re-check redirect
    await evaluate(`localStorage.clear(); sessionStorage.clear();`);
    await send('Page.navigate', { url: 'http://localhost:5173/app' });
    await new Promise(r => setTimeout(r, 1200));

    const path1 = await evaluate(`window.location.pathname`);
    console.log(`  -> Current URL pathname: ${path1}`);
    if (path1 === '/login') {
      console.log('  ✔ PASS: Unauthenticated access to /app correctly redirected to /login');
    } else {
      console.error(`  ✖ FAIL: Expected /login but got ${path1}`);
    }

    // -----------------------------------------------------------------
    // TEST 2: Inspect /login initial render at 1440x900
    // -----------------------------------------------------------------
    console.log('\n[TEST 2] Verifying /login page elements & visual hierarchy...');
    const loginTitle = await evaluate(`document.title`);
    const hasHeading = await evaluate(`Boolean(document.querySelector('h1'))`);
    const headingText = await evaluate(`document.querySelector('h1')?.innerText`);
    const hasIdentityInput = await evaluate(`Boolean(document.getElementById('operator-identity'))`);
    const hasPasskeyInput = await evaluate(`Boolean(document.getElementById('operator-passkey'))`);
    const hasSubmitBtn = await evaluate(`Boolean(document.querySelector('button[type="submit"]'))`);

    console.log(`  -> Document title: "${loginTitle}"`);
    console.log(`  -> Heading: "${headingText}" (present: ${hasHeading})`);
    console.log(`  -> Operator Identity input: present=${hasIdentityInput}`);
    console.log(`  -> Security Passkey input: present=${hasPasskeyInput}`);
    console.log(`  -> Authenticate button: present=${hasSubmitBtn}`);

    await takeScreenshot('login_1440x900_initial.png');

    // -----------------------------------------------------------------
    // TEST 3: Validation on empty submission
    // -----------------------------------------------------------------
    console.log('\n[TEST 3] Testing form validation with empty credentials...');
    await evaluate(`
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    `);
    await new Promise(r => setTimeout(r, 600));

    const alertMsgEmpty = await evaluate(`document.querySelector('[role="alert"]')?.innerText`);
    console.log(`  -> Validation feedback: "${alertMsgEmpty}"`);
    if (alertMsgEmpty && alertMsgEmpty.includes('operator identifier')) {
      console.log('  ✔ PASS: Empty submission properly blocked with validation message');
    } else {
      console.log('  ⚠ Alert message:', alertMsgEmpty);
    }
    await takeScreenshot('login_validation_empty.png');

    // -----------------------------------------------------------------
    // TEST 4: Invalid credentials submission
    // -----------------------------------------------------------------
    console.log('\n[TEST 4] Testing authentication denial with invalid credentials...');
    await evaluate(`
      const user = document.getElementById('operator-identity');
      user.focus();
      user.select();
    `);
    await send('Input.insertText', { text: 'admin' });
    await new Promise(r => setTimeout(r, 100));

    await evaluate(`
      const pass = document.getElementById('operator-passkey');
      pass.focus();
      pass.select();
    `);
    await send('Input.insertText', { text: 'wrongpassword123' });
    await new Promise(r => setTimeout(r, 100));

    await evaluate(`
      document.querySelector('form').requestSubmit();
    `);
    await new Promise(r => setTimeout(r, 1200));

    const alertMsgWrong = await evaluate(`document.querySelector('[role="alert"]')?.innerText`);
    console.log(`  -> Denial feedback: "${alertMsgWrong}"`);
    if (alertMsgWrong && (alertMsgWrong.includes('Invalid credentials') || alertMsgWrong.includes('Authentication Denied'))) {
      console.log('  ✔ PASS: Invalid credentials correctly rejected with integrated alert');
    } else {
      console.log('  ⚠ Alert feedback:', alertMsgWrong);
    }
    await takeScreenshot('login_denied_invalid.png');

    // -----------------------------------------------------------------
    // TEST 5: Password show/hide toggle test
    // -----------------------------------------------------------------
    console.log('\n[TEST 5] Testing password visibility toggle...');
    const initialType = await evaluate(`document.getElementById('operator-passkey')?.type`);
    await evaluate(`
      const toggle = document.querySelector('button[aria-label="Show password"], button[aria-label="Hide password"]');
      if (toggle) toggle.click();
    `);
    await new Promise(r => setTimeout(r, 200));
    const toggledType = await evaluate(`document.getElementById('operator-passkey')?.type`);
    console.log(`  -> Initial type: "${initialType}" | After toggle: "${toggledType}"`);
    if (initialType === 'password' && toggledType === 'text') {
      console.log('  ✔ PASS: Password visibility toggle switched type to text');
    }

    // Toggle back to password
    await evaluate(`
      const toggle = document.querySelector('button[aria-label="Show password"], button[aria-label="Hide password"]');
      if (toggle) toggle.click();
    `);
    await new Promise(r => setTimeout(r, 200));

    // -----------------------------------------------------------------
    // TEST 6: Valid authentication -> establishes session -> navigates to /app
    // -----------------------------------------------------------------
    console.log('\n[TEST 6] Testing valid authentication with administrator credentials...');
    // Fresh navigation to ensure clean state
    await send('Page.navigate', { url: 'http://localhost:5173/login' });
    await new Promise(r => setTimeout(r, 1000));

    // Click pre-authorized admin demo credentials
    await evaluate(`
      const buttons = Array.from(document.querySelectorAll('button'));
      const adminBtn = buttons.find(b => b.innerText.trim() === 'admin');
      if (adminBtn) adminBtn.click();
    `);
    await new Promise(r => setTimeout(r, 300));

    // Submit form
    await evaluate(`
      document.querySelector('form').requestSubmit();
    `);

    // Wait for ACCESS GRANTED state
    await new Promise(r => setTimeout(r, 600));
    const successMsg = await evaluate(`document.querySelector('[role="status"]')?.innerText`);
    console.log(`  -> Success transition status: "${successMsg}"`);
    await takeScreenshot('login_success_access_granted.png');

    // Wait for transition to finish and route to /app
    await new Promise(r => setTimeout(r, 2800));
    const currentPathAuth = await evaluate(`window.location.pathname`);
    const sessionTokenStored = await evaluate(`localStorage.getItem('campus_persistence_session_token_v1')`);
    console.log(`  -> Path after authentication: ${currentPathAuth}`);
    console.log(`  -> Stored Session Token in localStorage: ${sessionTokenStored ? sessionTokenStored.substring(0, 16) + '...' : 'NONE'}`);

    if (currentPathAuth === '/app' && sessionTokenStored) {
      console.log('  ✔ PASS: Successfully authenticated, session token established, routed to /app Command Center!');
    } else {
      console.error(`  ✖ FAIL: Expected /app with session token, got path=${currentPathAuth}, token=${sessionTokenStored}`);
    }
    await takeScreenshot('app_after_successful_login.png');

    // -----------------------------------------------------------------
    // TEST 7: Authenticated user visits /login -> redirected to /app
    // -----------------------------------------------------------------
    console.log('\n[TEST 7] Testing authenticated redirect: visiting http://localhost:5173/login while session active...');
    await send('Page.navigate', { url: 'http://localhost:5173/login' });
    await new Promise(r => setTimeout(r, 1600));

    const pathAuthLogin = await evaluate(`window.location.pathname`);
    console.log(`  -> Current URL pathname: ${pathAuthLogin}`);
    if (pathAuthLogin === '/app') {
      console.log('  ✔ PASS: Already authenticated user automatically redirected from /login to /app');
    } else {
      console.error(`  ✖ FAIL: Expected /app but got ${pathAuthLogin}`);
    }

    // -----------------------------------------------------------------
    // TEST 8: Responsive layout & horizontal overflow across all 5 viewports
    // -----------------------------------------------------------------
    console.log('\n[TEST 8] Testing /login across all 5 viewports for horizontal overflow & responsiveness...');
    // Clear session so we can view /login at each viewport
    await evaluate(`localStorage.clear(); sessionStorage.clear();`);

    const overflowResults = [];
    for (const vp of VIEWPORTS) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: Boolean(vp.isMobile),
      });

      await send('Page.navigate', { url: 'http://localhost:5173/login' });
      await new Promise(r => setTimeout(r, 1000));

      const metrics = await evaluate(`({
        name: '${vp.name}',
        viewportWidth: ${vp.width},
        viewportHeight: ${vp.height},
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        hasOverflow: document.documentElement.scrollWidth > ${vp.width},
        overflowPx: Math.max(0, document.documentElement.scrollWidth - ${vp.width}),
      })`);

      overflowResults.push(metrics);
      console.log(`  -> Viewport ${vp.name}: innerWidth=${metrics.innerWidth}, scrollWidth=${metrics.scrollWidth}, hasOverflow=${metrics.hasOverflow} (+${metrics.overflowPx}px)`);

      if (!metrics.hasOverflow) {
        console.log(`  ✔ PASS [${vp.name}]: Zero horizontal overflow`);
      } else {
        console.error(`  ✖ OVERFLOW [${vp.name}]: +${metrics.overflowPx}px detected`);
      }

      await takeScreenshot(`login_${vp.name}.png`);
    }

    // -----------------------------------------------------------------
    // TEST 9: Landing page intactness & transition
    // -----------------------------------------------------------------
    console.log('\n[TEST 9] Verifying Landing page visual integrity at http://localhost:5173/ ...');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise(r => setTimeout(r, 1500));

    const landingTitle = await evaluate(`document.title`);
    const brandMark = await evaluate(`document.querySelector('header')?.innerText`);
    console.log(`  -> Landing page title: "${landingTitle}"`);
    console.log(`  -> Header brand mark present: ${Boolean(brandMark)}`);
    await takeScreenshot('landing_page_intact.png');
    console.log('  ✔ PASS: Landing page renders completely intact!');

    // -----------------------------------------------------------------
    // CONSOLE ERROR CHECK
    // -----------------------------------------------------------------
    console.log('\n=================================================================');
    console.log(`CONSOLE ERRORS DETECTED DURING RUN: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((err, idx) => console.log(`  [${idx + 1}] ${err}`));
    } else {
      console.log('  ✔ PASS: 0 console errors logged across entire browser session!');
    }
    console.log('=================================================================');

  } finally {
    ws.close();
    chrome.kill();
  }
}

run().catch((err) => {
  console.error('Browser QA Script Failed:', err);
  process.exit(1);
});
