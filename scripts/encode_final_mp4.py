import os
import sys
import glob
import cv2
import numpy as np
import shutil
import time

print("=== ENCODING PRODUCTION ASSETS FOR WEBSITE ===")

out_dir = "/Users/karthikeya.s/Documents/focus/production_render_frames_1080p"
all_frames = [os.path.join(out_dir, f"frame_{f:04d}.png") for f in range(1, 241)]
missing = [f for f in all_frames if not os.path.exists(f)]
print(f"Verified frames: {len(all_frames) - len(missing)}/240")
assert len(missing) == 0, f"Missing frames: {missing[:5]}"

# 1. Update poster.png with transparent frame 1
poster_path = "/Users/karthikeya.s/Documents/focus/public/assets/hero/poster.png"
f1 = cv2.imread(all_frames[0], cv2.IMREAD_UNCHANGED)
cv2.imwrite(poster_path, f1)
print(f"Saved true transparent poster to {poster_path}")

# 2. Encode 1080p MP4 with avc1 (H.264) composited on pure white (#FFFFFF)
public_mp4 = "/Users/karthikeya.s/Documents/focus/public/assets/hero/hero_particle_master_1080p.mp4"
root_mp4 = "/Users/karthikeya.s/Documents/focus/hero_particle_master_1080p.mp4"

fourcc = cv2.VideoWriter_fourcc(*'avc1')
out_video = cv2.VideoWriter(public_mp4, fourcc, 24.0, (1920, 1080))
assert out_video.isOpened(), "Failed to open VideoWriter with avc1"

print("Compositing and encoding 240 frames over white...")
white_bg = np.full((1080, 1920, 3), 255, dtype=np.uint8)

t0 = time.time()
for idx, fpath in enumerate(all_frames):
    rgba = cv2.imread(fpath, cv2.IMREAD_UNCHANGED)
    if rgba.shape[2] == 4:
        alpha = rgba[:, :, 3:4] / 255.0
        rgb = rgba[:, :, :3]
        comp = (rgb * alpha + white_bg * (1.0 - alpha)).astype(np.uint8)
    else:
        comp = rgba
    out_video.write(comp)
    if (idx + 1) % 40 == 0:
        print(f"  Encoded {idx + 1}/240 frames ({time.time() - t0:.1f}s)...")

out_video.release()
print(f"Encoding finished in {time.time() - t0:.2f}s!")

# Copy to root
shutil.copyfile(public_mp4, root_mp4)
print(f"Copied to root: {root_mp4}")

# Verify output video
cap = cv2.VideoCapture(public_mp4)
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
fps = cap.get(cv2.CAP_PROP_FPS)
cap.release()

file_size = os.path.getsize(public_mp4)
print(f"\nVerification:")
print(f"  Path: {public_mp4}")
print(f"  Resolution: {w}x{h}")
print(f"  Frame Count: {count}/240")
print(f"  FPS: {fps}")
print(f"  File Size: {file_size / (1024*1024):.2f} MB")
assert count == 240, f"Expected 240 frames, got {count}"
assert (w, h) == (1920, 1080), f"Expected 1920x1080, got {w}x{h}"

print("\n=== PRODUCTION ASSETS ENCODED & DEPLOYED SUCCESSFULLY ===")
