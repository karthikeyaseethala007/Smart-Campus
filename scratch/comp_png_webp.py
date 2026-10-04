import bpy
import numpy as np

bpy.ops.wm.open_mainfile(filepath="/Users/karthikeya.s/Documents/focus/Untitled(1).blend1")
scene = bpy.context.scene
scene.render.film_transparent = True
floor = bpy.data.objects.get("Studio_Floor")
if floor:
    floor.hide_render = True
scene.frame_set(1)

# Render PNG
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.filepath = "/Users/karthikeya.s/Documents/focus/scratch/comp_png.png"
bpy.ops.render.render(write_still=True)

# Render WEBP lossless
scene.render.image_settings.file_format = 'WEBP'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.quality = 95
scene.render.filepath = "/Users/karthikeya.s/Documents/focus/scratch/comp_webp.webp"
bpy.ops.render.render(write_still=True)

img_png = bpy.data.images.load("/Users/karthikeya.s/Documents/focus/scratch/comp_png.png")
img_webp = bpy.data.images.load("/Users/karthikeya.s/Documents/focus/scratch/comp_webp.webp")

px_png = np.array(img_png.pixels[:])
px_webp = np.array(img_webp.pixels[:])

diff = np.abs(px_png - px_webp)
print(f"PNG vs WEBP q95: max diff = {np.max(diff):.4f}, mean diff = {np.mean(diff):.6f}")

import os
print(f"PNG size: {os.path.getsize(scene.render.filepath[:-5]+'.png')/1024:.1f} KB")
print(f"WEBP size: {os.path.getsize(scene.render.filepath)/1024:.1f} KB")

