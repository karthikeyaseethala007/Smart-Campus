import cv2
import os
import numpy as np

cap = cv2.VideoCapture("references/mdx-reference.mov")
fps = cap.get(cv2.CAP_PROP_FPS)

cur_dir = "references/mdx-analysis/final-difference-audit/current_precision_captures"
out_dir = "references/mdx-analysis/final-difference-audit/precision_comparisons"
os.makedirs(out_dir, exist_ok=True)

pairs = [
    # Hero States & Intermediate Morphs
    ("01_hero_start", 0, "01_hero_start.png", "Hero Start / State 01 Globe"),
    ("01b_hero_25pct", 96, "01b_hero_25pct.png", "Hero 25% Progress"),
    ("02_hero_morph_01_start", 110, "02_hero_morph_01_start.png", "State 01 -> 02 Morph Start (Relaxing Sphere)"),
    ("02_hero_morph_01_peak", 132, "02_hero_morph_01_peak.png", "State 01 -> 02 Peak Deformation (Asymmetric Wave Swell)"),
    ("02_hero_electricity_resolve", 154, "02_hero_electricity_resolve.png", "State 02 Electricity Resolve"),
    ("02_hero_electricity_settle", 165, "02_hero_electricity_settle.png", "State 02 Electricity Settle"),
    ("02b_hero_50pct", 192, "02b_hero_50pct.png", "Hero 50% Progress"),
    ("02c_hero_morph_02_start", 170, "02c_hero_morph_02_start.png", "State 02 -> 03 Morph Start (Decoupling Rings)"),
    ("02c_hero_morph_02_peak", 186, "02c_hero_morph_02_peak.png", "State 02 -> 03 Peak Deformation (Vertical Flame Surge)"),
    ("02c_hero_fire_resolve", 198, "02c_hero_fire_resolve.png", "State 03 Fire Resolve"),
    ("02c_hero_fire_settle", 209, "02c_hero_fire_settle.png", "State 03 Fire Settle"),
    ("02d_hero_morph_03_start", 214, "02d_hero_morph_03_start.png", "State 03 -> 04 Morph Start (Inward Arch Curl)"),
    ("02d_hero_morph_03_peak", 230, "02d_hero_morph_03_peak.png", "State 03 -> 04 Peak Deformation (Arch & Tumbler Hybrid)"),
    ("02d_hero_lock_resolve", 242, "02d_hero_lock_resolve.png", "State 04 Lock Resolve"),
    ("02d_hero_lock_settle", 258, "02d_hero_lock_settle.png", "State 04 Lock Settle"),
    ("02e_hero_75pct", 287, "02e_hero_75pct.png", "Hero 75% Progress"),
    ("03_hero_transition", 334, "03_hero_transition.png", "Hero Exit & Optical Handoff to Editorial 01"),
    ("03b_hero_end", 383, "03b_hero_end.png", "Hero End / Editorial 01 Fully Locked"),

    # Subsequent Scenes
    ("04_editorial_01", 516, "04_editorial_01.png", "Editorial Scene 01 (One Campus)"),
    ("05_editorial_02", 663, "05_editorial_02.png", "Editorial Scene 02 (Detection to Action)"),
    ("06_cinematic", 761, "06_cinematic.png", "Cinematic Stage (Dominant Rounded Stage)"),
    ("07_floating", 924, "07_floating.png", "Four-Pillar Floating System (Staggered Pills)"),
    ("08_dark_takeover", 1042, "08_dark_takeover.png", "Dark Takeover Physical Layer"),
    ("09_showcase", 1091, "09_showcase.png", "Dark Visual Showcase (Editorial Tiles)"),
    ("10_contact", 1189, "10_contact.png", "Warm Contact Scene"),
    ("11_prefooter", 1268, "11_prefooter.png", "Dark Pre-Footer (Signal to Response)"),
    ("12_footer", 1400, "12_footer.png", "Monolithic SMART CAMPUS Black Footer")
]

# Common output resolution: 720 x 450 per panel -> triptych 2160 x 450 (+ 60px banner = 2160 x 510)
pw, ph = 720, 450
banner_h = 60

print(f"Generating {len(pairs)} precision side-by-side comparison images...")

for idx, (label, ref_f, cur_file, title) in enumerate(pairs):
    cap.set(cv2.CAP_PROP_POS_FRAMES, ref_f)
    ret, ref_frame = cap.read()
    if not ret:
        print(f"Failed to read ref frame {ref_f}")
        continue
    
    cur_path = os.path.join(cur_dir, cur_file)
    if not os.path.exists(cur_path):
        print(f"Missing current capture: {cur_path}")
        continue
    cur_frame = cv2.imread(cur_path)

    ref_resized = cv2.resize(ref_frame, (pw, ph))
    cur_resized = cv2.resize(cur_frame, (pw, ph))

    # Absolute difference
    diff = cv2.absdiff(ref_resized, cur_resized)
    diff_gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
    heatmap = cv2.applyColorMap(cv2.equalizeHist(diff_gray), cv2.COLORMAP_INFERNO)

    mean_diff = np.mean(diff_gray)

    # Composite Triptych
    triptych = np.hstack([ref_resized, cur_resized, heatmap])

    # Add top banner
    banner = np.zeros((banner_h, triptych.shape[1], 3), dtype=np.uint8)
    banner[:] = (18, 22, 28) # dark slate background

    # Banner text
    ref_sec = ref_f / fps
    cv2.putText(banner, f"MDX REFERENCE (t={ref_sec:.2f}s, frame {ref_f})", (24, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)
    cv2.putText(banner, f"SMART CAMPUS (Current Precision Pass)", (pw + 24, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 210, 255), 2)
    cv2.putText(banner, f"DIFF HEATMAP (Mean Error: {mean_diff:.1f})", (pw * 2 + 24, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (120, 200, 255), 2)

    final_img = np.vstack([banner, triptych])

    out_file = os.path.join(out_dir, f"{label}.jpg")
    cv2.imwrite(out_file, final_img)
    print(f"[{idx+1}/{len(pairs)}] Generated {label}.jpg (mean diff: {mean_diff:.2f})")

cap.release()
print("=== ALL COMPARISON IMAGES GENERATED SUCCESSFULLY ===")
