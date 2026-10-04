import os
import sys
import time
import subprocess
from concurrent.futures import ProcessPoolExecutor

BLEND_FILE = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend1"
BLENDER_BIN = "/Applications/Blender.app/Contents/MacOS/Blender"
OUT_DIR = "/Users/karthikeya.s/Documents/focus/scratch/production_frames"
FINAL_FRAMES_DIR = "/Users/karthikeya.s/Documents/focus/public/assets/hero/frames_alpha"
POSTER_PATH = "/Users/karthikeya.s/Documents/focus/public/assets/hero/poster.png"
WEBM_PATH = "/Users/karthikeya.s/Documents/focus/public/assets/hero/hero_particle_master_alpha.webm"
MP4_PATH = "/Users/karthikeya.s/Documents/focus/public/assets/hero/hero_particle_master_1080p.mp4"

os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(FINAL_FRAMES_DIR, exist_ok=True)

def render_range(start_frame, end_frame, worker_id):
    worker_script = f"""
import bpy
scene = bpy.context.scene
scene.render.film_transparent = True
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.compression = 15

floor = bpy.data.objects.get("Studio_Floor")
if floor:
    floor.hide_render = True

shadow = bpy.data.objects.get("Floating_Ground_Shadow")
if shadow:
    shadow.hide_render = True

aura = bpy.data.objects.get("Globe_Inner_Aura")
if aura:
    aura.hide_render = True

scene.frame_start = {start_frame}
scene.frame_end = {end_frame}
scene.render.filepath = "{OUT_DIR}/frame_"
bpy.ops.render.render(animation=True)
"""
    script_path = f"/tmp/render_worker_{worker_id}.py"
    with open(script_path, "w") as f:
        f.write(worker_script)
    
    cmd = [BLENDER_BIN, "-b", BLEND_FILE, "-P", script_path]
    t0 = time.time()
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    elapsed = time.time() - t0
    if res.returncode != 0:
        print(f"Worker {worker_id} (frames {start_frame}-{end_frame}) FAILED with code {res.returncode}")
        print(res.stderr.decode('utf-8')[:500])
        return False
    print(f"Worker {worker_id} rendered frames {start_frame}-{end_frame} in {elapsed:.1f}s")
    return True

def main():
    print("=" * 60)
    print("STARTING PRODUCTION RENDER FROM Untitled(1).blend1")
    print("=" * 60)
    t_start = time.time()

    # 4 chunks of 60 frames each
    chunks = [
        (1, 60, 1),
        (61, 120, 2),
        (121, 180, 3),
        (181, 240, 4),
    ]

    with ProcessPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(render_range, s, e, wid) for s, e, wid in chunks]
        results = [f.result() for f in futures]

    if not all(results):
        print("Rendering failed in one or more workers!")
        sys.exit(1)

    print(f"\nAll 240 frames rendered in {time.time() - t_start:.1f}s!")

    # Verify and move all 240 frames to FINAL_FRAMES_DIR
    missing = []
    import shutil
    for f in range(1, 241):
        src_file = os.path.join(OUT_DIR, f"frame_{f:04d}.png")
        dst_file = os.path.join(FINAL_FRAMES_DIR, f"frame_{f:04d}.png")
        if not os.path.exists(src_file) or os.path.getsize(src_file) == 0:
            missing.append(f)
        else:
            shutil.copyfile(src_file, dst_file)

    if missing:
        print(f"ERROR: {len(missing)} frames missing: {missing[:10]}")
        sys.exit(1)

    print(f"Successfully copied 240 verified frames to {FINAL_FRAMES_DIR}")

    # Copy frame 1 to poster.png
    first_frame = os.path.join(FINAL_FRAMES_DIR, "frame_0001.png")
    shutil.copyfile(first_frame, POSTER_PATH)
    print(f"Updated transparent poster at {POSTER_PATH}")

    # Encode transparent WebM (VP9 + alpha)
    print("Encoding transparent WebM...")
    cmd_webm = [
        "ffmpeg", "-y",
        "-framerate", "24",
        "-i", f"{FINAL_FRAMES_DIR}/frame_%04d.png",
        "-c:v", "libvpx-vp9",
        "-pix_fmt", "yuva420p",
        "-b:v", "2M",
        "-auto-alt-ref", "0",
        WEBM_PATH
    ]
    res_webm = subprocess.run(cmd_webm, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res_webm.returncode == 0:
        print(f"Updated WebM at {WEBM_PATH} ({os.path.getsize(WEBM_PATH)/1024/1024:.2f} MB)")
    else:
        print("WebM encoding warning:", res_webm.stderr.decode('utf-8')[:300])

    # Encode high-compatibility MP4
    print("Encoding master MP4...")
    cmd_mp4 = [
        "ffmpeg", "-y",
        "-framerate", "24",
        "-i", f"{FINAL_FRAMES_DIR}/frame_%04d.png",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "18",
        "-preset", "fast",
        MP4_PATH
    ]
    res_mp4 = subprocess.run(cmd_mp4, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res_mp4.returncode == 0:
        print(f"Updated MP4 at {MP4_PATH} ({os.path.getsize(MP4_PATH)/1024/1024:.2f} MB)")

    print(f"\nTOTAL PIPELINE COMPLETE in {time.time() - t_start:.1f}s!")

if __name__ == "__main__":
    main()
