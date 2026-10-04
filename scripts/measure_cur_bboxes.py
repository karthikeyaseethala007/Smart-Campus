import cv2
import glob
import os
import numpy as np

cur_dir = "references/mdx-analysis/final-difference-audit/blender-hero-motion-analysis/current_frames"
files = sorted(glob.glob(f"{cur_dir}/*.jpg"))

print(f"Found {len(files)} current frames.")
for f in files:
    img = cv2.imread(f)
    h, w, _ = img.shape
    # Crop around object (in current recording, check size first)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Background is off-white (~230-245)
    # Let's find object by thresholding difference from background
    bg = np.median(img[:40, :40], axis=(0,1))
    diff = np.linalg.norm(img.astype(np.float32) - bg, axis=2)
    # Look in the hero region (x in [0.4*w, 0.8*w], y in [0.2*h, 0.7*h])
    x0, x1 = int(0.4*w), int(0.85*w)
    y0, y1 = int(0.15*h), int(0.65*h)
    region_diff = diff[y0:y1, x0:x1]
    mask = region_diff > 20
    ys, xs = np.where(mask)
    basename = os.path.basename(f)
    if len(xs) > 100:
        bw = xs.max() - xs.min()
        bh = ys.max() - ys.min()
        cx = (xs.mean() + x0) / w
        cy = (ys.mean() + y0) / h
        print(f"{basename}: size {w}x{h}, obj bbox={bw:3d}x{bh:3d}, aspect={bw/bh:.2f}, pos=({cx*100:.1f}%, {cy*100:.1f}%)")
    else:
        print(f"{basename}: no object detected or faded")
