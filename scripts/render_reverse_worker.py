import os
import sys
import time

frames_dir = "/Users/karthikeya.s/Documents/focus/production_render_frames_1080p"
section_dir = "/Users/karthikeya.s/Documents/focus/section_renders"
opt_dir = "/Users/karthikeya.s/Documents/focus/optimized_renders"

# Check which frames in range 121..240 are missing
missing_reverse = []
for f in range(240, 120, -1):
    f_path = os.path.join(frames_dir, f"frame_{f:03d}.png")
    if not os.path.exists(f_path) or os.path.getsize(f_path) < 10000:
        missing_reverse.append(f)

print(f"Reverse worker found {len(missing_reverse)} frames to render in range 121..240: {missing_reverse[:5]}...")

if not missing_reverse:
    print("No frames missing in reverse range!")
    sys.exit(0)

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

missing = {missing_reverse}
out_dir = "{frames_dir}"

for idx, f in enumerate(missing):
    f_path = os.path.join(out_dir, f"frame_{{f:03d}}.png")
    if os.path.exists(f_path) and os.path.getsize(f_path) > 10000:
        continue
    scene.frame_set(f)
    scene.render.filepath = f_path
    t0 = time.perf_counter()
    bpy.ops.render.render(write_still=True)
    dur = time.perf_counter() - t0
    print(f"Reverse Worker: Frame {{f:3d}} in {{dur:.2f}} s ({{idx + 1}}/{{len(missing)}})")
"""

tmp_py = "/tmp/render_reverse_worker.py"
with open(tmp_py, "w") as fp:
    fp.write(blender_script)

cmd = f'/Applications/Blender.app/Contents/MacOS/Blender -b -P "{tmp_py}"'
print(f"Launching Reverse Worker: {cmd}")
os.system(cmd)
