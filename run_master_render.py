import os
import sys
import time
import cv2

print("==================================================")
print("STARTING FULL PRODUCTION RENDER PIPELINE")
print("==================================================")

blend_file = "/Users/karthikeya.s/Documents/focus/hero_particle_animation.blend"
out_dir = "/Users/karthikeya.s/.gemini/antigravity-ide/brain/1a46610e-7e04-44a3-b2aa-863c1ab8dfea/render_frames_1080p"
os.makedirs(out_dir, exist_ok=True)

# Blender render script
blender_render_script = f"""
import bpy
import os
import sys

print('--- CONFIGURING CYCLES & METAL GPU ---')
prefs = bpy.context.preferences
cprefs = prefs.addons['cycles'].preferences
cprefs.compute_device_type = 'METAL'
cprefs.get_devices()

metal_devices = []
for d in cprefs.devices:
    if d.type == 'METAL':
        d.use = True
        metal_devices.append(d.name)

print('Active Metal devices:', metal_devices)
assert len(metal_devices) > 0, 'No Metal GPU devices found!'

scene = bpy.context.scene
scene.cycles.device = 'GPU'
scene.render.engine = 'CYCLES'
scene.cycles.samples = 64
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.compression = 15

scene.frame_start = 1
scene.frame_end = 240
scene.render.filepath = '{out_dir}/frame_'

print('--- COMMENCING 240-FRAME ANIMATION RENDER ---')
bpy.ops.render.render(animation=True)
print('--- ANIMATION RENDER FINISHED ---')
"""

script_path = "/tmp/exec_master_render.py"
with open(script_path, "w") as f:
    f.write(blender_render_script)

# Execute Blender render
blender_bin = "/Applications/Blender.app/Contents/MacOS/Blender"
cmd = f'"{blender_bin}" -b "{blend_file}" -P "{script_path}"'
print(f"Running command: {cmd}")

ret = os.system(cmd)
if ret != 0:
    print(f"ERROR: Blender exited with non-zero status code: {ret}")
    sys.exit(1)

print("\n==================================================")
print("BLENDER RENDER COMPLETE - VERIFYING FRAMES")
print("==================================================")

# Ensure 3-digit frame names exist (frame_001.png through frame_240.png)
for f in range(1, 241):
    src4 = os.path.join(out_dir, f"frame_{f:04d}.png")
    dst3 = os.path.join(out_dir, f"frame_{f:03d}.png")
    if os.path.exists(src4) and not os.path.exists(dst3):
        try:
            os.link(src4, dst3)
        except Exception:
            import shutil
            shutil.copyfile(src4, dst3)

# Count and verify all 240 frames
frames_3digit = [os.path.join(out_dir, f"frame_{f:03d}.png") for f in range(1, 241)]
missing_frames = [f for f in frames_3digit if not os.path.exists(f)]

if missing_frames:
    print(f"ERROR: {len(missing_frames)} frames missing! First missing: {missing_frames[0]}")
    sys.exit(2)

print(f"Verification passed: Exactly {len(frames_3digit)} frames found (frame_001.png to frame_240.png)!")

print("\n==================================================")
print("ENCODING MASTER 1080P MP4 VIDEO")
print("==================================================")

sample = cv2.imread(frames_3digit[0])
h, w, c = sample.shape
print(f"Source frames resolution: {w}x{h}")
assert (w, h) == (1920, 1080), f"Expected 1920x1080, got {w}x{h}"

mp4_path = "/Users/karthikeya.s/.gemini/antigravity-ide/brain/1a46610e-7e04-44a3-b2aa-863c1ab8dfea/hero_particle_master_1080p.mp4"
focus_mp4_path = "/Users/karthikeya.s/Documents/focus/hero_particle_master_1080p.mp4"

fourcc = cv2.VideoWriter_fourcc(*"mp4v")
out = cv2.VideoWriter(mp4_path, fourcc, 24.0, (w, h))

t_enc_start = time.time()
for idx, fpath in enumerate(frames_3digit):
    img = cv2.imread(fpath)
    out.write(img)
    if (idx + 1) % 40 == 0:
        print(f"Encoded {idx + 1}/240 frames...")

out.release()
print(f"Encoding complete in {time.time() - t_enc_start:.2f}s!")

# Copy to workspace
import shutil
shutil.copyfile(mp4_path, focus_mp4_path)

# Verify final MP4
cap = cv2.VideoCapture(mp4_path)
v_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
v_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
v_fps = cap.get(cv2.CAP_PROP_FPS)
v_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
v_dur = v_count / v_fps if v_fps > 0 else 0
cap.release()

file_size = os.path.getsize(mp4_path)

print("\n==================================================")
print("PRODUCTION RENDER COMPLETE")
print("==================================================")
print(f"Master Video Path (Artifacts): {mp4_path}")
print(f"Master Video Path (Workspace): {focus_mp4_path}")
print(f"Resolution: {v_w}x{v_h}")
print(f"FPS: {v_fps:.1f}")
print(f"Duration: {v_dur:.2f} seconds")
print(f"Frame Count: {v_count}")
print(f"File Size: {file_size:,} bytes ({file_size / (1024*1024):.2f} MB)")
print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!")
