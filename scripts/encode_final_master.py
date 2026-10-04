import os
import sys
import time
import shutil
import cv2

print("=" * 60)
print("FINAL MASTER VIDEO ENCODING & ACCEPTANCE VERIFICATION")
print("=" * 60)

frames_dir = "/Users/karthikeya.s/Documents/focus/production_render_frames_1080p"

# 1. Ensure all 240 frames exist in 3-digit format (frame_001.png to frame_240.png)
all_frames = []
for f in range(1, 241):
    f3 = os.path.join(frames_dir, f"frame_{f:03d}.png")
    f4 = os.path.join(frames_dir, f"frame_{f:04d}.png")
    
    if os.path.exists(f3) and os.path.getsize(f3) > 50000:
        all_frames.append(f3)
    elif os.path.exists(f4) and os.path.getsize(f4) > 50000:
        if not os.path.exists(f3):
            try:
                os.link(f4, f3)
            except Exception:
                shutil.copyfile(f4, f3)
        all_frames.append(f3)
    else:
        print(f"ERROR: Frame {f} missing!")
        sys.exit(1)

print(f"Verified all {len(all_frames)}/240 production frames.")

# Verify frame 1, 120, 240 resolution
for check_idx in [0, 119, 239]:
    sample = cv2.imread(all_frames[check_idx])
    h, w, c = sample.shape
    print(f"Frame {check_idx+1} dimensions: {w}x{h}, channels: {c}")
    assert (w, h) == (1920, 1080), f"Frame {check_idx+1} dimension mismatch: expected 1920x1080, got {w}x{h}"

# 2. Encode to MP4
master_mp4 = "/Users/karthikeya.s/Documents/focus/hero_particle_master_1080p.mp4"
public_mp4 = "/Users/karthikeya.s/Documents/focus/public/assets/hero/hero_particle_master_1080p.mp4"

# Try avc1 first, fallback to mp4v
fourcc = cv2.VideoWriter_fourcc(*"avc1")
out = cv2.VideoWriter(master_mp4, fourcc, 24.0, (1920, 1080))
if not out.isOpened():
    print("avc1 writer failed, falling back to mp4v...")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(master_mp4, fourcc, 24.0, (1920, 1080))

assert out.isOpened(), "Failed to open VideoWriter!"

t_start = time.perf_counter()
for idx, fpath in enumerate(all_frames):
    img = cv2.imread(fpath)
    out.write(img)
    if (idx + 1) % 40 == 0:
        print(f"Encoded {idx + 1}/240 frames...")
out.release()
t_enc = time.perf_counter() - t_start
print(f"Encoding complete in {t_enc:.2f} s")

# Copy to public/assets/hero/
shutil.copyfile(master_mp4, public_mp4)
print(f"Copied master MP4 to web asset path: {public_mp4}")

# 3. Read back and strictly verify video stream properties
cap = cv2.VideoCapture(master_mp4)
fps = cap.get(cv2.CAP_PROP_FPS)
count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
vw = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
vh = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
duration = count / fps if fps > 0 else 0
cap.release()

file_size_mb = os.path.getsize(master_mp4) / (1024 * 1024)

print("\n" + "=" * 60)
print("FINAL PRODUCTION VIDEO ACCEPTANCE VERIFICATION:")
print(f"Master File   : {master_mp4}")
print(f"Public File   : {public_mp4}")
print(f"Resolution    : {vw}x{vh} (Requirement: 1920x1080)")
print(f"FPS           : {fps:.2f} (Requirement: 24.0)")
print(f"Frame Count   : {count} (Requirement: 240)")
print(f"Duration      : {duration:.2f} s (Requirement: 10.0 s)")
print(f"File Size     : {file_size_mb:.2f} MB")
print("=" * 60)

assert (vw, vh) == (1920, 1080), f"FAILED: Resolution is {vw}x{vh}, expected 1920x1080!"
assert count == 240, f"FAILED: Frame count is {count}, expected 240!"
assert abs(fps - 24.0) < 0.1, f"FAILED: FPS is {fps}, expected 24.0!"
assert abs(duration - 10.0) < 0.2, f"FAILED: Duration is {duration:.2f}s, expected 10.0s!"

print("\n>>> ALL CRITICAL ACCEPTANCE REQUIREMENTS 100% VERIFIED AND PASSED! <<<")
