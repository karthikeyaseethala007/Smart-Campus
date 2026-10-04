import cv2
import numpy as np

sheet_path = "references/mdx-analysis/final-difference-audit/transition_13_test/particle_detail_comparison.jpg"
sheet = cv2.imread(sheet_path)
h, w, c = sheet.shape
print(f"Sheet size: {w}x{h}, channels: {c}")

# Let's inspect each row of the sheet (each row has height 352 px: 32 banner + 320 content)
row_h = 352
for idx in range(13):
    y0 = idx * row_h + 32
    y1 = (idx + 1) * row_h
    row_crop = sheet[y0:y1, :]
    left_mdx = row_crop[:, :320]
    right_blender = row_crop[:, 320:]
    
    # Analyze contrast and active particle pixels
    gray_m = cv2.cvtColor(left_mdx, cv2.COLOR_BGR2GRAY)
    gray_b = cv2.cvtColor(right_blender, cv2.COLOR_BGR2GRAY)
    
    # Active particles in Blender (darker/contrasted from 238 background)
    diff_b = np.abs(gray_b.astype(np.float32) - 238)
    diff_m = np.abs(gray_m.astype(np.float32) - 238)
    
    act_b = np.sum(diff_b > 20)
    act_m = np.sum(diff_m > 20)
    print(f"State {idx+1:2d}: MDX active pixels={act_m:5d}, Blender active pixels={act_b:5d}, ratio={act_b/max(1, act_m):.2f}")
