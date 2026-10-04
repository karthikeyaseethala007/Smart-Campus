import os
import sys
import time
import subprocess
import cv2
import numpy as np
import shutil

print("==================================================")
print("ENCODING TRANSPARENT MASTER WEBM & POSTER")
print("==================================================")

frames_dir = "/Users/karthikeya.s/Documents/focus/public/assets/hero/frames_alpha"
hero_dir = "/Users/karthikeya.s/Documents/focus/public/assets/hero"
poster_path = os.path.join(hero_dir, "poster.png")
webm_path = os.path.join(hero_dir, "hero_particle_master_alpha.webm")

# 1. Verify 240 frames
frames = [os.path.join(frames_dir, f"frame_{i:04d}.png") for i in range(1, 241)]
missing = [f for f in frames if not os.path.exists(f)]
if missing:
    print(f"Error: {len(missing)} frames missing! First missing: {missing[0]}")
    sys.exit(1)

print(f"Verified all 240 transparent frames exist!")

# 2. Generate transparent poster.png from frame 1
shutil.copyfile(frames[0], poster_path)
print(f"Saved transparent poster to {poster_path}")

# Verify poster transparency
poster_img = cv2.imread(poster_path, cv2.IMREAD_UNCHANGED)
assert poster_img.shape[2] == 4, "Poster must have 4 channels (RGBA)"
poster_a = poster_img[:, :, 3]
assert poster_a.min() == 0, "Poster must have transparent pixels"
print(f"Poster transparency verified: {np.count_nonzero(poster_a == 0) / poster_a.size * 100:.1f}% transparent")

# 3. Encode WebM VP9 with alpha channel
ffmpeg_cmd = [
    "ffmpeg", "-y",
    "-framerate", "24",
    "-i", os.path.join(frames_dir, "frame_%04d.png"),
    "-c:v", "libvpx-vp9",
    "-pix_fmt", "yuva420p",
    "-b:v", "2.5M",
    "-g", "4",
    "-auto-alt-ref", "0",
    "-speed", "1",
    webm_path
]

print(f"Running ffmpeg command: {' '.join(ffmpeg_cmd)}")
t0 = time.time()
res = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
if res.returncode != 0:
    print("FFmpeg encoding failed!")
    print(res.stderr)
    sys.exit(2)

t1 = time.time()
print(f"WebM encoded in {t1 - t0:.2f} seconds!")
size_mb = os.path.getsize(webm_path) / (1024 * 1024)
print(f"WebM output size: {size_mb:.2f} MB")

# Also copy to workspace root if requested
focus_webm = "/Users/karthikeya.s/Documents/focus/hero_particle_master_alpha.webm"
shutil.copyfile(webm_path, focus_webm)

print("==================================================")
print("TRANSPARENT MASTER ENCODING COMPLETE")
print("==================================================")
