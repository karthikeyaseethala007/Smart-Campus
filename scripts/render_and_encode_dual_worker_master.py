"""
Robust Dual-Worker Native Cycles Production Render and Dual-Alpha Video Encoder.
Renders all 240 frames at 1920x1080 with Cycles Metal GPU, 24 FPS, 10s duration.
"""
import os
import sys
import time
import subprocess
import glob
import cv2
import numpy as np
import shutil

out_dir = "/Users/karthikeya.s/Documents/focus/production_render_frames_1080p"
os.makedirs(out_dir, exist_ok=True)
blend_file = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
blender_bin = "/Applications/Blender.app/Contents/MacOS/Blender"

def encode_assets():
    print("\n=======================================================")
    print(" ENCODING MASTER PRODUCTION ASSETS FOR WEBSITE")
    print("=======================================================")
    
    all_frames = [os.path.join(out_dir, f"frame_{f:04d}.png") for f in range(1, 241)]
    missing = [f for f in all_frames if not os.path.exists(f)]
    print(f"Verified rendered frames: {len(all_frames) - len(missing)}/240")
    if missing:
        print(f"Missing frames: {missing[:10]}")
        sys.exit(1)
        
    # Also link 3-digit frame names
    for f in range(1, 241):
        f4 = os.path.join(out_dir, f"frame_{f:04d}.png")
        f3 = os.path.join(out_dir, f"frame_{f:03d}.png")
        if os.path.exists(f4) and not os.path.exists(f3):
            try:
                os.link(f4, f3)
            except:
                pass
                
    # 1. Update poster.png with transparent frame 1
    poster_path = "/Users/karthikeya.s/Documents/focus/public/assets/hero/poster.png"
    f1 = cv2.imread(all_frames[0], cv2.IMREAD_UNCHANGED)
    cv2.imwrite(poster_path, f1)
    print(f"Saved true transparent poster to {poster_path}")
    
    # 2. Encode Dual-Alpha 1920x1080 MP4
    # Top 1920x540 = RGB color, Bottom 1920x540 = Alpha mask -> Total 1920x1080
    public_mp4 = "/Users/karthikeya.s/Documents/focus/public/assets/hero/hero_particle_master_1080p.mp4"
    root_mp4 = "/Users/karthikeya.s/Documents/focus/hero_particle_master_1080p.mp4"
    
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    out_video = cv2.VideoWriter(public_mp4, fourcc, 24.0, (1920, 1080))
    if not out_video.isOpened():
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out_video = cv2.VideoWriter(public_mp4, fourcc, 24.0, (1920, 1080))
        
    assert out_video.isOpened(), "Failed to open VideoWriter for master MP4!"
    
    print("Encoding 240 Dual-Alpha frames (1920x1080: Top RGB 540p, Bottom Alpha 540p)...")
    t0 = time.time()
    for idx, fpath in enumerate(all_frames):
        rgba = cv2.imread(fpath, cv2.IMREAD_UNCHANGED)
        # Resize to 1920x540
        resized = cv2.resize(rgba, (1920, 540), interpolation=cv2.INTER_AREA)
        b, g, r, a = cv2.split(resized)
        rgb = cv2.merge([b, g, r])
        alpha_rgb = cv2.merge([a, a, a])
        # Stack vertically: top RGB, bottom Alpha mask
        stacked = np.vstack([rgb, alpha_rgb])
        out_video.write(stacked)
        if (idx + 1) % 40 == 0:
            print(f"  Encoded {idx + 1}/240 frames ({time.time() - t0:.1f}s)...")
            
    out_video.release()
    print(f"Dual-Alpha encoding finished in {time.time() - t0:.2f}s!")
    
    shutil.copyfile(public_mp4, root_mp4)
    print(f"Copied to root: {root_mp4}")
    
    # Verify encoded video
    cap = cv2.VideoCapture(public_mp4)
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    cap.release()
    print(f"\n=======================================================")
    print(f" FINAL PRODUCTION ASSET VERIFICATION")
    print(f"=======================================================")
    print(f"  Asset:       {public_mp4}")
    print(f"  Resolution:  {w}x{h} (1080p)")
    print(f"  Frame Count: {count} frames")
    print(f"  Frame Rate:  {fps} FPS")
    print(f"  Duration:    {count/fps:.1f} seconds")
    print(f"=======================================================\n")

def main():
    print("=======================================================")
    print(" STARTING DUAL-WORKER NATIVE CYCLES PRODUCTION RENDER")
    print(" 240 Frames | 24 FPS | Cycles Metal GPU | 1920x1080")
    print("=======================================================")
    
    # Clean previous frames in production directory
    for f in glob.glob(os.path.join(out_dir, "frame_*.png")):
        try:
            os.remove(f)
        except:
            pass
            
    # 2 workers: Worker 1 (1-120), Worker 2 (121-240)
    chunks = [
        (1, 120, 1),
        (121, 240, 2)
    ]
    
    processes = []
    t_start = time.time()
    
    for start, end, wid in chunks:
        cmd = [
            blender_bin,
            "-b", blend_file,
            "-S", "Production_Render",
            "-s", str(start),
            "-e", str(end),
            "-o", os.path.join(out_dir, "frame_####"),
            "-a"
        ]
        log_file = open(f"/tmp/dual_render_worker_{wid}.log", "w")
        p = subprocess.Popen(cmd, stdout=log_file, stderr=subprocess.STDOUT)
        processes.append((p, wid, log_file, start, end))
        print(f"Launched Worker {wid} (PID {p.pid}) for frames {start}..{end}")
        
    print("\nRendering in progress. Monitoring output frames...")
    
    last_count = -1
    while True:
        rendered = len(glob.glob(os.path.join(out_dir, "frame_0*.png")))
        pct = (rendered / 240.0) * 100.0
        elapsed = time.time() - t_start
        fps_speed = rendered / (elapsed + 1e-5)
        remaining_s = (240 - rendered) / (fps_speed + 1e-5) if fps_speed > 0 else 0
        
        if rendered != last_count or elapsed % 15 < 1:
            print(f"[RENDER PROGRESS] {rendered:3d}/240 frames ({pct:5.1f}%) | Elapsed: {elapsed:5.1f}s | Speed: {fps_speed:.2f} fps | Est. remaining: {remaining_s:4.1f}s")
            last_count = rendered
            
        all_done = all(p.poll() is not None for p, wid, log_file, s, e in processes)
        if all_done:
            break
        time.sleep(4)
        
    print(f"\nAll workers completed in {time.time() - t_start:.1f} seconds!")
    for p, wid, log_file, s, e in processes:
        log_file.close()
        print(f"Worker {wid} exit code: {p.returncode}")
        assert p.returncode == 0, f"Worker {wid} failed with code {p.returncode}!"
        
    encode_assets()

if __name__ == "__main__":
    main()
