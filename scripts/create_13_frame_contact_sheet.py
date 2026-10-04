import cv2
import os
import numpy as np

print("=== ASSEMBLING 13-FRAME CONTACT SHEET ===")

blend_dir = "references/mdx-analysis/final-difference-audit/transition_13_test/blender_frames"
out_dir = "references/mdx-analysis/final-difference-audit/transition_13_test"
os.makedirs(out_dir, exist_ok=True)

test_pairs = [
    (1, "01_Globe_hold", 0, "0.00s", "Globe Hold (Stable Shell)"),
    (61, "02_Globe_25pct_deformation", 115, "2.34s", "Globe 25% Morph (Pre-Distortion)"),
    (68, "03_Globe_50pct_deformation", 132, "2.69s", "Globe 50% Morph (Energy Expansion)"),
    (74, "04_Globe_75pct_deformation", 145, "2.95s", "Globe 75% Morph (Intermediate Hybrid)"),
    (80, "05_Electricity_resolved", 154, "3.13s", "Electricity Resolved (Wave Harmonics)"),
    (111, "06_Electricity_25pct_deformation", 175, "3.56s", "Electricity 25% Morph (Ring Decouple)"),
    (118, "07_Electricity_50pct_deformation", 186, "3.78s", "Electricity 50% Morph (Vertical Surge)"),
    (124, "08_Electricity_75pct_deformation", 192, "3.91s", "Electricity 75% Morph (Flame Body)"),
    (131, "09_Fire_resolved", 198, "4.03s", "Fire Resolved (Laminar Flame)"),
    (167, "10_Fire_25pct_deformation", 220, "4.48s", "Fire 25% Morph (Inward Tip Curl)"),
    (174, "11_Fire_50pct_deformation", 230, "4.68s", "Fire 50% Morph (Arch & Tumbler Hybrid)"),
    (180, "12_Fire_75pct_deformation", 236, "4.80s", "Fire 75% Morph (Lock Consolidation)"),
    (187, "13_Lock_resolved", 242, "4.92s", "Lock Resolved (Physical Equilibrium)")
]

cap_ref = cv2.VideoCapture("references/mdx-reference.mov")

pw, ph = 600, 390
banner_h = 42
panels = []

# Web stage background color
bg_color = np.array([238, 237, 237], dtype=np.uint8)

print(f"Processing {len(test_pairs)} comparison states...")

for b_frame, b_name, m_frame, m_sec, title in test_pairs:
    # 1. Read MDX frame
    cap_ref.set(cv2.CAP_PROP_POS_FRAMES, m_frame)
    ret, ref_img = cap_ref.read()
    if not ret:
        print(f"Failed to read MDX frame {m_frame}")
        continue
    ref_panel = cv2.resize(ref_img, (pw, ph), interpolation=cv2.INTER_AREA)

    # 2. Read new Blender frame
    b_path = f"{blend_dir}/frame_{b_frame:03d}_{b_name}.png"
    if not os.path.exists(b_path):
        # Also try without b_name
        b_path = f"{blend_dir}/frame_{b_frame:03d}.png"
    
    if not os.path.exists(b_path):
        print(f"Blender frame not found: {b_path}")
        continue

    blend_rgba = cv2.imread(b_path, cv2.IMREAD_UNCHANGED)
    canvas_bg = np.full((1080, 1920, 3), bg_color, dtype=np.uint8)
    b, g, r, a = cv2.split(blend_rgba)
    alpha = (a.astype(np.float32) / 255.0)[:, :, np.newaxis]
    rgb = cv2.merge([b, g, r])
    composited = (rgb.astype(np.float32) * alpha + canvas_bg.astype(np.float32) * (1.0 - alpha)).astype(np.uint8)
    cur_panel = cv2.resize(composited, (pw, ph), interpolation=cv2.INTER_AREA)

    # 3. Compute difference heatmap
    diff = cv2.absdiff(ref_panel, cur_panel)
    diff_gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
    heatmap = cv2.applyColorMap(cv2.equalizeHist(diff_gray), cv2.COLORMAP_JET)

    # 4. Construct labeled row banner
    banner = np.zeros((banner_h, pw * 3, 3), dtype=np.uint8)
    banner[:] = (16, 20, 24)
    font = cv2.FONT_HERSHEY_SIMPLEX
    
    cv2.putText(banner, f"MDX GROUND TRUTH (f={m_frame} | t={m_sec})", (16, 28), font, 0.60, (255, 255, 255), 2)
    cv2.putText(banner, f"BLENDER CHOREOGRAPHY (f={b_frame}) - {title}", (pw + 16, 28), font, 0.60, (100, 220, 255), 2)
    cv2.putText(banner, f"HEATMAP DIFFERENCE", (pw * 2 + 16, 28), font, 0.55, (120, 180, 255), 1)

    triptych = np.vstack([banner, np.hstack([ref_panel, cur_panel, heatmap])])
    
    # Save individual state comparison
    state_out = f"{out_dir}/state_{b_name}.jpg"
    cv2.imwrite(state_out, triptych, [cv2.IMWRITE_JPEG_QUALITY, 90])
    print(f"Saved: {state_out}")

    # Add to vertical contact sheet
    panels.append(triptych)

cap_ref.release()

if panels:
    # Scale down panels for consolidated contact sheet
    contact_sheet = np.vstack(panels)
    contact_out = f"{out_dir}/transition_contact_sheet.jpg"
    cv2.imwrite(contact_out, contact_sheet, [cv2.IMWRITE_JPEG_QUALITY, 85])
    print(f"\nALL 13 STATES ASSEMBLED INTO CONTACT SHEET: {contact_out}")
    print(f"Dimensions: {contact_sheet.shape[1]}x{contact_sheet.shape[0]} px")
