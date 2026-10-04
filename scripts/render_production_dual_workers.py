import os
import sys
import time
import subprocess
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
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'
prefs.get_devices()
for d in prefs.devices:
    d.use = True

scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.fps = 24
scene.cycles.samples = 64
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.04
scene.cycles.use_denoising = True

out_dir = "{out_dir}"
for f in range({start}, {end} + 1):
    scene.frame_set(f)
    scene.render.filepath = os.path.join(out_dir, f"frame_{{f:03d}}.png")
    bpy.ops.render.render(write_still=True)
    if (f - {start} + 1) % 10 == 0 or f == {end}:
        print(f"[Worker {wid}] Completed frame {{f}}/{{end}} ({{(f - {start} + 1)}}/{{({end} - {start} + 1)}})")
"""
    script_file = f"/tmp/worker_dual_{wid}.py"
    with open(script_file, "w") as fp:
        fp.write(worker_script)
        
    cmd = [blender_bin, "-b", "-P", script_file]
    print(f"Starting Worker {wid} for frames {start}..{end}")
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    print(f"Worker {wid} finished with exit code {res.returncode}")
    if res.returncode != 0:
        print(f"Worker {wid} stderr:\n{res.stderr[-1000:]}")
    return res.returncode

def main():
    print("=" * 80)
    print("STARTING DUAL-WORKER PRODUCTION CYCLES RENDER (240 FRAMES @ 1080p)")
    print("=" * 80)
    
    chunks = [
        (1, 120, 1),
        (121, 240, 2)
    ]
    
    t_start = time.perf_counter()
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(render_worker, c[0], c[1], c[2]) for c in chunks]
        results = [f.result() for f in futures]
        
    total_time = time.perf_counter() - t_start
    print(f"\nAll workers finished in {total_time:.2f} s ({total_time/60.0:.2f} min)")
    assert all(r == 0 for r in results), f"Some workers failed: {results}"
    
    # Check that all 240 frames exist
    missing = [f for f in range(1, 241) if not os.path.exists(os.path.join(out_dir, f"frame_{f:03d}.png"))]
    print(f"Missing frames count: {len(missing)}")
    assert len(missing) == 0, f"Missing frames: {missing}"
    print("All 240 production frames successfully rendered and verified!")

if __name__ == '__main__':
    main()
