import bpy
import os

bpy.ops.wm.open_mainfile(filepath="/Users/karthikeya.s/Documents/focus/Untitled(1).blend1")
scene = bpy.context.scene
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'WEBP'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.quality = 90

floor = bpy.data.objects.get("Studio_Floor")
if floor:
    floor.hide_render = True

scene.frame_set(1)
out_webp = "/Users/karthikeya.s/Documents/focus/scratch/test_f1.webp"
scene.render.filepath = out_webp
bpy.ops.render.render(write_still=True)

size = os.path.getsize(out_webp)
print(f"Rendered WEBP size: {size / 1024:.1f} KB")

