import os
import sys
import glob
import cv2
import numpy as np

render_dir = "/Users/karthikeya.s/Documents/focus/production_render_frames_1080p"
final_mp4 = "/Users/karthikeya.s/Documents/focus/public/assets/hero/hero_particle_master_1080p.mp4"
poster_path = "/Users/karthikeya.s/Documents/focus/public/assets/hero/poster.png"

# Collect all 240 frames
frames = [os.path.join(render_dir, f"frame_{i:04d}.png") for i in range(1, 241)]
missing = [f for f in frames if not os.path.exists(f)]

if missing:
    print(f"Error: Missing {len(missing)} frames! E.g.: {missing[:3]}")
    sys.exit(1)

print(f"Found all {len(frames)} frames. Encoding dual-alpha H.264 MP4...")

# Save poster.png from frame 1
f1_rgba = cv2.imread(frames[0], cv2.IMREAD_UNCHANGED)
cv2.imwrite(poster_path, f1_rgba)
print(f"Updated transparent poster at {poster_path}")

# Initialize avc1 VideoWriter at 1280x1440 (720 RGB top + 720 Alpha bottom)
fourcc = cv2.VideoWriter_fourcc(*'avc1')
out = cv2.VideoWriter(final_mp4, fourcc, 24.0, (1280, 1440))

if not out.isOpened():
    print("Error: Could not open VideoWriter for avc1")
    sys.exit(1)

for idx, fpath in enumerate(frames):
    rgba = cv2.imread(fpath, cv2.IMREAD_UNCHANGED)
    if rgba is None:
        print(f"Error reading {fpath}")
        sys.exit(1)

    # Resize to 1280x720 with anti-aliasing
    resized = cv2.resize(rgba, (1280, 720), interpolation=cv2.INTER_AREA)

    if resized.shape[2] == 4:
        b, g, r, a = cv2.split(resized)
        rgb = cv2.merge([b, g, r])
        alpha_rgb = cv2.merge([a, a, a])
    else:
        rgb = resized
        alpha_rgb = np.ones_like(rgb) * 255

    # Stack RGB on top, Alpha on bottom
    dual_alpha = np.vstack([rgb, alpha_rgb])
    out.write(dual_alpha)

    if (idx + 1) % 40 == 0 or idx == 239:
        print(f"Encoded {idx + 1}/240 dual-alpha frames ({int((idx+1)/240*100)}%)...")

out.release()
print(f"Dual-alpha master MP4 written successfully: {final_mp4}")
print(f"File size: {os.path.getsize(final_mp4)} bytes")
