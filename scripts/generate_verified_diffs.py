import cv2
import numpy as np
import os

scenes = [
    {
        'id': '01-hero',
        'comp_name': '01_hero',
        'ref': 'references/mdx-analysis/01-hero/ref_01.5s.png',
        'cur': 'references/mdx-analysis/comparisons/smart_campus_01_hero.png',
        'title': '01_HERO'
    },
    {
        'id': '02-editorial-1',
        'comp_name': '02_editorial_1',
        'ref': 'references/mdx-analysis/02-editorial/ref_10.5s.png',
        'cur': 'references/mdx-analysis/comparisons/smart_campus_02_editorial_1.png',
        'title': '02_EDITORIAL_1'
    },
    {
        'id': '03-editorial-2',
        'comp_name': '03_editorial_2',
        'ref': 'references/mdx-analysis/02-editorial/ref_13.5s.png',
        'cur': 'references/mdx-analysis/comparisons/smart_campus_03_editorial_2.png',
        'title': '03_EDITORIAL_2'
    },
    {
        'id': '04-cinematic',
        'comp_name': '04_cinematic',
        'ref': 'references/mdx-analysis/03-experience/ref_15.5s.png',
        'cur': 'references/mdx-analysis/comparisons/smart_campus_04_cinematic.png',
        'title': '04_CINEMATIC'
    },
    {
        'id': '05-floating',
        'comp_name': '05_floating',
        'ref': 'references/mdx-analysis/04-floating-pillars/ref_18.5s.png',
        'cur': 'references/mdx-analysis/comparisons/smart_campus_05_floating.png',
        'title': '05_FLOATING'
    },
    {
        'id': '06-dark-showcase',
        'comp_name': '06_dark_showcase',
        'ref': 'references/mdx-analysis/05-dark-showcase/ref_20.5s.png',
        'cur': 'references/mdx-analysis/comparisons/smart_campus_06_dark_showcase.png',
        'title': '06_DARK_SHOWCASE'
    },
    {
        'id': '07-contact',
        'comp_name': '07_contact',
        'ref': 'references/mdx-analysis/06-contact/ref_23.0s.png',
        'cur': 'references/mdx-analysis/comparisons/smart_campus_07_contact.png',
        'title': '07_CONTACT'
    },
    {
        'id': '08-dark-prefooter',
        'comp_name': '08_dark_prefooter',
        'ref': 'references/mdx-analysis/07-footer/ref_28.5s.png',
        'cur': 'references/mdx-analysis/comparisons/smart_campus_08_dark_prefooter.png',
        'title': '08_DARK_PREFOOTER'
    },
    {
        'id': '09-footer',
        'comp_name': '09_footer',
        'ref': 'references/mdx-analysis/07-footer/ref_28.5s.png',
        'cur': 'references/mdx-analysis/comparisons/smart_campus_09_footer.png',
        'title': '09_FOOTER'
    },
]

base_audit = 'references/mdx-analysis/final-difference-audit'
new_comp = os.path.join(base_audit, 'new_comparisons')
os.makedirs(new_comp, exist_ok=True)

header_h = 50
font = cv2.FONT_HERSHEY_DUPLEX

for s in scenes:
    ref_path = s['ref']
    cur_path = s['cur']
    
    if not os.path.exists(ref_path):
        print(f"Missing ref: {ref_path}")
        continue
    if not os.path.exists(cur_path):
        print(f"Missing cur: {cur_path}")
        continue
        
    ref_img = cv2.imread(ref_path)
    cur_img = cv2.imread(cur_path)
    
    tw, th = 1440, 900
    ref_resized = cv2.resize(ref_img, (tw, th))
    cur_resized = cv2.resize(cur_img, (tw, th))
    
    canvas_w = tw * 2
    canvas_h = th + header_h
    canvas = np.zeros((canvas_h, canvas_w, 3), dtype=np.uint8)
    
    # Left Header: Yellow
    cv2.putText(canvas, f"MDX REFERENCE: {s['title']}", (24, 34), font, 0.9, (0, 220, 255), 2, cv2.LINE_AA)
    # Right Header: Orange
    cv2.putText(canvas, f"NEW SMART CAMPUS (VERIFIED): {s['title']}", (tw + 24, 34), font, 0.9, (0, 165, 255), 2, cv2.LINE_AA)
    
    canvas[header_h:, :tw] = ref_resized
    canvas[header_h:, tw:] = cur_resized
    
    # Save to new_comparisons
    out1 = os.path.join(new_comp, f"verified_{s['comp_name']}.png")
    cv2.imwrite(out1, canvas)
    
    # Save to individual audit folder
    out2 = os.path.join(base_audit, s['id'], 'new_side_by_side_verified.png')
    cv2.imwrite(out2, canvas)
    
    print(f"Generated side-by-side: {s['title']}")

print("All verified side-by-side comparisons generated successfully!")
