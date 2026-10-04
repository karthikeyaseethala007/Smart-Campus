import bpy
import os
import time

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

scene = bpy.data.scenes.get("Production_Render")
assert scene is not None, "Production_Render scene not found!"
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
scene.cycles.samples = 64
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.04
scene.cycles.use_denoising = True

out_dir = "/Users/karthikeya.s/Documents/focus/test_visual_frames"
os.makedirs(out_dir, exist_ok=True)

test_frames = [1, 86, 155, 225]

for f in test_frames:
    scene.frame_set(f)
    out_path = os.path.join(out_dir, f"test_frame_{f:03d}.png")
    scene.render.filepath = out_path
    print(f"\nRendering test frame {f}...")
    t0 = time.perf_counter()
    bpy.ops.render.render(write_still=True)
    t1 = time.perf_counter()
    print(f"Rendered frame {f} in {t1 - t0:.2f} s -> {out_path}")
