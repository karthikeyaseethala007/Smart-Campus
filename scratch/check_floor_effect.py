import bpy
import numpy as np

bpy.ops.wm.open_mainfile(filepath="/Users/karthikeya.s/Documents/focus/Untitled(1).blend1")
scene = bpy.context.scene
scene.render.film_transparent = True
scene.frame_set(1)

# Render with floor
floor = bpy.data.objects.get("Studio_Floor")
floor.hide_render = False
scene.render.filepath = "/Users/karthikeya.s/Documents/focus/scratch/test_blend1_renders/floor_on.png"
bpy.ops.render.render(write_still=True)

# Render without floor
floor.hide_render = True
scene.render.filepath = "/Users/karthikeya.s/Documents/focus/scratch/test_blend1_renders/floor_off.png"
bpy.ops.render.render(write_still=True)

img_on = bpy.data.images.load("/Users/karthikeya.s/Documents/focus/scratch/test_blend1_renders/floor_on.png")
img_off = bpy.data.images.load("/Users/karthikeya.s/Documents/focus/scratch/test_blend1_renders/floor_off.png")

px_on = np.array(img_on.pixels[:]).reshape((1080, 1920, 4))
px_off = np.array(img_off.pixels[:]).reshape((1080, 1920, 4))

# Check region where hero particles exist (Y between 260 and 820, X between 680 and 1240)
hero_on = px_on[260:820, 680:1240, :3]
hero_off = px_off[260:820, 680:1240, :3]

diff = np.abs(hero_on - hero_off)
print(f"Hero particle pixel diff with/without Studio_Floor: max={np.max(diff):.4f}, mean={np.mean(diff):.6f}")

