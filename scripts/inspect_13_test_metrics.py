import cv2
import glob
import os
import numpy as np

blend_dir = "references/mdx-analysis/final-difference-audit/transition_13_test/blender_frames"
files = sorted(glob.glob(f"{blend_dir}/*.png"))

print(f"=== METRICS AUDIT FOR 13 INTERMEDIATE TRANSITION FRAMES ===")
print(f"{'Frame':<8} {'State Name':<35} {'BBox (WxH)':<14} {'Aspect':<8} {'Center (X,Y)':<16} {'Alpha>20':<10}")
print("-" * 95)

for f in files:
    base = os.path.basename(f)
    img = cv2.imread(f, cv2.IMREAD_UNCHANGED)
    h, w, c = img.shape
    b, g, r, a = cv2.split(img)
    
    ys, xs = np.where(a > 20)
    bw = xs.max() - xs.min()
    bh = ys.max() - ys.min()
    cx = xs.mean()
    cy = ys.mean()
    pts = len(xs)
    
    frame_num = base.split("_")[1]
    state_name = "_".join(base.split("_")[2:]).replace(".png", "")
    print(f"f={frame_num:<5} {state_name:<35} {f'{bw}x{bh}':<14} {bw/bh:<8.2f} {f'({cx:.1f}, {cy:.1f})':<16} {pts:<10}")

