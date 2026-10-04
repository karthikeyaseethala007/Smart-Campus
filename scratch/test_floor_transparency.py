import bpy

scene = bpy.context.scene
print("EEVEE shadow catcher support / floor test:")
floor = bpy.data.objects.get("Studio_Floor")
print("Studio_Floor hide_render:", floor.hide_render if floor else None)

# In Blender 4.2+ / 5.x EEVEE Next, shadow catcher might require specific settings or Cycles.
# Or if Studio_Floor is hidden from render, what does it render?
# Let's test with Studio_Floor.hide_render = True
floor.hide_render = True

scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.film_transparent = True
scene.frame_set(1)
scene.render.filepath = "/Users/karthikeya.s/Documents/focus/scratch/test_blend1_renders/test_no_floor_f1.png"
bpy.ops.render.render(write_still=True)

img = bpy.data.images.load(scene.render.filepath)
import numpy as np
px = np.array(img.pixels[:])
alpha = px[3::4]
print(f"Without Studio_Floor: alpha > 0.1 count = {np.sum(alpha > 0.1)} / {len(alpha)}")
h, w = img.size[1], img.size[0]
a_2d = alpha.reshape((h, w))
y, x = np.where(a_2d > 0.05)
if len(x) > 0:
    print(f"BBox: X=[{x.min()},{x.max()}], Y=[{y.min()},{y.max()}]")
else:
    print("Completely transparent!")

