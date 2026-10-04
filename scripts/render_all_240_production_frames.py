import os
import sys
import time
import subprocess
import glob

def main():
    blend_file = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
    blender_bin = "/Applications/Blender.app/Contents/MacOS/Blender"
    out_dir = "/Users/karthikeya.s/Documents/focus/production_render_frames_1080p"
    os.makedirs(out_dir, exist_ok=True)
    
    # Clean out any old frames so we know for certain every frame is freshly rendered
    old_frames = glob.glob(os.path.join(out_dir, "frame_*.png"))
    print(f"Removing {len(old_frames)} stale/previous frames...")
    for f in old_frames:
        try:
            os.remove(f)
        except Exception:
            pass

    print("=" * 80)
    print("STARTING FULL NATIVE BLENDER CLI PRODUCTION CYCLES RENDER (240 FRAMES @ 1080p)")
    print("=" * 80)
    
    # Process 1: 1 to 120
    # Process 2: 121 to 240
    cmd1 = [
        blender_bin, "-b", blend_file,
        "-S", "Production_Render",
        "-o", os.path.join(out_dir, "frame_###"),
        "-s", "1", "-e", "120", "-a"
    ]
    
    cmd2 = [
        blender_bin, "-b", blend_file,
        "-S", "Production_Render",
        "-o", os.path.join(out_dir, "frame_###"),
        "-s", "121", "-e", "240", "-a"
    ]
    
    t0 = time.time()
    print("Spawning Worker 1 (Frames 1-120)...")
    p1 = subprocess.Popen(cmd1, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    print("Spawning Worker 2 (Frames 121-240)...")
    p2 = subprocess.Popen(cmd2, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    # Wait for completion
    out1, err1 = p1.communicate()
    out2, err2 = p2.communicate()
    elapsed = time.time() - t0
    
    print(f"Worker 1 finished with return code {p1.returncode}")
    print(f"Worker 2 finished with return code {p2.returncode}")
    print(f"Total render elapsed time: {elapsed:.2f}s ({elapsed/60.0:.2f} min)")
    
    if p1.returncode != 0:
        print("Worker 1 stderr:", err1[-1000:])
    if p2.returncode != 0:
        print("Worker 2 stderr:", err2[-1000:])
        
    assert p1.returncode == 0 and p2.returncode == 0, "One or both workers failed!"
    
    # Verify all 240 frames
    missing = []
    for f in range(1, 241):
        fpath = os.path.join(out_dir, f"frame_{f:03d}.png")
        if not os.path.exists(fpath) or os.path.getsize(fpath) == 0:
            missing.append(f)
            
    print(f"Missing frames count: {len(missing)}")
    assert len(missing) == 0, f"Render incomplete! Missing: {missing}"
    print("All 240 frames verified on disk!")

if __name__ == "__main__":
    main()
