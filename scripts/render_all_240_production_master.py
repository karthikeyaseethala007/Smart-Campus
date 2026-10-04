import bpy
import os
import sys
import time
import numpy as np

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
out_dir = "/Users/karthikeya.s/Documents/focus/production_render_frames_1080p"
os.makedirs(out_dir, exist_ok=True)

print(f"Loading {blend_path} for production master render...")
bpy.ops.wm.open_mainfile(filepath=blend_path)

scene = bpy.context.scene
p_obj = bpy.data.objects['Hero_Particle_System']
mesh = p_obj.data

# Verify 3200 vertices
N = len(mesh.vertices)
assert N == 3200, f"Expected 3200 vertices, got {N}"
print(f"[✓] Vertex count verified: exactly {N} persistent vertices.")

# Performance Optimization Settings
scene.render.engine = 'CYCLES'
cycles_prefs = bpy.context.preferences.addons['cycles'].preferences
cycles_prefs.compute_device_type = 'METAL'
for d in cycles_prefs.get_devices_for_type('METAL'):
    if d.type == 'METAL': d.use = True
    else: d.use = False

scene.cycles.device = 'GPU'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.use_persistent_data = True
scene.render.film_transparent = True

if 'Studio_Floor' in bpy.data.objects:
    bpy.data.objects['Studio_Floor'].hide_render = True

scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.fps = 24
scene.render.fps_base = 1.0
scene.frame_start = 1
scene.frame_end = 240

scene.render.filepath = os.path.join(out_dir, "frame_")

# Remove any old frame files
import glob
old_frames = glob.glob(os.path.join(out_dir, "frame_*.png"))
print(f"Clearing {len(old_frames)} existing frames in {out_dir}...")
for f in old_frames:
    try: os.remove(f)
    except: pass

print(f"Starting 240-frame animation render at 1920x1080, 24 FPS, Cycles Metal GPU...")
t_start = time.time()

# Run single native animation render
bpy.ops.render.render(animation=True)

t_end = time.time()
total_render_sec = t_end - t_start
avg_sec_per_frame = total_render_sec / 240.0

print(f"\n==========================================")
print(f"RENDER COMPLETE!")
print(f"Total render time: {total_render_sec:.2f}s ({total_render_sec/60:.2f} minutes)")
print(f"Average time per frame: {avg_sec_per_frame:.3f}s")
print(f"==========================================\n")

# Save performance stats
import json
stats = {
    "total_blender_scene_size_bytes": os.path.getsize(blend_path),
    "particle_count": N,
    "resolution": "1920x1080",
    "fps": 24,
    "total_frames": 240,
    "cycles_samples": 32,
    "gpu_device": "Apple M5 (GPU - 8 cores) [Metal]",
    "total_render_time_seconds": round(total_render_sec, 2),
    "average_render_time_per_frame_seconds": round(avg_sec_per_frame, 3)
}

with open("/Users/karthikeya.s/Documents/focus/render_performance_metrics.json", "w") as f:
    json.dump(stats, f, indent=2)

print("Saved performance stats to render_performance_metrics.json")
