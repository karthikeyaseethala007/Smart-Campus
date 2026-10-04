import cv2
import numpy as np
import os

print("=== BUILDING 13 TRANSITION CONTACT SHEET: MDX REF VS NEW BLENDER ===")

cap = cv2.VideoCapture('/Users/karthikeya.s/Documents/focus/references/mdx-reference.mov')
blender_dir = '/Users/karthikeya.s/Documents/focus/references/mdx-analysis/13_transition_animated_blender'
out_path = '/Users/karthikeya.s/Documents/focus/references/mdx-analysis/13_transition_contact_sheet.png'

milestones = [
    ("01. Globe Hold", 110, "01_globe_hold.png"),
    ("02. Globe 25% Deformation", 158, "02_globe_25pct.png"),
    ("03. Globe 50% Deformation (Energy Peak)", 168, "03_globe_50pct.png"),
    ("04. Globe 75% Deformation (Hybrid)", 172, "04_globe_75pct.png"),
    ("05. Electricity Resolved", 178, "05_electricity_resolved.png"),
    ("06. Electricity 25% Deformation", 192, "06_electricity_25pct.png"),
    ("07. Electricity 50% Deformation (Energy Peak)", 196, "07_electricity_50pct.png"),
    ("08. Electricity 75% Deformation (Hybrid)", 204, "08_electricity_75pct.png"),
    ("09. Fire Resolved", 214, "09_fire_resolved.png"),
    ("10. Fire 25% Deformation", 218, "10_fire_25pct.png"),
    ("11. Fire 50% Deformation (Energy Peak)", 222, "11_fire_50pct.png"),
    ("12. Fire 75% Deformation (Hybrid)", 226, "12_fire_75pct.png"),
    ("13. Lock Resolved", 242, "13_lock_resolved.png"),
]

cell_w = 480
cell_h = 400
header_h = 36

row_imgs = []

for title, mdx_f, blender_file in milestones:
    # 1. Extract MDX frame
    cap.set(cv2.CAP_PROP_POS_FRAMES, mdx_f)
    ret, mdx_frame = cap.read()
    if not ret:
        print(f"Failed to read MDX frame {mdx_f}")
        continue
    
    # Crop center of MDX frame (2940x1912)
    h, w = mdx_frame.shape[:2]
    cx, cy = w // 2, int(h * 0.46)
    crop_size = 900
    x1 = max(0, cx - crop_size // 2)
    y1 = max(0, cy - crop_size // 2)
    mdx_crop = mdx_frame[y1:y1+crop_size, x1:x1+crop_size]
    mdx_resized = cv2.resize(mdx_crop, (cell_w, cell_h), interpolation=cv2.INTER_AREA)

    # 2. Load Blender frame (RGBA)
    b_path = os.path.join(blender_dir, blender_file)
    b_img = cv2.imread(b_path, cv2.IMREAD_UNCHANGED)
    if b_img is None:
        print(f"Missing Blender frame: {b_path}")
        continue
    
    # Composite Blender RGBA over MDX-like clean gradient background (#EDEDF0)
    bg = np.full((b_img.shape[0], b_img.shape[1], 3), (238, 237, 237), dtype=np.uint8)
    if b_img.shape[2] == 4:
        alpha = b_img[:, :, 3:4] / 255.0
        b_rgb = b_img[:, :, :3]
        b_comp = (b_rgb * alpha + bg * (1.0 - alpha)).astype(np.uint8)
    else:
        b_comp = b_img

    # Crop center of Blender (960x540)
    bh, bw = b_comp.shape[:2]
    bcx, bcy = bw // 2, bh // 2
    b_cropsize = 460
    bx1 = max(0, bcx - b_cropsize // 2)
    by1 = max(0, bcy - b_cropsize // 2)
    b_cropped = b_comp[by1:by1+b_cropsize, bx1:bx1+b_cropsize]
    blender_resized = cv2.resize(b_cropped, (cell_w, cell_h), interpolation=cv2.INTER_AREA)

    # Combine Left (MDX) and Right (Blender)
    pair = np.hstack([mdx_resized, blender_resized])
    
    # Create header bar
    header = np.zeros((header_h, cell_w * 2, 3), dtype=np.uint8)
    header[:] = (30, 30, 30)
    cv2.putText(header, f"{title} | Left: MDX Ref (f{mdx_f}) | Right: New Blender Particle Trajectory",
                (14, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.58, (255, 255, 255), 1, cv2.LINE_AA)
    
    row = np.vstack([header, pair])
    row_imgs.append(row)

cap.release()

contact_sheet = np.vstack(row_imgs)
cv2.imwrite(out_path, contact_sheet)
print(f"Successfully saved contact sheet ({contact_sheet.shape[1]}x{contact_sheet.shape[0]}) to {out_path}")
