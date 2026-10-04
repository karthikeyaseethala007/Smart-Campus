import cv2
import numpy as np
import os
import shutil

scenes = [
    {
        'id': '01_hero',
        'alt_id': '01-hero',
        'ref_src': 'references/mdx-analysis/01-hero/ref_01.5s.png',
        'title': '01 HERO (0.00-0.25)'
    },
    {
        'id': '02_editorial_1',
        'alt_id': '02-editorial-1',
        'ref_src': 'references/mdx-analysis/02-editorial/ref_10.5s.png',
        'title': '02 EDITORIAL 1 (0.25-0.39)'
    },
    {
        'id': '03_editorial_2',
        'alt_id': '03-editorial-2',
        'ref_src': 'references/mdx-analysis/02-editorial/ref_13.5s.png',
        'title': '03 EDITORIAL 2 (0.39-0.52)'
    },
    {
        'id': '04_cinematic',
        'alt_id': '04-cinematic',
        'ref_src': 'references/mdx-analysis/03-experience/ref_15.5s.png',
        'title': '04 CINEMATIC (0.52-0.65)'
    },
    {
        'id': '05_floating',
        'alt_id': '05-floating',
        'ref_src': 'references/mdx-analysis/04-floating-pillars/ref_18.5s.png',
        'title': '05 FLOATING (0.65-0.76)'
    },
    {
        'id': '06_dark_showcase',
        'alt_id': '06-dark-showcase',
        'ref_src': 'references/mdx-analysis/05-dark-showcase/ref_20.5s.png',
        'title': '06 DARK SHOWCASE (0.76-0.87)'
    },
    {
        'id': '07_contact',
        'alt_id': '07-contact',
        'ref_src': 'references/mdx-analysis/06-contact/ref_23.0s.png',
        'title': '07 CONTACT (0.87-0.94)'
    },
    {
        'id': '08_prefooter',
        'alt_id': '08-dark-prefooter',
        'ref_src': 'references/mdx-analysis/final-difference-audit/08-dark-prefooter/mdx_reference.png',
        'title': '08 DARK PREFOOTER (0.94-0.97)'
    },
    {
        'id': '09_footer',
        'alt_id': '09-footer',
        'ref_src': 'references/mdx-analysis/07-footer/ref_28.5s.png',
        'title': '09 FOOTER (0.97-1.00)'
    },
]

base_audit = 'references/mdx-analysis/final-difference-audit'
tw, th = 1440, 900
header_h = 56
font = cv2.FONT_HERSHEY_DUPLEX

progression_rows = []

for s in scenes:
    dir1 = os.path.join(base_audit, s['id'])
    dir2 = os.path.join(base_audit, s['alt_id'])
    os.makedirs(dir1, exist_ok=True)
    os.makedirs(dir2, exist_ok=True)

    # 1. Ensure mdx_frame.png exists
    ref_path = s['ref_src']
    if os.path.exists(ref_path):
        for d in [dir1, dir2]:
            dst1 = os.path.join(d, 'mdx_frame.png')
            dst2 = os.path.join(d, 'mdx_reference.png')
            if os.path.abspath(ref_path) != os.path.abspath(dst1):
                shutil.copyfile(ref_path, dst1)
            if os.path.abspath(ref_path) != os.path.abspath(dst2):
                shutil.copyfile(ref_path, dst2)
    else:
        # Check if already in dir
        alt_ref = os.path.join(dir2, 'mdx_reference.png')
        if os.path.exists(alt_ref):
            ref_path = alt_ref
            dst = os.path.join(dir1, 'mdx_frame.png')
            if os.path.abspath(ref_path) != os.path.abspath(dst):
                shutil.copyfile(ref_path, dst)

    # 2. Check current_frame.png
    cur_path = os.path.join(dir1, 'current_frame.png')
    if not os.path.exists(cur_path):
        cur_path = os.path.join(dir2, 'current_frame.png')

    if not os.path.exists(ref_path) or not os.path.exists(cur_path):
        print(f"Skipping {s['id']}: missing files (ref: {os.path.exists(ref_path)}, cur: {os.path.exists(cur_path)})")
        continue

    ref_img = cv2.imread(ref_path)
    cur_img = cv2.imread(cur_path)

    ref_res = cv2.resize(ref_img, (tw, th))
    cur_res = cv2.resize(cur_img, (tw, th))

    # 3. Compute Difference Frame & Colormap Heatmap
    abs_diff = cv2.absdiff(ref_res, cur_res)
    gray_diff = cv2.cvtColor(abs_diff, cv2.COLOR_BGR2GRAY)
    # Amplify subtle differences
    amplified = cv2.multiply(gray_diff, 1.8)
    heatmap = cv2.applyColorMap(amplified, cv2.COLORMAP_INFERNO)

    # Save difference frames
    cv2.imwrite(os.path.join(dir1, 'diff_frame.png'), heatmap)
    cv2.imwrite(os.path.join(dir2, 'diff_frame.png'), heatmap)

    # 4. Generate 3-Panel Side-By-Side: MDX | SMART CAMPUS | DIFF
    panel_w = tw * 3
    panel_h = th + header_h
    side_by_side = np.zeros((panel_h, panel_w, 3), dtype=np.uint8)

    # Headers
    cv2.putText(side_by_side, f"MDX REFERENCE · {s['title']}", (24, 38), font, 0.9, (0, 220, 255), 2, cv2.LINE_AA)
    cv2.putText(side_by_side, f"SMART CAMPUS (NEW MASTER TIMELINE) · {s['title']}", (tw + 24, 38), font, 0.9, (0, 165, 255), 2, cv2.LINE_AA)
    cv2.putText(side_by_side, f"DELTA HEATMAP · {s['title']}", (tw * 2 + 24, 38), font, 0.9, (80, 80, 255), 2, cv2.LINE_AA)

    side_by_side[header_h:, :tw] = ref_res
    side_by_side[header_h:, tw:tw*2] = cur_res
    side_by_side[header_h:, tw*2:] = heatmap

    cv2.imwrite(os.path.join(dir1, 'side_by_side.png'), side_by_side)
    cv2.imwrite(os.path.join(dir2, 'side_by_side.png'), side_by_side)
    cv2.imwrite(os.path.join(dir1, 'side_by_side_comparison.png'), side_by_side)
    cv2.imwrite(os.path.join(dir2, 'side_by_side_comparison.png'), side_by_side)

    # Prepare small row for continuous progression sheet (scaled to 1920 width)
    scale = 1920.0 / panel_w
    row_small = cv2.resize(side_by_side, (1920, int(panel_h * scale)))
    progression_rows.append(row_small)

    print(f"Generated audit suite for {s['id']}")

# 5. Build Continuous Progression Sheet
if progression_rows:
    full_sheet = np.vstack(progression_rows)
    sheet_out = os.path.join(base_audit, 'continuous_progression_sheet.png')
    cv2.imwrite(sheet_out, full_sheet)
    print(f"Continuous progression sheet generated: {sheet_out}")
