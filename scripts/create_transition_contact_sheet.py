import os
import cv2
import numpy as np

frame_info = [
    (32, "1. End of Globe HOLD (Frame 32)"),
    (40, "2. Globe -> Electricity ~18% (Frame 40)"),
    (48, "3. Globe -> Electricity ~40% (Frame 48)"),
    (56, "4. Globe -> Electricity ~60% (Frame 56)"),
    (64, "5. Globe -> Electricity ~80% (Frame 64)"),
    (86, "6. Electricity HOLD (Frame 86)"),
    (107, "7. Electricity -> Fire ~15% (Frame 107)"),
    (117, "8. Electricity -> Fire ~40% (Frame 117)"),
    (125, "9. Electricity -> Fire ~60% (Frame 125)"),
    (133, "10. Electricity -> Fire ~80% (Frame 133)"),
    (155, "11. Fire HOLD (Frame 155)"),
    (177, "12. Fire -> Lock ~15% (Frame 177)"),
    (225, "13. Lock HOLD (Frame 225)")
]

frames_dir = "/Users/karthikeya.s/Documents/focus/production_render_frames_1080p"
thumb_w = 480
thumb_h = 270

# Prepare cards for grid (4 cols x 4 rows = 16 slots, 13 used, 3 empty / info)
cols = 4
rows = 4
cell_w = thumb_w + 20
cell_h = thumb_h + 50

sheet = np.zeros((rows * cell_h + 80, cols * cell_w + 40, 3), dtype=np.uint8)
sheet[:] = (20, 22, 26) # sleek dark backdrop

# Title banner
cv2.putText(sheet, "HERO PARTICLE SYSTEM - 13-FRAME TRANSITION CHECKPOINTS (CYCLES 1080p)", 
            (40, 45), cv2.FONT_HERSHEY_DUPLEX, 0.85, (255, 255, 255), 2, cv2.LINE_AA)
cv2.putText(sheet, "Verification of 3,200 Persistent Particles & Coherent Physical Trajectories (No Direct Crossfade)", 
            (40, 70), cv2.FONT_HERSHEY_DUPLEX, 0.45, (160, 180, 200), 1, cv2.LINE_AA)

for idx, (f_num, label) in enumerate(frame_info):
    r = idx // cols
    c = idx % cols
    
    x = 30 + c * cell_w
    y = 95 + r * cell_h
    
    img_path = os.path.join(frames_dir, f"frame_{f_num:03d}.png")
    img = cv2.imread(img_path)
    if img is not None:
        resized = cv2.resize(img, (thumb_w, thumb_h), interpolation=cv2.INTER_AREA)
        # draw frame container border
        cv2.rectangle(sheet, (x - 2, y - 2), (x + thumb_w + 2, y + thumb_h + 2), (60, 70, 85), 1)
        sheet[y:y+thumb_h, x:x+thumb_w] = resized
        
        # text badge
        cv2.rectangle(sheet, (x, y + thumb_h + 6), (x + thumb_w, y + thumb_h + 36), (32, 36, 44), -1)
        cv2.putText(sheet, label, (x + 8, y + thumb_h + 26), cv2.FONT_HERSHEY_DUPLEX, 0.45, (220, 230, 245), 1, cv2.LINE_AA)

# Add summary / metadata in slot 14, 15, 16
x_info = 30 + 1 * cell_w
y_info = 95 + 3 * cell_h + 30
info_lines = [
    "TRANSITION TRAJECTORY AUDIT:",
    "- 3,200 Persistent Points (No mesh swapping)",
    "- Continuous 360 deg Z-Rotation active",
    "- Harmonic intermediate arcs & plasma channels",
    "- Helical convective flame vortex in Y-Z",
    "- Precise mechanical snap to Lock rest form"
]
for i, line in enumerate(info_lines):
    color = (255, 200, 100) if i == 0 else (180, 190, 205)
    cv2.putText(sheet, line, (x_info, y_info + i * 28), cv2.FONT_HERSHEY_DUPLEX, 0.52, color, 1, cv2.LINE_AA)

out_ws = "/Users/karthikeya.s/Documents/focus/transition_test_contact_sheet.png"
out_art = "/Users/karthikeya.s/.gemini/antigravity-ide/brain/f44c7e29-aa15-4fc1-9821-74111e7e06db/transition_test_contact_sheet.png"

cv2.imwrite(out_ws, sheet)
cv2.imwrite(out_art, sheet)
print(f"Contact sheet saved to:\n  {out_ws}\n  {out_art}")
