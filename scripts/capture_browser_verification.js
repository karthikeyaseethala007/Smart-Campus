import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = '/Users/karthikeya.s/Documents/focus/references/mdx-analysis/browser_verification';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function run() {
  console.log('Launching Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080'
    ],
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    }
  });

  const page = await browser.newPage();
  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 });

  // Check for "SKIP INTRO" button or wait for intro to finish
  console.log('Looking for Skip Intro button...');
  try {
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('SKIP INTRO')) {
        console.log('Found SKIP INTRO button, clicking...');
        await b.click();
        break;
      }
    }
  } catch (err) {
    console.log('Skip intro error (ignoring):', err);
  }

  // Wait 2 seconds for canvas / video initialization
  await new Promise(r => setTimeout(r, 2000));

  const totalHeight = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  console.log('Total scrollable height:', totalHeight);

  // We want to capture forward scrolling at specific scroll fractions:
  // 0.00: Globe Hold
  // 0.15: Globe rotating
  // 0.25: Globe -> Elec pre-distortion
  // 0.29: Globe -> Elec energy expansion
  // 0.35: Electricity Hold
  // 0.42: Elec -> Fire surge
  // 0.47: Fire Hold
  // 0.54: Fire -> Lock arch curling
  // 0.60: Lock Hold
  // 0.72: Hero -> Editorial transition
  // 0.85: Editorial deep scroll
  // Then backward scrubbing:
  // 0.55: Backward Lock -> Fire
  // 0.35: Backward Electricity
  // 0.00: Backward Globe

  const scrollCheckpoints = [
    { name: '01_fwd_globe_hold', frac: 0.0 },
    { name: '02_fwd_globe_pre_transition', frac: 0.22 },
    { name: '03_fwd_globe_elec_energy_expansion', frac: 0.28 },
    { name: '04_fwd_electricity_hold', frac: 0.36 },
    { name: '05_fwd_elec_fire_surge', frac: 0.44 },
    { name: '06_fwd_fire_hold', frac: 0.50 },
    { name: '07_fwd_fire_lock_arch_curl', frac: 0.56 },
    { name: '08_fwd_lock_hold', frac: 0.62 },
    { name: '09_fwd_hero_editorial_handoff', frac: 0.72 },
    { name: '10_fwd_editorial_section', frac: 0.88 },
    // Backward scrub tests
    { name: '11_bwd_lock_to_fire', frac: 0.55 },
    { name: '12_bwd_electricity_hold', frac: 0.36 },
    { name: '13_bwd_globe_return', frac: 0.0 }
  ];

  for (const cp of scrollCheckpoints) {
    const targetY = Math.round(cp.frac * totalHeight);
    console.log(`Scrolling to ${cp.name} (frac=${cp.frac}, y=${targetY})...`);
    await page.evaluate((y) => {
      window.scrollTo({ top: y, behavior: 'instant' });
    }, targetY);

    // Allow requestAnimationFrame / canvas / video scrub to settle
    await new Promise(r => setTimeout(r, 400));

    const shotPath = path.join(OUT_DIR, `${cp.name}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Saved screenshot: ${shotPath}`);
  }

  console.log('All verification screenshots captured successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Browser capture failed:', err);
  process.exit(1);
});
