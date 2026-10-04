import os
import sys
import time
import subprocess
from concurrent.futures import ThreadPoolExecutor

out_dir = "/Users/karthikeya.s/.gemini/antigravity-ide/brain/751a256d-a337-4c01-8c6b-427f3a5ae3a6/transparent_render_1080p"
os.makedirs(out_dir, exist_ok=True)
blend_file = "/Users/karthikeya.s/Documents/focus/hero_particle_animation.blend"
blender_bin = "/Applications/Blender.app/Contents/MacOS/Blender"

def render_chunk(start, end, chunk_id):
    script = f"""
import bpy
scene = bpy.context.scene
scene.render.film_transparent = True
scene.cycles.device = 'GPU'
scene.cycles.samples = 16
scene.cycles.use_denoising = True
if 'Studio_Floor' in bpy.data.objects:
    bpy.data.objects['Studio_Floor'].hide_render = True
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.file_format = 'PNG'
scene.frame_start = {start}
scene.frame_end = {end}
scene.render.filepath = '{out_dir}/frame_'
bpy.ops.render.render(animation=True)
"""
    script_file = f"/tmp/render_chunk_{chunk_id}.py"
    with open(script_file, "w") as f:
        f.write(script)
    cmd = [blender_bin, "-b", blend_file, "-P", script_file]
    print(f"Starting chunk {chunk_id}: frames {start}-{end}")
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print(f"Finished chunk {chunk_id}: exit code {res.returncode}")
    return res.returncode

print("=== STARTING 4-WORKER PARALLEL BLENDER TRANSPARENT RENDER ===")
chunks = [
    (1, 60, 1),
    (61, 120, 2),
    (121, 180, 3),
    (181, 240, 4)
]

t0 = time.time()
with ThreadPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(lambda c: render_chunk(*c), chunks))

print(f"All chunks completed in {time.time() - t0:.1f} seconds! Results: {results}")

# Verify all 240 frames
for f in range(1, 241):
    f4 = os.path.join(out_dir, f"frame_{f:04d}.png")
    f3 = os.path.join(out_dir, f"frame_{f:03d}.png")
    if os.path.exists(f4) and not os.path.exists(f3):
        os.link(f4, f3)

all_frames = [os.path.join(out_dir, f"frame_{f:03d}.png") for f in range(1, 241)]
missing = [f for f in all_frames if not os.path.exists(f)]
print(f"Verified {len(all_frames) - len(missing)}/240 frames exist.")
if missing:
    print(f"Missing frames: {missing[:5]}")
    sys.exit(1)

print("=== ALL 240 TRANSPARENT FRAMES VERIFIED SUCCESSFULLY ===")
