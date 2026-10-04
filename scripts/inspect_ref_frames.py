import cv2
import glob
import os
import numpy as np

ref_dir = "references/mdx-analysis/final-difference-audit/blender-hero-motion-analysis/reference_frames"
files = sorted(glob.glob(f"{ref_dir}/*.jpg"))

print(f"Found {len(files)} reference frames.")
for f in files:
    img = cv2.imread(f)
    h, w, _ = img.shape
    # Let's crop the hero particle region: roughly center X=50% to 75%, Y=30% to 65%
    # But let's find the bounding box of high contrast/particle features
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Background in MDX is near white (~240-250) or off-white
    # Particles are warm white/orange on light background or bright particles with subtle shadows
    basename = os.path.basename(f)
    print(f"{basename}: size {w}x{h}, mean gray {gray.mean():.1f}, min {gray.min()}, max {gray.max()}")
