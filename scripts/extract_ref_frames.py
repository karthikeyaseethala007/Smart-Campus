import cv2
import os
import numpy as np

out_dir = "references/mdx-analysis/final-difference-audit/blender-hero-motion-analysis/reference_frames"
os.makedirs(out_dir, exist_ok=True)

cap = cv2.VideoCapture("references/mdx-reference.mov")
fps = cap.get(cv2.CAP_PROP_FPS) # ~49.15
count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

timestamps = np.arange(0.0, 8.6, 0.25)
print(f"Extracting {len(timestamps)} reference frames from MDX...")

for t in timestamps:
    f_idx = int(round(t * fps))
    if f_idx >= count:
        break
    cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
    ret, frame = cap.read()
    if not ret:
        continue
    # Standard analysis size 1280x832
    resized = cv2.resize(frame, (1280, 832), interpolation=cv2.INTER_AREA)
    out_path = os.path.join(out_dir, f"ref_t{t:04.2f}s_f{f_idx:04d}.jpg")
    cv2.imwrite(out_path, resized, [cv2.IMWRITE_JPEG_QUALITY, 92])

cap.release()
print(f"Extracted {len(timestamps)} frames to {out_dir}")
