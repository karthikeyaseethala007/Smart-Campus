import bpy
import time

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

scene = bpy.data.scenes['Production_Render']
bpy.context.window.scene = scene

scene.cycles.device = 'GPU'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'
prefs.get_devices()
for d in prefs.devices:
    d.use = True

scene.cycles.samples = 32
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.04
scene.cycles.use_denoising = True

scene.frame_set(1)
scene.render.filepath = "/Users/karthikeya.s/Documents/focus/test_visual_frames_v2/test_32samples.png"

t0 = time.perf_counter()
bpy.ops.render.render(write_still=True)
print(f"Rendered 32 samples in {time.perf_counter() - t0:.2f} s")
