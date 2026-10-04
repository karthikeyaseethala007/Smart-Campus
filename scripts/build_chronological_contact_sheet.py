import cv2
import numpy as np
import os

print("=== ASSEMBLING CHRONOLOGICAL TRANSITION TEST CONTACT SHEET ===")

frames_dir = "/Users/karthikeya.s/Documents/focus/references/mdx-analysis/exact_transition_test_frames"
out_sheet = "/Users/karthikeya.s/Documents/focus/references/mdx-analysis/chronological_transition_test_contact_sheet.png"

milestones = [
    ("01_Globe_Hold_End_f069.png", "01. Globe HOLD (End, f69)"),
    ("02_Globe_to_Elec_15pct_f073.png", "02. Globe -> Elec 15% (f73)"),
    ("03_Globe_to_Elec_40pct_f080.png", "03. Globe -> Elec 40% (f80)"),
    ("04_Globe_to_Elec_60pct_f085.png", "04. Globe -> Elec 60% (f85)"),
    ("05_Globe_to_Elec_80pct_f091.png", "05. Globe -> Elec 80% (f91)"),
    ("06_Electricity_Hold_f102.png", "06. Electricity HOLD (f102)"),
    ("07_Elec_to_Fire_15pct_f110.png", "07. Elec -> Fire 15% (f110)"),
    ("08_Elec_to_Fire_40pct_f114.png", "08. Elec -> Fire 40% (f114)"),
    ("09_Elec_to_Fire_60pct_f118.png", "09. Elec -> Fire 60% (f118)"),
    ("10_Elec_to_Fire_80pct_f121.png", "10. Elec -> Fire 80% (f121)"),
    ("11_Fire_Hold_f130.png", "11. Fire HOLD (f130)"),
    ("12_Fire_to_Lock_15pct_f138.png", "12. Fire -> Lock 15% (f138)"),
    ("13_Fire_to_Lock_50pct_f144.png", "13. Fire -> Lock 50% (f144)"),
    ("14_Fire_to_Lock_80pct_f149.png", "14. Fire -> Lock 80% (f149)"),
    ("15_Lock_Hold_f156.png", "15. Lock HOLD (f156)"),
]

cell_w = 480
cell_h = 400
header_h = 32

processed_cells = []

for fname, title in milestones:
    fpath = os.path.join(frames_dir, fname)
    img = cv2.imread(fpath, cv2.IMREAD_UNCHANGED)
    if img is None:
        print(f"Missing: {fpath}")
        continue
    
    # Composite over soft studio background (#F0F0F2)
    bg = np.full((img.shape[0], img.shape[1], 3), (242, 240, 240), dtype=np.uint8)
    if img.shape[2] == 4:
        alpha = img[:, :, 3:4] / 255.0
        rgb = img[:, :, :3]
        comp = (rgb * alpha + bg * (1.0 - alpha)).astype(np.uint8)
    else:
        comp = img
    
    # Center crop particle object
    h, w = comp.shape[:2]
    cx, cy = w // 2, h // 2
    crop_size = 460
    x1 = max(0, cx - crop_size // 2)
    y1 = max(0, cy - crop_size // 2)
    cropped = comp[y1:y1+crop_size, x1:x1+crop_size]
    resized = cv2.resize(cropped, (cell_w, cell_h), interpolation=cv2.INTER_AREA)

    # Header title banner
    header = np.zeros((header_h, cell_w, 3), dtype=np.uint8)
    header[:] = (28, 28, 28)
    cv2.putText(header, title, (12, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (255, 255, 255), 1, cv2.LINE_AA)
    
    cell = np.vstack([header, resized])
    processed_cells.append(cell)

# Grid layout: 3 columns x 5 rows
cols = 3
rows = 5
grid_rows = []
for r in range(rows):
    row_cells = processed_cells[r*cols : (r+1)*cols]
    grid_rows.append(np.hstack(row_cells))

full_sheet = np.vstack(grid_rows)
cv2.imwrite(out_sheet, full_sheet)
print(f"Saved contact sheet ({full_sheet.shape[1]}x{full_sheet.shape[0]}) to {out_sheet}")
