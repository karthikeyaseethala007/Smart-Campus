import os
import sys
import time
import subprocess

blend_file = "/Users/karthikeya.s/Documents/focus/hero_particle_animation.blend"
out_dir = "/Users/karthikeya.s/Documents/focus/public/assets/hero/frames_alpha"
blender_bin = "/Applications/Blender.app/Contents/MacOS/Blender"

render_script = f"""
import bpy
import os

prefs = bpy.context.preferences
cprefs = prefs.addons['cycles'].preferences
cprefs.compute_device_type = 'METAL'
cprefs.get_devices()
for d in cprefs.devices:
    if d.type == 'METAL':
        d.use = True

scene = bpy.context.scene
scene.cycles.device = 'GPU'
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.02
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 3
scene.cycles.diffuse_bounces = 1
scene.cycles.glossy_bounces = 1
scene.cycles.transmission_bounces = 0
scene.cycles.volume_bounces = 0
scene.cycles.transparent_max_bounces = 4

scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.compression = 15
scene.render.film_transparent = True

floor = bpy.data.objects.get("Studio_Floor")
if floor: floor.hide_render = True
shadow = bpy.data.objects.get("Floating_Ground_Shadow")
if shadow: shadow.hide_render = True
aura = bpy.data.objects.get("Globe_Inner_Aura")
if aura: aura.hide_render = True

scene.frame_start = 1
scene.frame_end = 80
scene.render.filepath = "{out_dir}/frame_"

print(f"--- RENDERING FRAMES 1 TO 80 ---")
bpy.ops.render.render(animation=True)
print(f"--- FINISHED FRAMES 1 TO 80 ---")
"""

worker_py = "/tmp/render_frames_1_to_80.py"
with open(worker_py, "w") as f:
    f.write(render_script)

t0 = time.time()
print("Starting single-worker render for frames 1 to 80...")
cmd = [blender_bin, "-b", blend_file, "-P", worker_py]
res = subprocess.run(cmd, capture_output=True, text=True)
print(f"Process finished in {time.time() - t0:.2f}s with code {res.returncode}")
if res.returncode != 0:
    print("STDERR/STDOUT TAIL:")
    print(res.stdout[-1500:])
else:
    print("Render succeeded!")
