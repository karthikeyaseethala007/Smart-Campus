"""
Render all 240 production frames with Cycles Metal GPU using 4 parallel workers,
and encode the final hero_particle_master_1080p.mp4 dual-alpha asset.
"""
import os
import sys
import time
import subprocess
import cv2
import numpy as np
import shutil
from concurrent.futures import ThreadPoolExecutor

out_dir = "/Users/karthikeya.s/Documents/focus/production_render_frames_1080p"
os.makedirs(out_dir, exist_ok=True)
blend_file = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
blender_bin = "/Applications/Blender.app/Contents/MacOS/Blender"

def render_worker(start, end, wid):
    worker_script = f"""
import bpy
import os

bpy.ops.wm.open_mainfile(filepath="{blend_file}")
scene = bpy.data.scenes.get("Production_Render")
assert scene is not None, "Production_Render scene missing!"
bpy.context.window.scene = scene

# Configure Cycles Metal GPU
scene.render.engine = 'CYCLES'
scene.cycles.device = 'GPU'
prefs = bpy.context.preferences.addons.get('cycles')
if prefs:
    prefs.preferences.compute_device_type = 'METAL'
    for d in prefs.preferences.devices:
        d.use = (d.type == 'METAL')

scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.fps = 24
scene.cycles.samples = 32
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.02
scene.cycles.use_denoising = True
scene.render.film_transparent = True

out_dir = "{out_dir}"
for f in range({start}, {end} + 1):
    scene.frame_set(f)
    scene.render.filepath = os.path.join(out_dir, f"frame_{{f:04d}}.png")
    bpy.ops.render.render(write_still=True)
    # Also link 3-digit frame
    f3 = os.path.join(out_dir, f"frame_{{f:03d}}.png")
    f4 = scene.render.filepath
    if os.path.exists(f4) and not os.path.exists(f3):
        try:
            os.link(f4, f3)
        except:
            pass
    if (f - {start} + 1) % 5 == 0 or f == {end}:
        print(f"[Worker {wid}] Finished frame {{f}}/{{end}} ({{f - {start} + 1}}/{{{end} - {start} + 1}})")
"""
    script_file = f"/tmp/worker_render_{wid}.py"
    with open(script_file, "w") as fp:
        fp.write(worker_script)
        
    cmd = [blender_bin, "-b", "-P", script_file]
    print(f"Starting Worker {wid} for frames {start}..{end}")
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    print(f"Worker {wid} finished with exit code {res.returncode}")
    if res.returncode != 0:
        print(f"Worker {wid} stderr:\n{res.stderr[-1000:]}")
    return res.returncode

def encode_assets():
    print("\n=== ENCODING PRODUCTION ASSETS FOR WEBSITE ===")
    all_frames = [os.path.join(out_dir, f"frame_{f:04d}.png") for f in range(1, 241)]
    missing = [f for f in all_frames if not os.path.exists(f)]
    print(f"Verified frames: {len(all_frames) - len(missing)}/240")
    if missing:
        print(f"Missing frames: {missing[:5]}")
        sys.exit(1)
        
    # 1. Update poster.png with transparent frame 1
    poster_path = "/Users/karthikeya.s/Documents/focus/public/assets/hero/poster.png"
    f1 = cv2.imread(all_frames[0], cv2.IMREAD_UNCHANGED)
    cv2.imwrite(poster_path, f1)
    print(f"Saved true transparent poster to {poster_path}")
    
    # 2. Encode Dual-Alpha 1920x1080 MP4
    # Top 1920x540 = RGB, Bottom 1920x540 = Alpha mask -> Total 1920x1080
    public_mp4 = "/Users/karthikeya.s/Documents/focus/public/assets/hero/hero_particle_master_1080p.mp4"
    root_mp4 = "/Users/karthikeya.s/Documents/focus/hero_particle_master_1080p.mp4"
    
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    out_video = cv2.VideoWriter(public_mp4, fourcc, 24.0, (1920, 1080))
    if not out_video.isOpened():
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out_video = cv2.VideoWriter(public_mp4, fourcc, 24.0, (1920, 1080))
        
    assert out_video.isOpened(), "Failed to open VideoWriter!"
    
    print("Encoding 240 Dual-Alpha frames (1920x1080: top RGB 540p, bottom Alpha 540p)...")
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
    print(f"VERIFIED VIDEO PROPERTIES:")
    print(f"  Resolution: {w}x{h} (1080p)")
    print(f"  Frame Count: {count} frames")
    print(f"  Frame Rate: {fps} FPS")
    print(f"  Duration: {count/fps:.1f} seconds")
    print("=== ASSET ENCODING COMPLETE ===")

def main():
    print("=== STARTING 4-WORKER PRODUCTION CYCLES RENDER ===")
    t_start = time.time()
    chunks = [
        (1, 60, 1),
        (61, 120, 2),
        (121, 180, 3),
        (181, 240, 4)
    ]
    
    with ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(lambda c: render_worker(*c), chunks))
        
    print(f"All workers finished in {time.time() - t_start:.1f} seconds! Worker results: {results}")
    assert all(r == 0 for r in results), "One or more workers failed!"
    
    encode_assets()

if __name__ == "__main__":
    main()
