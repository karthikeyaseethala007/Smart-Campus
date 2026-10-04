import bpy
import os

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

scene = bpy.context.scene
for s in bpy.data.scenes:
    if "Hero" in s.name and "Dev" not in s.name:
        scene = s
        break

bpy.context.window.scene = scene

# Production settings: Cycles, 1080p, GPU
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
scene.cycles.samples = 32
scene.cycles.use_denoising = True

out_dir = "/Users/karthikeya.s/Documents/focus/production_render_frames_1080p"

for f in range(1, 10):
    scene.frame_set(f)
    scene.render.filepath = os.path.join(out_dir, f"frame_{f:03d}.png")
    print(f"Rendering frame {f}...")
    bpy.ops.render.render(write_still=True)
    print(f"Rendered frame {f} to {scene.render.filepath}")
