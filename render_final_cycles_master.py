import bpy
import time
import os
import sys

print("==================================================")
print("STARTING PRODUCTION CYCLES METAL GPU RENDER")
print("==================================================")

blend_path = "/Users/karthikeya.s/Documents/focus/hero_particle_animation_updated.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

scene = bpy.context.scene
scene.render.engine = 'CYCLES'

# Metal GPU configuration
prefs = bpy.context.preferences
cprefs = prefs.addons['cycles'].preferences
cprefs.compute_device_type = 'METAL'
cprefs.get_devices()

metal_devices = []
for d in cprefs.devices:
    if d.type == 'METAL':
        d.use = True
        metal_devices.append(d.name)

print("Active Metal Devices:", metal_devices)
assert len(metal_devices) > 0, "No Metal GPU devices found!"

scene.cycles.device = 'GPU'
scene.cycles.samples = 40
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.045
scene.cycles.use_denoising = True

scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.fps = 24
scene.frame_start = 1
scene.frame_end = 240

scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.compression = 15

# Ensure background objects are strictly hidden from render
for hidden_name in ['Studio_Floor', 'Floating_Ground_Shadow', 'Globe_Inner_Aura']:
    if hidden_name in bpy.data.objects:
        bpy.data.objects[hidden_name].hide_render = True
        bpy.data.objects[hidden_name].hide_viewport = True

out_dir = "/Users/karthikeya.s/Documents/focus/public/assets/hero/frames_alpha"
os.makedirs(out_dir, exist_ok=True)
scene.render.filepath = os.path.join(out_dir, "frame_")

print(f"Beginning 240-frame render into: {out_dir}")
t0 = time.time()
bpy.ops.render.render(animation=True)
t1 = time.time()

total_time = t1 - t0
print("==================================================")
print(f"CYCLES RENDER COMPLETE: 240 frames in {total_time:.2f}s ({total_time/240.0:.2f}s/frame)!")
print("==================================================")
