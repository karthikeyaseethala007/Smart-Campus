import cv2
import os
import glob
import numpy as np

blend_dir = "references/mdx-analysis/final-difference-audit/transition_13_test/blender_frames"
out_dir = "references/mdx-analysis/final-difference-audit/transition_13_test"

test_pairs = [
    (1, "01_Globe_hold", 0, "0.00s", "1. Globe Hold"),
    (61, "02_Globe_25pct_deformation", 115, "2.34s", "2. Globe 25% (Pre-Distort)"),
    (68, "03_Globe_50pct_deformation", 132, "2.69s", "3. Globe 50% (Energy Swell)"),
    (74, "04_Globe_75pct_deformation", 145, "2.95s", "4. Globe 75% (Wave Loops)"),
    (80, "05_Electricity_resolved", 154, "3.13s", "5. Electricity Resolved"),
    (111, "06_Electricity_25pct_deformation", 175, "3.56s", "6. Elec 25% (Ring Decouple)"),
    (118, "07_Electricity_50pct_deformation", 186, "3.78s", "7. Elec 50% (Plume Surge)"),
    (124, "08_Electricity_75pct_deformation", 192, "3.91s", "8. Elec 75% (Flame Body)"),
    (131, "09_Fire_resolved", 198, "4.03s", "9. Fire Resolved"),
    (167, "10_Fire_25pct_deformation", 220, "4.48s", "10. Fire 25% (Inward Curl)"),
    (174, "11_Fire_50pct_deformation", 230, "4.68s", "11. Fire 50% (Arch Closing)"),
    (180, "12_Fire_75pct_deformation", 236, "4.80s", "12. Fire 75% (Lock Solidify)"),
    (187, "13_Lock_resolved", 242, "4.92s", "13. Lock Resolved")
]

cap_ref = cv2.VideoCapture("references/mdx-reference.mov")
crop_w, crop_h = 320, 320
rows = []
bg_color = np.array([238, 237, 237], dtype=np.uint8)

for b_frame, b_name, m_frame, m_sec, title in test_pairs:
    # 1. MDX particle crop (approx centered at X=606/980, Y=283/637)
    cap_ref.set(cv2.CAP_PROP_POS_FRAMES, m_frame)
    ret, ref_img = cap_ref.read()
    h_ref, w_ref, _ = ref_img.shape
    cx_ref = int(0.618 * w_ref)
    cy_ref = int(0.444 * h_ref)
    half_r = int(0.20 * h_ref)
    crop_ref = ref_img[max(0, cy_ref - half_r):min(h_ref, cy_ref + half_r), max(0, cx_ref - half_r):min(w_ref, cx_ref + half_r)]
    p_ref = cv2.resize(crop_ref, (crop_w, crop_h), interpolation=cv2.INTER_AREA)

    # 2. Blender particle crop (centered at X=960, Y=740 in 1920x1080)
    b_path = f"{blend_dir}/frame_{b_frame:03d}_{b_name}.png"
    blend_rgba = cv2.imread(b_path, cv2.IMREAD_UNCHANGED)
    canvas_bg = np.full((1080, 1920, 3), bg_color, dtype=np.uint8)
    b, g, r, a = cv2.split(blend_rgba)
    alpha = (a.astype(np.float32) / 255.0)[:, :, np.newaxis]
    rgb = cv2.merge([b, g, r])
    composited = (rgb.astype(np.float32) * alpha + canvas_bg.astype(np.float32) * (1.0 - alpha)).astype(np.uint8)
    
    cx_b, cy_b = 960, 745
    half_b = 400
    crop_b = composited[max(0, cy_b - half_b):min(1080, cy_b + half_b), max(0, cx_b - half_b):min(1920, cx_b + half_b)]
    p_b = cv2.resize(crop_b, (crop_w, crop_h), interpolation=cv2.INTER_AREA)

    # Label banner
    banner = np.zeros((32, crop_w * 2, 3), dtype=np.uint8)
    banner[:] = (20, 24, 28)
    cv2.putText(banner, f"MDX REF | {title}", (12, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (255, 255, 255), 1)
    cv2.putText(banner, f"NEW BLENDER (f={b_frame})", (crop_w + 12, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (100, 220, 255), 1)

    row = np.vstack([banner, np.hstack([p_ref, p_b])])
    rows.append(row)

cap_ref.release()

grid = np.vstack(rows)
detail_out = f"{out_dir}/particle_detail_comparison.jpg"
cv2.imwrite(detail_out, grid, [cv2.IMWRITE_JPEG_QUALITY, 90])
# Also copy to artifacts
import shutil
shutil.copyfile(detail_out, "/Users/karthikeya.s/.gemini/antigravity-ide/brain/751a256d-a337-4c01-8c6b-427f3a5ae3a6/particle_detail_comparison.jpg")
print(f"Saved particle detail montage to {detail_out} and brain artifacts!")
