import os
import sys
import time
import subprocess
import cv2
import numpy as np
from concurrent.futures import ThreadPoolExecutor

out_dir = "/Users/karthikeya.s/.gemini/antigravity-ide/brain/dab923e1-2e4e-4119-a833-1f4986b63310/transparent_render_1080p"
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

print("=== STARTING PARALLEL BLENDER TRANSPARENT RENDER ===")
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

# Generate transparent poster
first_frame = cv2.imread(all_frames[0], cv2.IMREAD_UNCHANGED)
poster_path = "/Users/karthikeya.s/Documents/focus/public/assets/hero/poster.png"
cv2.imwrite(poster_path, first_frame)
print(f"Saved true transparent poster to {poster_path}")

# Now encode Dual-Alpha MP4 (Top = RGB, Bottom = Alpha mask)
# Dimensions: 1280x720 RGB on top, 1280x720 Alpha mask on bottom -> total 1280x1440
dual_alpha_path = "/Users/karthikeya.s/Documents/focus/public/assets/hero/hero_particle_dual_alpha.mp4"
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
# 1280x1440
out_dual = cv2.VideoWriter(dual_alpha_path, fourcc, 24.0, (1280, 1440))

# Also WebM with VP9 alpha using ffmpeg if available
for idx, fpath in enumerate(all_frames):
    rgba = cv2.imread(fpath, cv2.IMREAD_UNCHANGED)
    # Resize to 1280x720 for web performance
    resized = cv2.resize(rgba, (1280, 720), interpolation=cv2.INTER_AREA)
    b, g, r, a = cv2.split(resized)
    rgb = cv2.merge([b, g, r])
    alpha_rgb = cv2.merge([a, a, a])
    # Stack vertically: RGB on top, Alpha on bottom
    stacked = np.vstack([rgb, alpha_rgb])
    out_dual.write(stacked)
    if (idx + 1) % 40 == 0:
        print(f"Encoded {idx + 1}/240 dual-alpha frames...")

out_dual.release()
print(f"Dual-alpha MP4 saved to {dual_alpha_path}")

# Re-encode to H.264 using ffmpeg for web playback
final_mp4 = "/Users/karthikeya.s/Documents/focus/public/assets/hero/hero_particle_master_1080p.mp4"
ffmpeg_cmd = f"ffmpeg -y -i {dual_alpha_path} -c:v libx264 -pix_fmt yuv420p -movflags +faststart {final_mp4}"
subprocess.run(ffmpeg_cmd, shell=True)
print(f"Web H.264 dual-alpha MP4 saved to {final_mp4}")

# Also produce transparent WebM with VP9 alpha
webm_path = "/Users/karthikeya.s/Documents/focus/public/assets/hero/hero_particle_transparent.webm"
webm_cmd = f"ffmpeg -y -framerate 24 -i {out_dir}/frame_%04d.png -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 2M {webm_path}"
subprocess.run(webm_cmd, shell=True)
print(f"Transparent WebM saved to {webm_path}")

print("=== TRANSPARENT PIPELINE COMPLETE ===")
