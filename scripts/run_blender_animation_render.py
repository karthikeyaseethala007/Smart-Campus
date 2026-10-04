
import bpy
import time

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
out_dir = "/Users/karthikeya.s/Documents/focus/production_render_frames_1080p"

scene = bpy.context.scene
scene.render.film_transparent = True
scene.cycles.device = 'GPU'
scene.cycles.samples = 24
scene.cycles.use_denoising = True
if 'Studio_Floor' in bpy.data.objects:
    bpy.data.objects['Studio_Floor'].hide_render = True

scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.file_format = 'PNG'

scene.frame_start = 1
scene.frame_end = 240
scene.render.filepath = out_dir + '/frame_'

print("=== STARTING BLENDER NATIVE ANIMATION RENDER (FRAMES 1..240) ===")
t0 = time.time()
bpy.ops.render.render(animation=True)
print(f"=== ANIMATION RENDER FINISHED IN {time.time() - t0:.1f}s ===")
