import os
import sys
import time
import subprocess

print("==================================================")
print("STARTING MULTI-WORKER 240-FRAME PRODUCTION RENDER")
print("==================================================")

blend_file = "/Users/karthikeya.s/Documents/focus/hero_particle_animation.blend"
out_dir = "/Users/karthikeya.s/Documents/focus/public/assets/hero/frames_alpha"
os.makedirs(out_dir, exist_ok=True)

blender_bin = "/Applications/Blender.app/Contents/MacOS/Blender"

# Worker script template
worker_script = f"""
import bpy
import os

prefs = bpy.context.preferences
cprefs = prefs.addons['cycles'].preferences
cprefs.compute_device_type = 'METAL'
cprefs.get_devices()
for d in cprefs.devices:
    if d.type == 'METAL':
        d.use = True

scene = bpy.context.scene
scene.cycles.device = 'GPU'
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.02
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 3
scene.cycles.diffuse_bounces = 1
scene.cycles.glossy_bounces = 1
scene.cycles.transmission_bounces = 0
scene.cycles.volume_bounces = 0
scene.cycles.transparent_max_bounces = 4

scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.compression = 15
scene.render.film_transparent = True

floor = bpy.data.objects.get("Studio_Floor")
if floor: floor.hide_render = True
shadow = bpy.data.objects.get("Floating_Ground_Shadow")
if shadow: shadow.hide_render = True
aura = bpy.data.objects.get("Globe_Inner_Aura")
if aura: aura.hide_render = True

# Read frame range from environment
f_start = int(os.environ.get("RENDER_F_START", 1))
f_end = int(os.environ.get("RENDER_F_END", 240))

scene.frame_start = f_start
scene.frame_end = f_end
scene.render.filepath = "{out_dir}/frame_"

print(f"--- WORKER RENDERING FRAMES {{f_start}} to {{f_end}} ---")
bpy.ops.render.render(animation=True)
print(f"--- WORKER FINISHED FRAMES {{f_start}} to {{f_end}} ---")
"""

worker_py = "/tmp/worker_render_exec.py"
with open(worker_py, "w") as f:
    f.write(worker_script)

# Define 3 workers
ranges = [
    (1, 80),
    (81, 160),
    (161, 240)
]

processes = []
t0 = time.time()

for idx, (s, e) in enumerate(ranges):
    env = os.environ.copy()
    env["RENDER_F_START"] = str(s)
    env["RENDER_F_END"] = str(e)
    cmd = [blender_bin, "-b", blend_file, "-P", worker_py]
    print(f"Launching Worker {idx+1}: Frames {s} to {e}...")
    p = subprocess.Popen(cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    processes.append((idx+1, p))

# Wait for all workers to complete
for wid, p in processes:
    out, _ = p.communicate()
    ret = p.returncode
    if ret != 0:
        print(f"ERROR: Worker {wid} failed with exit code {ret}!")
        print(out[-1000:])
        sys.exit(1)
    else:
        print(f"Worker {wid} completed successfully.")

render_duration = time.time() - t0
print(f"All 240 frames rendered in {render_duration:.1f} seconds! (avg {render_duration/240.0*1000.0:.1f} ms/frame)")

# Verify all 240 frames exist
missing = []
for f in range(1, 241):
    fpath = os.path.join(out_dir, f"frame_{f:04d}.png")
    if not os.path.exists(fpath):
        missing.append(f"frame_{f:04d}.png")

if missing:
    print(f"ERROR: {len(missing)} frames missing! First: {missing[0]}")
    sys.exit(2)
print("SUCCESS: Exactly 240 alpha PNG frames verified!")

# Update poster.png with frame_0001.png
import shutil
src_f1 = os.path.join(out_dir, "frame_0001.png")
dst_poster = "/Users/karthikeya.s/Documents/focus/public/assets/hero/poster.png"
shutil.copyfile(src_f1, dst_poster)
print(f"Updated {dst_poster} with frame_0001.png.")

# Encode hero_particle_master_1080p.mp4
mp4_root = "/Users/karthikeya.s/Documents/focus/hero_particle_master_1080p.mp4"
mp4_public = "/Users/karthikeya.s/Documents/focus/public/assets/hero/hero_particle_master_1080p.mp4"

# Use ffmpeg to encode crisp h264 master
ffmpeg_cmd = (
    f"ffmpeg -y -framerate 24 -i '{out_dir}/frame_%04d.png' "
    f"-c:v libx264 -pix_fmt yuv420p -crf 18 -preset fast '{mp4_root}'"
)
print("Encoding MP4:", ffmpeg_cmd)
ret = os.system(ffmpeg_cmd)
if ret == 0:
    shutil.copyfile(mp4_root, mp4_public)
    print(f"Encoded and updated {mp4_root} and {mp4_public}!")
else:
    print("WARNING: ffmpeg returned code:", ret)

print("PRODUCTION RENDER & ENCODE COMPLETE!")
