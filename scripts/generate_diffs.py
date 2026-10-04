import cv2
import numpy as np
import os

comp_dir = '/Users/karthikeya.s/Documents/focus/references/mdx-analysis/comparisons'
ref_base = '/Users/karthikeya.s/Documents/focus/references/mdx-analysis'

pairs = [
    ('01_hero_start', '01-hero/ref_01.5s.png', 'MDX REFERENCE: Scene 01: Hero Start'),
    ('01_hero_morph', '01-hero/ref_05.0s.png', 'MDX REFERENCE: Scene 01: Hero Morph (Lock/Fire)'),
    ('02_editorial_stage_a', '02-editorial/ref_10.5s.png', 'MDX REFERENCE: Scene 02: Editorial Stage A'),
    ('02_editorial_stage_b', '02-editorial/ref_13.5s.png', 'MDX REFERENCE: Scene 02: Editorial Stage B'),
    ('03_widescreen_system', '03-experience/ref_17.0s.png', 'MDX REFERENCE: Scene 03: Widescreen Experience'),
    ('04_floating_pillars', '04-floating-pillars/ref_18.5s.png', 'MDX REFERENCE: Scene 04: Floating Pillars'),
    ('05_dark_showcase', '05-dark-showcase/ref_20.5s.png', 'MDX REFERENCE: Scene 05: Dark Showcase'),
    ('06_contact_entry', '06-contact/ref_23.0s.png', 'MDX REFERENCE: Scene 06: Contact Entry'),
    ('07_massive_footer', '07-footer/ref_28.5s.png', 'MDX REFERENCE: Scene 07: Massive Footer'),
]

header_h = 60
font = cv2.FONT_HERSHEY_SIMPLEX

for name, ref_rel, title in pairs:
    ref_path = os.path.join(ref_base, ref_rel)
    smart_path = os.path.join(comp_dir, f'smart_campus_{name}.png')
    out_path = os.path.join(comp_dir, f'diff_v4_{name}.png')

    if not os.path.exists(ref_path) or not os.path.exists(smart_path):
        print(f"Skipping {name}: ref or smart capture missing")
        continue

    ref_img = cv2.imread(ref_path)
    smart_img = cv2.imread(smart_path)

    # Standardize to 1440x900
    target_w, target_h = 1440, 900
    ref_resized = cv2.resize(ref_img, (target_w, target_h))
    smart_resized = cv2.resize(smart_img, (target_w, target_h))

    # Add header bars
    ref_canvas = np.zeros((target_h + header_h, target_w, 3), dtype=np.uint8)
    smart_canvas = np.zeros((target_h + header_h, target_w, 3), dtype=np.uint8)

    ref_canvas[:header_h, :] = (20, 20, 20)
    smart_canvas[:header_h, :] = (20, 20, 20)

    cv2.putText(ref_canvas, title, (24, 40), font, 1.0, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(smart_canvas, "SMART CAMPUS RECREATION", (24, 40), font, 1.0, (0, 200, 255), 2, cv2.LINE_AA)

    ref_canvas[header_h:, :] = ref_resized
    smart_canvas[header_h:, :] = smart_resized

    diff_img = np.hstack([ref_canvas, smart_canvas])
    cv2.imwrite(out_path, diff_img)
    print(f"Generated side-by-side diff: diff_v4_{name}.png")
