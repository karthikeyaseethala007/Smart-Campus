import os
import sys
import time
import subprocess
import glob
import cv2
import numpy as np
from concurrent.futures import ThreadPoolExecutor

out_dir = "/Users/karthikeya.s/Documents/focus/production_render_frames_1080p"
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

prefs = bpy.context.preferences
cprefs = prefs.addons['cycles'].preferences
cprefs.compute_device_type = 'METAL'
cprefs.get_devices()
for d in cprefs.devices:
    if d.type == 'METAL':
        d.use = True

if 'Studio_Floor' in bpy.data.objects:
    bpy.data.objects['Studio_Floor'].hide_render = True

scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.compression = 15

scene.frame_start = {start}
scene.frame_end = {end}
scene.render.filepath = '{out_dir}/frame_'
bpy.ops.render.render(animation=True)
"""
    script_file = f"/tmp/render_prod_chunk_{chunk_id}.py"
    with open(script_file, "w") as f:
        f.write(script)
    cmd = [blender_bin, "-b", blend_file, "-P", script_file]
    print(f"Starting chunk {chunk_id}: frames {start}-{end}")
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print(f"Finished chunk {chunk_id}: exit code {res.returncode}")
    return res.returncode

print("=== STARTING 3-WORKER PRODUCTION RENDER OF ALL 240 FRAMES ===")
chunks = [
    (1, 80, 1),
    (81, 160, 2),
    (161, 240, 3)
]

t0 = time.time()
with ThreadPoolExecutor(max_workers=3) as executor:
    results = list(executor.map(lambda c: render_chunk(*c), chunks))

print(f"\nAll render chunks completed in {time.time() - t0:.1f} seconds! Results: {results}")
if any(r != 0 for r in results):
    print("ERROR: One or more chunks failed!")
    sys.exit(1)

# Link 4-digit frames to 3-digit frames
for f in range(1, 241):
    f4 = os.path.join(out_dir, f"frame_{f:04d}.png")
    f3 = os.path.join(out_dir, f"frame_{f:03d}.png")
    if os.path.exists(f4) and not os.path.exists(f3):
        try:
            os.link(f4, f3)
        except Exception:
            import shutil
            shutil.copyfile(f4, f3)

all_frames = [os.path.join(out_dir, f"frame_{f:03d}.png") for f in range(1, 241)]
missing = [f for f in all_frames if not os.path.exists(f)]
print(f"Verified {len(all_frames) - len(missing)}/240 frames exist.")
if missing:
    print(f"Missing frames: {missing[:5]}")
    sys.exit(1)

print("\n=== ENCODING PRODUCTION ASSETS FOR WEBSITE ===")

# 1. Update poster.png with transparent frame 1
poster_path = "/Users/karthikeya.s/Documents/focus/public/assets/hero/poster.png"
f1 = cv2.imread(all_frames[0], cv2.IMREAD_UNCHANGED)
cv2.imwrite(poster_path, f1)
print(f"Saved true transparent poster to {poster_path}")

# 2. Encode 1080p MP4 composited on clean pure white (#FFFFFF)
# Pure white ensures mix-blend-mode: multiply works 100% seamlessly on the webpage canvas
tmp_raw_mp4 = "/tmp/hero_particle_clean_white_raw.mp4"
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
out_mp4 = cv2.VideoWriter(tmp_raw_mp4, fourcc, 24.0, (1920, 1080))

print("Compositing 240 frames over white for seamless multiply blending...")
white_bg = np.full((1080, 1920, 3), 255, dtype=np.uint8)

for idx, fpath in enumerate(all_frames):
    rgba = cv2.imread(fpath, cv2.IMREAD_UNCHANGED)
    if rgba.shape[2] == 4:
        alpha = rgba[:, :, 3:4] / 255.0
        rgb = rgba[:, :, :3]
        comp = (rgb * alpha + white_bg * (1.0 - alpha)).astype(np.uint8)
    else:
        comp = rgba
    out_mp4.write(comp)
    if (idx + 1) % 60 == 0:
        print(f"  Processed {idx + 1}/240 frames...")

out_mp4.release()

# 3. Transcode to H.264 with high profile and faststart for instantaneous scrubbing
public_mp4 = "/Users/karthikeya.s/Documents/focus/public/assets/hero/hero_particle_master_1080p.mp4"
root_mp4 = "/Users/karthikeya.s/Documents/focus/hero_particle_master_1080p.mp4"

ffmpeg_cmd = (
    f"ffmpeg -y -i {tmp_raw_mp4} "
    f"-c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.1 "
    f"-crf 17 -preset slow -movflags +faststart {public_mp4}"
)
print("Running ffmpeg H.264 encode...")
subprocess.run(ffmpeg_cmd, shell=True, check=True)

import shutil
shutil.copyfile(public_mp4, root_mp4)
print(f"Saved master H.264 MP4 to {public_mp4} and {root_mp4}")

# 4. Also encode transparent VP9 WebM
webm_path = "/Users/karthikeya.s/Documents/focus/public/assets/hero/hero_particle_transparent.webm"
webm_cmd = (
    f"ffmpeg -y -framerate 24 -i {out_dir}/frame_%04d.png "
    f"-c:v libvpx-vp9 -pix_fmt yuva420p -b:v 3M {webm_path}"
)
print("Running ffmpeg VP9 alpha WebM encode...")
subprocess.run(webm_cmd, shell=True, check=True)
print(f"Saved transparent WebM to {webm_path}")

print("\n=== ALL 240 PRODUCTION FRAMES RENDERED & ENCODED SUCCESSFULLY ===")
