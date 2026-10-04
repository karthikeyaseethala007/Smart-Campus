import os
import sys
import time
import shutil
import cv2

print("=" * 60)
print("PRODUCTION RENDER & ENCODE PIPELINE (1080p / 24 FPS / 240 Frames)")
print("=" * 60)

frames_dir = "/Users/karthikeya.s/Documents/focus/production_render_frames_1080p"
section_dir = "/Users/karthikeya.s/Documents/focus/section_renders"
os.makedirs(frames_dir, exist_ok=True)

# Copy any already-rendered frames from section_renders if valid
if os.path.exists(section_dir):
    for f in range(80, 121):
        s_path = os.path.join(section_dir, f"frame_{f:03d}.png")
        d_path = os.path.join(frames_dir, f"frame_{f:03d}.png")
        if os.path.exists(s_path) and not os.path.exists(d_path):
            shutil.copyfile(s_path, d_path)

# Also check optimized_renders for test frames (1, 40, 80, 120, 160, 200, 240)
opt_dir = "/Users/karthikeya.s/Documents/focus/optimized_renders"
if os.path.exists(opt_dir):
    for f in [1, 40, 80, 120, 160, 200, 240]:
        s_path = os.path.join(opt_dir, f"frame_{f:03d}.png")
        d_path = os.path.join(frames_dir, f"frame_{f:03d}.png")
        if os.path.exists(s_path) and not os.path.exists(d_path):
            shutil.copyfile(s_path, d_path)

# Find missing frames out of 1..240
missing_frames = []
for f in range(1, 241):
    f_path = os.path.join(frames_dir, f"frame_{f:03d}.png")
    if not os.path.exists(f_path) or os.path.getsize(f_path) < 10000:
        missing_frames.append(f)

print(f"Frames already rendered: {240 - len(missing_frames)}/240")
print(f"Frames needing render: {len(missing_frames)} frames")

if missing_frames:
    # Group missing frames into continuous ranges or pass as list to Blender
    blender_script = f"""
import bpy
import time
import os

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

scene = bpy.data.scenes.get("Scene") or bpy.context.scene
bpy.context.window.scene = scene

# Configure Metal GPU
prefs = bpy.context.preferences
cycles_prefs = prefs.addons['cycles'].preferences
cycles_prefs.compute_device_type = 'METAL'
cycles_prefs.get_devices()
for d in cycles_prefs.devices:
    if d.type == 'METAL':
        d.use = True
    else:
        d.use = False

scene.render.engine = 'CYCLES'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.cycles.samples = 64
scene.cycles.device = 'GPU'
scene.render.use_persistent_data = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'

missing = {missing_frames}
print(f"Rendering {{len(missing)}} missing frames...")
out_dir = "{frames_dir}"

t_start = time.perf_counter()
for idx, f in enumerate(missing):
    scene.frame_set(f)
    scene.render.filepath = os.path.join(out_dir, f"frame_{{f:03d}}.png")
    t0 = time.perf_counter()
    bpy.ops.render.render(write_still=True)
    dur = time.perf_counter() - t0
    if (idx + 1) % 10 == 0 or idx == 0 or idx == len(missing) - 1:
        print(f"Progress: {{idx + 1}}/{{len(missing)}} | Frame {{f:3d}} in {{dur:.2f}} s")

print(f"All missing frames rendered in {{time.perf_counter() - t_start:.2f}} s")
"""
    tmp_py = "/tmp/render_missing_prod_frames.py"
    with open(tmp_py, "w") as fp:
        fp.write(blender_script)
        
    cmd = f'/Applications/Blender.app/Contents/MacOS/Blender -b -P "{tmp_py}"'
    print(f"Executing: {cmd}")
    ret = os.system(cmd)
    if ret != 0:
        print(f"Blender render exited with status {ret}")
        sys.exit(1)

# Verify all 240 frames
print("\n--- VERIFYING ALL 240 FRAMES ---")
all_frames = [os.path.join(frames_dir, f"frame_{f:03d}.png") for f in range(1, 241)]
missing = [f for f in all_frames if not os.path.exists(f) or os.path.getsize(f) < 10000]
if missing:
    print(f"ERROR: Still missing {len(missing)} frames!")
    sys.exit(1)

print(f"Verification passed: Exactly {len(all_frames)} valid 1080p frames found.")

# Encode hero_particle_master_1080p.mp4
print("\n--- ENCODING hero_particle_master_1080p.mp4 ---")
mp4_out = "/Users/karthikeya.s/Documents/focus/hero_particle_master_1080p.mp4"

sample = cv2.imread(all_frames[0])
h, w, c = sample.shape
assert (w, h) == (1920, 1080), f"Expected 1920x1080, got {w}x{h}"

fourcc = cv2.VideoWriter_fourcc(*"mp4v")
writer = cv2.VideoWriter(mp4_out, fourcc, 24.0, (w, h))

t_enc = time.perf_counter()
for idx, fpath in enumerate(all_frames):
    img = cv2.imread(fpath)
    writer.write(img)
    if (idx + 1) % 40 == 0:
        print(f"Encoded {idx + 1}/240 frames...")
writer.release()
print(f"Encoding complete in {time.perf_counter() - t_enc:.2f} s")

# Verify video properties
cap = cv2.VideoCapture(mp4_out)
fps = cap.get(cv2.CAP_PROP_FPS)
count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
vw = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
vh = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
duration = count / fps if fps > 0 else 0
cap.release()

print("\n" + "=" * 60)
print("FINAL VIDEO VERIFICATION:")
print(f"File: {mp4_out}")
print(f"Resolution: {vw}x{vh} (Expected: 1920x1080)")
print(f"FPS: {fps:.2f} (Expected: 24.0)")
print(f"Frame Count: {count} (Expected: 240)")
print(f"Duration: {duration:.2f} s (Expected: 10.0 s)")
print(f"File Size: {os.path.getsize(mp4_out) / (1024*1024):.2f} MB")
print("=" * 60)

assert (vw, vh) == (1920, 1080), "Resolution mismatch!"
assert count == 240, "Frame count mismatch!"
assert abs(fps - 24.0) < 0.1, "FPS mismatch!"
assert abs(duration - 10.0) < 0.2, "Duration mismatch!"
print("SUCCESS: ALL REQUIREMENTS VERIFIED!")
