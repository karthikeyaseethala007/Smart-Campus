import bpy
import os

out_dir = "/tmp/test_transparent_render"
os.makedirs(out_dir, exist_ok=True)

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

# Render frames 1, 70, 120, 175, 210
for f in [1, 70, 120, 175, 210]:
    scene.frame_set(f)
    scene.render.filepath = f"{out_dir}/frame_{f:04d}.png"
    bpy.ops.render.render(write_still=True)
    print(f"Rendered test frame {f}")
