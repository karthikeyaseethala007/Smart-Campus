import os
import cv2
import numpy as np

frame_indices = [1, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240]
labels = [
    "Frame 1: GLOBE (Hold)",
    "Frame 20: GLOBE (Hold)",
    "Frame 40: GLOBE -> ELEC (Pre/Energy)",
    "Frame 60: GLOBE -> ELEC (Branching)",
    "Frame 80: ELECTRICITY (Hold)",
    "Frame 100: ELECTRICITY (Hold)",
    "Frame 120: ELEC -> FIRE (Thermal Bloom)",
    "Frame 140: ELEC -> FIRE (Flame Settle)",
    "Frame 160: FIRE (Hold)",
    "Frame 180: FIRE -> LOCK (Cool/Reorganize)",
    "Frame 200: FIRE -> LOCK (Shackle/Body)",
    "Frame 220: LOCK (Hold)",
    "Frame 240: LOCK (Hold)"
]

frames_dir = "/Users/karthikeya.s/Documents/focus/diagnostic_test_13"
out_sheet = "/Users/karthikeya.s/Documents/focus/diagnostic_13_contact_sheet.png"

# Layout: 4 columns, 4 rows (13 frames + 3 info/legend cells)
cols = 4
rows = 4
cell_w = 480
cell_h = 270
label_h = 36

sheet_w = cols * cell_w
sheet_h = rows * (cell_h + label_h) + 60 # 60px header

sheet = np.zeros((sheet_h, sheet_w, 3), dtype=np.uint8)
sheet[:] = (20, 20, 20) # dark grey canvas

# Header
cv2.putText(sheet, "HERO PARTICLE SYSTEM: 13-FRAME DIAGNOSTIC CONTACT SHEET", (40, 40), 
            cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2, cv2.LINE_AA)

for i, (idx, label) in enumerate(zip(frame_indices, labels)):
    c = i % cols
    r = i // cols
    x = c * cell_w
    y = 60 + r * (cell_h + label_h)
    
    img_path = os.path.join(frames_dir, f"frame_{idx:03d}.png")
    img = cv2.imread(img_path)
    if img is not None:
        resized = cv2.resize(img, (cell_w, cell_h))
        sheet[y:y+cell_h, x:x+cell_w] = resized
    
    # Label bar
    bar_y = y + cell_h
    # Color coding based on state
    if "GLOBE (Hold)" in label:
        bar_color = (80, 40, 0)
        text_color = (255, 200, 100)
    elif "ELEC (Hold)" in label or "ELECTRICITY (Hold)" in label:
        bar_color = (0, 70, 90)
        text_color = (100, 240, 255)
    elif "FIRE (Hold)" in label:
        bar_color = (20, 40, 100)
        text_color = (80, 140, 255)
    elif "LOCK (Hold)" in label:
        bar_color = (30, 80, 30)
        text_color = (120, 255, 140)
    else:
        bar_color = (40, 40, 40)
        text_color = (220, 220, 220)
        
    sheet[bar_y:bar_y+label_h, x:x+cell_w] = bar_color
    cv2.putText(sheet, label, (x + 12, bar_y + 24), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.48, text_color, 1, cv2.LINE_AA)

cv2.imwrite(out_sheet, sheet)
print(f"Saved contact sheet to {out_sheet}")
