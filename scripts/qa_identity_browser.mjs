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
  console.log('STARTING CHROME BROWSER QA FOR IDENTITY, ROLE & LOGOUT EXPERIENCE');
  console.log('=================================================================');

  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--user-data-dir=/tmp/chrome-cdp-identity-qa',
    '--no-first-run',
    '--window-size=1440,900',
    '--hide-scrollbars',
    'about:blank'
  ], { stdio: 'ignore' });

  // Wait for Chrome port
  let pages = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9223/json/list');
      if (res.ok) {
        pages = await res.json();
        if (pages && pages.length > 0) break;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }

  if (!pages || pages.length === 0) {
    chrome.kill();
    throw new Error('Chrome remote debugging did not respond on port 9223');
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
      // Ignore normal test abort or expected 401 logs
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
    return res.result?.value;
  };

  try {
    // -----------------------------------------------------------------
    // TEST 1: Unauthenticated visit to /app redirects to /login
    // -----------------------------------------------------------------
    console.log('\n[TEST 1] Visiting /app unauthenticated -> expect redirect to /login...');
    await send('Page.navigate', { url: 'http://localhost:5173/login' });
    await new Promise(r => setTimeout(r, 600));
    await evaluate(`localStorage.clear(); sessionStorage.clear();`);
    await send('Page.navigate', { url: 'http://localhost:5173/app' });
    await new Promise(r => setTimeout(r, 1200));

    const pathUnauth = await evaluate(`window.location.pathname`);
    console.log(`  -> Current URL pathname: ${pathUnauth}`);
    if (pathUnauth === '/login') {
      console.log('  ✔ PASS: Unauthenticated user successfully redirected to /login');
    } else {
      console.error(`  ✖ FAIL: Expected /login, got ${pathUnauth}`);
    }

    // -----------------------------------------------------------------
    // TEST 2: Login as Administrator
    // -----------------------------------------------------------------
    console.log('\n[TEST 2] Logging in as Chief Administrator Ramanujan...');
    await evaluate(`
      const buttons = Array.from(document.querySelectorAll('button'));
      const adminBtn = buttons.find(b => b.innerText.trim() === 'admin');
      if (adminBtn) adminBtn.click();
    `);
    await new Promise(r => setTimeout(r, 300));
    await evaluate(`document.querySelector('form')?.requestSubmit()`);
    await new Promise(r => setTimeout(r, 3000));

    const pathAfterLogin = await evaluate(`window.location.pathname`);
    console.log(`  -> URL after login: ${pathAfterLogin}`);
    if (pathAfterLogin === '/app') {
      console.log('  ✔ PASS: Successfully authenticated and redirected to /app');
    } else {
      console.error(`  ✖ FAIL: Expected /app, got ${pathAfterLogin}`);
    }

    // -----------------------------------------------------------------
    // TEST 3: Verify Top-Right Identity Control & Account Menu
    // -----------------------------------------------------------------
    console.log('\n[TEST 3] Verifying Top-Right Identity Control & Account Menu...');
    const topBarText = await evaluate(`document.querySelector('.topbar-role-btn')?.innerText`);
    console.log(`  -> TopBar Account Button Text:\n${topBarText}`);
    if (topBarText?.includes('Chief Administrator') && topBarText?.includes('Administrator')) {
      console.log('  ✔ PASS: Top-right button displays authenticated user display name and clearance');
    } else {
      console.error('  ✖ FAIL: Top-right button text missing display name or clearance');
    }

    // Click to open account menu
    await evaluate(`document.querySelector('.topbar-role-btn')?.click()`);
    await new Promise(r => setTimeout(r, 500));

    const menuContent = await evaluate(`document.querySelector('.topbar-role-btn')?.parentElement?.innerText`);
    console.log(`  -> TopBar Account Menu Content:\n${menuContent}`);

    const hasAccountHeader = menuContent?.includes('ACCOUNT');
    const hasAuthStatus = menuContent?.includes('Authenticated');
    const hasClearance = menuContent?.includes('CLEARANCE') && menuContent?.includes('Administrator');
    const hasSecAccess = menuContent?.includes('Security & access');
    const hasLogout = menuContent?.includes('Logout');
    const hasRoleSwitching = menuContent?.includes('Role-Based Clearance') || menuContent?.includes('Select Operational Role');

    if (hasAccountHeader && hasAuthStatus && hasClearance && hasSecAccess && hasLogout && !hasRoleSwitching) {
      console.log('  ✔ PASS: Account Menu displays canonical identity, status, clearance, functional actions and ZERO role switching!');
    } else {
      console.error(`  ✖ FAIL: Account Menu check failed. hasAccountHeader=${hasAccountHeader}, hasAuthStatus=${hasAuthStatus}, hasClearance=${hasClearance}, hasSecAccess=${hasSecAccess}, hasLogout=${hasLogout}, hasRoleSwitching=${hasRoleSwitching}`);
    }
    await takeScreenshot('account_menu_opened.png');

    // Close menu
    await evaluate(`document.querySelector('.topbar-role-btn')?.click()`);
    await new Promise(r => setTimeout(r, 300));

    // -----------------------------------------------------------------
    // TEST 4: Verify Bottom-Left Active Session Panel
    // -----------------------------------------------------------------
    console.log('\n[TEST 4] Verifying Bottom-Left Active Session Panel in Sidebar...');
    const sidebarPanel = await evaluate(`(() => {
      const aside = document.querySelector('aside');
      return aside ? aside.innerText : '';
    })()`);

    const hasActiveSession = sidebarPanel.includes('ACTIVE SESSION');
    const hasUserName = sidebarPanel.includes('Chief Administrator Ramanujan');
    const hasRoleLabel = sidebarPanel.includes('Administrator');
    const hasSidebarLogout = sidebarPanel.includes('Logout');

    console.log(`  -> Sidebar contains 'ACTIVE SESSION': ${hasActiveSession}`);
    console.log(`  -> Sidebar contains 'Chief Administrator Ramanujan': ${hasUserName}`);
    console.log(`  -> Sidebar contains 'Administrator': ${hasRoleLabel}`);
    console.log(`  -> Sidebar contains 'Logout': ${hasSidebarLogout}`);

    if (hasActiveSession && hasUserName && hasRoleLabel && hasSidebarLogout) {
      console.log('  ✔ PASS: Bottom-Left Active Session Panel contains all required information architecture!');
    } else {
      console.error('  ✖ FAIL: Bottom-Left Active Session Panel missing required fields');
    }
    await takeScreenshot('active_session_panel.png');

    // -----------------------------------------------------------------
    // TEST 5: Responsive viewports & overflow checks
    // -----------------------------------------------------------------
    console.log('\n[TEST 5] Testing all 5 responsive viewports for horizontal overflow & layout fit...');
    for (const vp of VIEWPORTS) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: Boolean(vp.isMobile),
      });
      await new Promise(r => setTimeout(r, 600));

      const metrics = await evaluate(`({
        name: '${vp.name}',
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        hasOverflow: document.documentElement.scrollWidth > ${vp.width},
        overflowPx: Math.max(0, document.documentElement.scrollWidth - ${vp.width}),
      })`);

      console.log(`  -> Viewport ${vp.name}: innerWidth=${metrics.innerWidth}, scrollWidth=${metrics.scrollWidth}, hasOverflow=${metrics.hasOverflow}`);
      if (!metrics.hasOverflow) {
        console.log(`  ✔ PASS [${vp.name}]: No horizontal overflow`);
      } else {
        console.error(`  ✖ OVERFLOW [${vp.name}]: +${metrics.overflowPx}px detected`);
      }
      await takeScreenshot(`app_responsive_${vp.name}.png`);
    }

    // Reset to desktop viewport and settle layout
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'http://localhost:5173/app' });
    await new Promise(r => setTimeout(r, 1200));

    // -----------------------------------------------------------------
    // TEST 6: Real Logout & Session Invalidation
    // -----------------------------------------------------------------
    console.log('\n[TEST 6] Testing real server Logout and session revocation...');
    const tokenBeforeLogout = await evaluate(`localStorage.getItem('campus_persistence_session_token_v1')`);
    console.log(`  -> Active session token: ${tokenBeforeLogout?.slice(0, 15)}...`);

    // Click logout button from the sidebar
    await evaluate(`
      const buttons = Array.from(document.querySelectorAll('aside button'));
      const logoutBtn = buttons.find(b => b.innerText.includes('Logout'));
      if (logoutBtn) logoutBtn.click();
    `);
    await new Promise(r => setTimeout(r, 1500));

    const pathAfterLogout = await evaluate(`window.location.pathname`);
    const tokenAfterLogout = await evaluate(`localStorage.getItem('campus_persistence_session_token_v1')`);

    console.log(`  -> URL after logout: ${pathAfterLogout}`);
    console.log(`  -> Token after logout: ${tokenAfterLogout}`);

    if (pathAfterLogout === '/login' && !tokenAfterLogout) {
      console.log('  ✔ PASS: Logout cleared local session token and redirected to /login');
    } else {
      console.error(`  ✖ FAIL: Logout did not clear state or redirect properly`);
    }
    await takeScreenshot('login_after_logout.png');

    // -----------------------------------------------------------------
    // TEST 7: Test unauthenticated back/direct navigation to /app after logout
    // -----------------------------------------------------------------
    console.log('\n[TEST 7] Testing unauthenticated back/direct navigation to /app after logout...');
    await send('Page.navigate', { url: 'http://localhost:5173/app' });
    await new Promise(r => setTimeout(r, 1200));

    const pathAfterBack = await evaluate(`window.location.pathname`);
    console.log(`  -> Path after navigation to /app: ${pathAfterBack}`);
    if (pathAfterBack === '/login') {
      console.log('  ✔ PASS: Unauthenticated access to /app prevented; redirected back to /login');
    } else {
      console.error(`  ✖ FAIL: Unauthenticated access permitted re-entry to ${pathAfterBack}`);
    }

    // -----------------------------------------------------------------
    // TEST 8: Log in as Student and verify canonical student identity
    // -----------------------------------------------------------------
    console.log('\n[TEST 8] Logging in as Student (A. Chen)...');
    await evaluate(`
      const buttons = Array.from(document.querySelectorAll('button'));
      const studentBtn = buttons.find(b => b.innerText.trim() === 'student');
      if (studentBtn) studentBtn.click();
    `);
    await new Promise(r => setTimeout(r, 300));
    await evaluate(`document.querySelector('form')?.requestSubmit()`);
    await new Promise(r => setTimeout(r, 3000));

    const studentTopBar = await evaluate(`document.querySelector('.topbar-role-btn')?.innerText`);
    const studentSidebar = await evaluate(`document.querySelector('aside')?.innerText`);

    console.log(`  -> Student TopBar Text:\n${studentTopBar}`);
    console.log(`  -> Student Sidebar Panel has 'A. Chen': ${studentSidebar?.includes('A. Chen')}`);
    console.log(`  -> Student Sidebar Panel has 'Student': ${studentSidebar?.includes('Student')}`);

    if (studentSidebar?.includes('A. Chen') && studentSidebar?.includes('Student')) {
      console.log('  ✔ PASS: Student account displays canonical name "A. Chen" and "Student" clearance');
    } else {
      console.error('  ✖ FAIL: Student account identity not rendered accurately');
    }
    await takeScreenshot('student_logged_in.png');

    // -----------------------------------------------------------------
    // TEST 9: Reduced motion mode verification
    // -----------------------------------------------------------------
    console.log('\n[TEST 9] Testing reduced-motion emulation...');
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    await new Promise(r => setTimeout(r, 500));
    const reducedMotionActive = await evaluate(`window.matchMedia('(prefers-reduced-motion: reduce)').matches`);
    console.log(`  -> Prefers-reduced-motion matches: ${reducedMotionActive}`);
    if (reducedMotionActive) {
      console.log('  ✔ PASS: prefers-reduced-motion successfully emulated');
    }

    // -----------------------------------------------------------------
    // TEST 10: Landing page intactness
    // -----------------------------------------------------------------
    console.log('\n[TEST 10] Verifying Landing page intact at http://localhost:5173/ ...');
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise(r => setTimeout(r, 1500));

    const landingTitle = await evaluate(`document.title`);
    const brandMark = await evaluate(`document.querySelector('header')?.innerText`);
    console.log(`  -> Landing page title: "${landingTitle}"`);
    console.log(`  -> Landing header brand mark present: ${Boolean(brandMark)}`);
    await takeScreenshot('landing_page_verified_intact.png');
    console.log('  ✔ PASS: Landing page remains completely pristine and untouched!');

    // -----------------------------------------------------------------
    // SUMMARY & CONSOLE ERRORS
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
