import os
import sys
import subprocess
import cv2
import numpy as np

print("==================================================")
print("PRODUCTION ASSET ENCODING PIPELINE")
print("==================================================")

frames_dir = "/Users/karthikeya.s/Documents/focus/public/assets/hero/frames_alpha"
out_dir = "/Users/karthikeya.s/Documents/focus/public/assets/hero"
mp4_out = "/Users/karthikeya.s/Documents/focus/hero_particle_master_1080p.mp4"
webm_out = os.path.join(out_dir, "hero_particle_master_alpha.webm")
poster_out = os.path.join(out_dir, "poster.png")

# 1. Verify all 240 frames exist
missing = []
for f in range(1, 241):
    fp = os.path.join(frames_dir, f"frame_{f:04d}.png")
    if not os.path.exists(fp):
        missing.append(fp)

if missing:
    print(f"ERROR: {len(missing)} frames missing! First missing: {missing[0]}")
    sys.exit(1)

print("Verification passed: All 240 frames exist!")

# 2. Generate crisp transparent poster from Frame 1
f1_path = os.path.join(frames_dir, "frame_0001.png")
f1 = cv2.imread(f1_path, cv2.IMREAD_UNCHANGED)
cv2.imwrite(poster_out, f1)
print(f"Generated transparent poster: {poster_out} ({os.path.getsize(poster_out):,} bytes)")

# 3. Encode Master 1080p MP4 (High quality H.264)
# Note: standard MP4 H.264 composites over clean transparent/dark for standalone media players
print("\nEncoding master MP4: hero_particle_master_1080p.mp4 ...")
cmd_mp4 = [
    "ffmpeg", "-y",
    "-r", "24",
    "-i", os.path.join(frames_dir, "frame_%04d.png"),
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "18",
    "-preset", "slow",
    "-movflags", "+faststart",
    mp4_out
]
subprocess.run(cmd_mp4, check=True)
print(f"Master MP4 generated: {mp4_out} ({os.path.getsize(mp4_out):,} bytes)")

# 4. Encode Production Transparent WebM (VP9 + yuva420p native alpha)
print("\nEncoding production transparent WebM with native alpha: hero_particle_master_alpha.webm ...")
cmd_webm = [
    "ffmpeg", "-y",
    "-r", "24",
    "-i", os.path.join(frames_dir, "frame_%04d.png"),
    "-c:v", "libvpx-vp9",
    "-pix_fmt", "yuva420p",
    "-crf", "22",
    "-b:v", "0",
    "-g", "4",            # Keyframe every 4 frames for ultra-responsive bidirectional scroll scrub
    "-auto-alt-ref", "0", # Prevent alpha ghosting artifacts
    webm_out
]
subprocess.run(cmd_webm, check=True)
print(f"Production WebM generated: {webm_out} ({os.path.getsize(webm_out):,} bytes)")

print("\n==================================================")
print("ALL PRODUCTION ASSETS ENCODED & VERIFIED!")
print("==================================================")
