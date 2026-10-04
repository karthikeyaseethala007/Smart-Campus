import subprocess
import os
import cv2
import numpy as np

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
BASE_URL = 'http://localhost:5173/?skipIntro=true'
OUT_DIR = 'references/mdx-analysis/comparisons'
os.makedirs(OUT_DIR, exist_ok=True)

# List of scenes with target scroll position, reference frame, and title
SCENES = [
    {
        'id': '01_hero_start',
        'scroll': 0,
        'ref': 'references/mdx-analysis/01-hero/ref_01.5s.png',
        'title': 'Scene 01: Hero Initial (Scroll 0%)'
    },
    {
        'id': '01_hero_morph',
        'scroll': 900,
        'ref': 'references/mdx-analysis/01-hero/ref_05.0s.png',
        'title': 'Scene 01: Hero Morph Progression (Scroll ~45%)'
    },
    {
        'id': '02_editorial_stage_a',
        'scroll': 2400,
        'ref': 'references/mdx-analysis/02-editorial/ref_10.5s.png',
        'title': 'Scene 02: Editorial One Campus (ref_10.5s)'
    },
    {
        'id': '02_editorial_stage_b',
        'scroll': 3400,
        'ref': 'references/mdx-analysis/02-editorial/ref_13.5s.png',
        'title': 'Scene 02: Editorial Pipeline (ref_13.5s)'
    },
    {
        'id': '03_widescreen_system',
        'scroll': 4800,
        'ref': 'references/mdx-analysis/03-experience/ref_17.0s.png',
        'title': 'Scene 03: Widescreen Experience (ref_17.0s)'
    },
    {
        'id': '04_floating_pillars',
        'scroll': 6400,
        'ref': 'references/mdx-analysis/04-floating-pillars/ref_18.5s.png',
        'title': 'Scene 04: Floating Capsule Pills (ref_18.5s)'
    },
    {
        'id': '05_dark_showcase',
        'scroll': 7400,
        'ref': 'references/mdx-analysis/05-dark-showcase/ref_20.5s.png',
        'title': 'Scene 05: Dark Showcase & Filters (ref_20.5s)'
    },
    {
        'id': '06_contact_entry',
        'scroll': 9350,
        'ref': 'references/mdx-analysis/06-contact/ref_23.0s.png',
        'title': 'Scene 06: Contact & Entry Experience (ref_23.0s)'
    },
    {
        'id': '07_massive_footer',
        'scroll': 10100,
        'ref': 'references/mdx-analysis/07-footer/ref_28.5s.png',
        'title': 'Scene 07: Massive Footer (ref_28.5s)'
    }
]

print('=== CAPTURING SMART CAMPUS SCENES VIA CHROME CLI ===')
for scene in SCENES:
    out_file = os.path.join(OUT_DIR, f"smart_{scene['id']}.png")
    url = f"{BASE_URL}&scrollTo={scene['scroll']}"
    cmd = [
        CHROME,
        '--headless',
        f'--screenshot={out_file}',
        '--window-size=1440,900',
        '--hide-scrollbars',
        url
    ]
    print(f"Capturing {scene['id']} at scroll {scene['scroll']}...")
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if os.path.exists(out_file):
        print(f" -> Successfully captured {out_file} ({os.path.getsize(out_file)} bytes)")
    else:
        print(f" -> Failed to capture {out_file}")

# Capture mobile viewports (390x844)
print('Capturing mobile viewports...')
mobile_targets = [
    {'id': 'mobile_hero', 'scroll': 0},
    {'id': 'mobile_editorial', 'scroll': 2400},
    {'id': 'mobile_pillars', 'scroll': 6400},
    {'id': 'mobile_footer', 'scroll': 10100}
]
for m in mobile_targets:
    out_file = os.path.join(OUT_DIR, f"smart_{m['id']}.png")
    url = f"{BASE_URL}&scrollTo={m['scroll']}"
    cmd = [
        CHROME,
        '--headless',
        f'--screenshot={out_file}',
        '--window-size=390,844',
        '--hide-scrollbars',
        url
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Saved mobile screenshot: {out_file}")

print('\n=== GENERATING SIDE-BY-SIDE COMPARISON IMAGES ===')
for scene in SCENES:
    ref_path = scene['ref']
    smart_path = os.path.join(OUT_DIR, f"smart_{scene['id']}.png")
    if not (os.path.exists(ref_path) and os.path.exists(smart_path)):
        print(f"Skipping diff for {scene['id']}, missing file.")
        continue

    ref_img = cv2.imread(ref_path)
    smart_img = cv2.imread(smart_path)

    # Standardize size to 1440x900
    ref_img = cv2.resize(ref_img, (1440, 900))
    smart_img = cv2.resize(smart_img, (1440, 900))

    # Add header bars
    header_h = 60
    header = np.full((header_h, 2880 + 20, 3), 20, dtype=np.uint8)
    cv2.putText(header, f"MDX REFERENCE: {scene['title']}", (40, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
    cv2.putText(header, f"SMART CAMPUS RECREATION", (1440 + 60, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 180, 255), 2)

    # Vertical divider
    divider = np.full((900, 20, 3), 40, dtype=np.uint8)

    combined_body = np.hstack([ref_img, divider, smart_img])
    comparison = np.vstack([header, combined_body])

    diff_file = os.path.join(OUT_DIR, f"diff_{scene['id']}.png")
    cv2.imwrite(diff_file, comparison)
    print(f"Created comparison: {diff_file}")

print('ALL COMPARISONS CREATED!')
