import os
import sys
import glob
import json
import cv2
import numpy as np

render_dir = "/Users/karthikeya.s/Documents/focus/production_render_frames_1080p"
root_mp4 = "/Users/karthikeya.s/Documents/focus/hero_particle_master_1080p.mp4"
web_mp4 = "/Users/karthikeya.s/Documents/focus/public/assets/hero/hero_particle_master_1080p.mp4"
poster_path = "/Users/karthikeya.s/Documents/focus/public/assets/hero/poster.png"

# Collect all 240 frames
frames = [os.path.join(render_dir, f"frame_{i:04d}.png") for i in range(1, 241)]
missing = [f for f in frames if not os.path.exists(f)]

if missing:
    print(f"ERROR: Missing {len(missing)} frames! E.g.: {missing[:3]}")
    sys.exit(1)

print(f"[✓] Found all 240 rendered frames in {render_dir}.")

# 1. Update transparent poster from Frame 1
f1_rgba = cv2.imread(frames[0], cv2.IMREAD_UNCHANGED)
cv2.imwrite(poster_path, f1_rgba)
print(f"[✓] Saved transparent poster to {poster_path}")

# 2. Encode Root 1080p MP4 (1920x1080 over clean #FFFFFF)
fourcc = cv2.VideoWriter_fourcc(*'avc1')
out_root = cv2.VideoWriter(root_mp4, fourcc, 24.0, (1920, 1080))
if not out_root.isOpened():
    print("ERROR: Could not open VideoWriter for root 1080p MP4")
    sys.exit(1)

# 3. Encode WebGL Dual-Alpha MP4 (1280x1440: top 720 RGB, bottom 720 Alpha mask)
out_web = cv2.VideoWriter(web_mp4, fourcc, 24.0, (1280, 1440))
if not out_web.isOpened():
    print("ERROR: Could not open VideoWriter for web dual-alpha MP4")
    sys.exit(1)

print("Encoding master MP4s across 240 frames...")
white_bg = np.ones((1080, 1920, 3), dtype=np.float32) * 255.0

for idx, fpath in enumerate(frames):
    rgba = cv2.imread(fpath, cv2.IMREAD_UNCHANGED)
    if rgba is None:
        print(f"Error reading {fpath}")
        sys.exit(1)

    # A. Root 1080p composited on white
    if rgba.shape[2] == 4:
        rgb_float = rgba[:, :, :3].astype(np.float32)
        alpha_norm = (rgba[:, :, 3].astype(np.float32) / 255.0)[:, :, None]
        comp_float = rgb_float * alpha_norm + white_bg * (1.0 - alpha_norm)
        comp_1080p = np.clip(comp_float, 0, 255).astype(np.uint8)
    else:
        comp_1080p = rgba

    out_root.write(comp_1080p)

    # B. Web Dual-Alpha 1280x1440
    resized = cv2.resize(rgba, (1280, 720), interpolation=cv2.INTER_AREA)
    if resized.shape[2] == 4:
        b, g, r, a = cv2.split(resized)
        rgb_half = cv2.merge([b, g, r])
        alpha_half = cv2.merge([a, a, a])
    else:
        rgb_half = resized
        alpha_half = np.ones_like(rgb_half) * 255
    dual_alpha = np.vstack([rgb_half, alpha_half])
    out_web.write(dual_alpha)

    if (idx + 1) % 40 == 0 or idx == 239:
        print(f"  Processed {idx + 1}/240 frames ({int((idx+1)/240*100)}%)...")

out_root.release()
out_web.release()

print("\nEncoding complete!")
print(f"[✓] Root MP4: {root_mp4} ({os.path.getsize(root_mp4)} bytes)")
print(f"[✓] Web MP4: {web_mp4} ({os.path.getsize(web_mp4)} bytes)")

# 4. Verify encoded videos using cv2.VideoCapture
def verify_video(vpath, expected_w, expected_h):
    cap = cv2.VideoCapture(vpath)
    count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration = count / fps if fps > 0 else 0
    cap.release()
    print(f"Verification of {os.path.basename(vpath)}:")
    print(f"  Dimensions: {w}x{h} (expected {expected_w}x{expected_h})")
    print(f"  FPS: {fps}")
    print(f"  Frames: {count} (expected 240)")
    print(f"  Duration: {duration:.2f}s (expected 10.00s)")
    assert count == 240, f"Expected 240 frames, got {count}"
    assert w == expected_w and h == expected_h, f"Expected {expected_w}x{expected_h}, got {w}x{h}"
    return count, fps, w, h, duration

c1, fps1, w1, h1, dur1 = verify_video(root_mp4, 1920, 1080)
c2, fps2, w2, h2, dur2 = verify_video(web_mp4, 1280, 1440)

# Update performance metrics JSON
metrics_file = "/Users/karthikeya.s/Documents/focus/render_performance_metrics.json"
stats = {}
if os.path.exists(metrics_file):
    with open(metrics_file, "r") as f:
        stats = json.load(f)

stats["root_mp4_file"] = root_mp4
stats["root_mp4_size_bytes"] = os.path.getsize(root_mp4)
stats["root_mp4_duration_seconds"] = dur1
stats["root_mp4_resolution"] = f"{w1}x{h1}"
stats["root_mp4_frames"] = c1
stats["web_mp4_file"] = web_mp4
stats["web_mp4_size_bytes"] = os.path.getsize(web_mp4)
stats["web_mp4_duration_seconds"] = dur2
stats["web_mp4_resolution"] = f"{w2}x{h2}"
stats["web_mp4_frames"] = c2

with open(metrics_file, "w") as f:
    json.dump(stats, f, indent=2)

print("\n[✓] All video encodings and verifications passed flawlessly!")
