import bpy
import time

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU' # or GPU if metal
# check metal
import addon_utils
pref = bpy.context.preferences.addons['cycles'].preferences
print("Cycles compute devices:", pref.get_devices())
try:
    pref.compute_device_type = 'METAL'
    for d in pref.devices:
        d.use = True
    scene.cycles.device = 'GPU'
    print("Using Metal GPU for Cycles")
except Exception as e:
    print("Cycles GPU error:", e)

scene.cycles.samples = 32
scene.render.film_transparent = True
scene.frame_set(1)
scene.render.filepath = "/Users/karthikeya.s/Documents/focus/scratch/test_blend1_renders/test_cycles_f1.png"

t0 = time.time()
bpy.ops.render.render(write_still=True)
t1 = time.time()
print(f"Cycles render took: {t1 - t0:.2f}s")

img = bpy.data.images.load(scene.render.filepath)
import numpy as np
px = np.array(img.pixels[:])
alpha = px[3::4]
print(f"Cycles with Studio_Floor shadow catcher: alpha > 0.1 count = {np.sum(alpha > 0.1)} / {len(alpha)}")
h, w = img.size[1], img.size[0]
a_2d = alpha.reshape((h, w))
y, x = np.where(a_2d > 0.05)
if len(x) > 0:
    print(f"BBox: X=[{x.min()},{x.max()}], Y=[{y.min()},{y.max()}]")
