import os
import sys
import glob
import cv2
import numpy as np
import subprocess

out_dir = "/Users/karthikeya.s/.gemini/antigravity-ide/brain/dab923e1-2e4e-4119-a833-1f4986b63310/transparent_render_1080p"

# Link 4-digit frames to 3-digit frames
for f in range(1, 241):
    f4 = os.path.join(out_dir, f"frame_{f:04d}.png")
    f3 = os.path.join(out_dir, f"frame_{f:03d}.png")
    if os.path.exists(f4) and not os.path.exists(f3):
        os.link(f4, f3)

all_frames = [os.path.join(out_dir, f"frame_{f:03d}.png") for f in range(1, 241)]
missing = [f for f in all_frames if not os.path.exists(f)]
print(f"Total verified frames: {len(all_frames) - len(missing)}/240")
if missing:
    print(f"Still missing {len(missing)} frames: {missing[:5]}")
    sys.exit(1)

# 1. Update poster.png with transparent frame 1
poster_path = "/Users/karthikeya.s/Documents/focus/public/assets/hero/poster.png"
f1 = cv2.imread(all_frames[0], cv2.IMREAD_UNCHANGED)
cv2.imwrite(poster_path, f1)
print(f"Saved true transparent poster to {poster_path}")

# 2. Encode Dual-Alpha Video
# 1280x720 RGB on top, 1280x720 Alpha mask on bottom -> total 1280x1440
tmp_raw_mp4 = "/tmp/hero_dual_alpha_raw.mp4"
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
out_dual = cv2.VideoWriter(tmp_raw_mp4, fourcc, 24.0, (1280, 1440))

for idx, fpath in enumerate(all_frames):
    rgba = cv2.imread(fpath, cv2.IMREAD_UNCHANGED)
    resized = cv2.resize(rgba, (1280, 720), interpolation=cv2.INTER_AREA)
    b, g, r, a = cv2.split(resized)
    rgb = cv2.merge([b, g, r])
    alpha_rgb = cv2.merge([a, a, a])
    stacked = np.vstack([rgb, alpha_rgb])
    out_dual.write(stacked)

out_dual.release()
print("Raw dual-alpha video generated.")

# 3. Fast H.264 encode for browser scrubbing
final_mp4 = "/Users/karthikeya.s/Documents/focus/public/assets/hero/hero_particle_master_1080p.mp4"
ffmpeg_cmd = f"ffmpeg -y -i {tmp_raw_mp4} -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.1 -movflags +faststart {final_mp4}"
subprocess.run(ffmpeg_cmd, shell=True)
print(f"Browser H.264 dual-alpha MP4 saved to {final_mp4}")

# 4. WebM with native VP9 alpha channel
webm_path = "/Users/karthikeya.s/Documents/focus/public/assets/hero/hero_particle_transparent.webm"
webm_cmd = f"ffmpeg -y -framerate 24 -i {out_dir}/frame_%04d.png -vf scale=1280:720 -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 2M {webm_path}"
subprocess.run(webm_cmd, shell=True)
print(f"Transparent VP9 WebM saved to {webm_path}")

print("=== ALL VIDEO ASSETS ENCODED SUCCESSFULLY ===")
