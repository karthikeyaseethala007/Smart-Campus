import bpy
import time

blend_file = "/Users/karthikeya.s/Documents/focus/hero_particle_animation.blend"
bpy.ops.wm.open_mainfile(filepath=blend_file)

scene = bpy.context.scene
scene.render.film_transparent = True
if 'Studio_Floor' in bpy.data.objects:
    bpy.data.objects['Studio_Floor'].hide_render = True

# 1. Test CPU render of frame 1
scene.cycles.device = 'CPU'
scene.cycles.samples = 16
scene.cycles.use_denoising = False
scene.frame_set(1)
scene.render.filepath = "/tmp/test_cpu.png"

t0 = time.time()
bpy.ops.render.render(write_still=True)
t_cpu = time.time() - t0
print(f"CPU render time: {t_cpu:.2f}s")

# 2. Test Metal GPU render of frame 1
prefs = bpy.context.preferences
cprefs = prefs.addons['cycles'].preferences
cprefs.compute_device_type = 'METAL'
cprefs.get_devices()
metal_devs = []
for d in cprefs.devices:
    if d.type == 'METAL':
        d.use = True
        metal_devs.append(d.name)
print("Metal devices:", metal_devs)

scene.cycles.device = 'GPU'
scene.render.filepath = "/tmp/test_metal.png"
t0 = time.time()
bpy.ops.render.render(write_still=True)
t_metal = time.time() - t0
print(f"Metal GPU render time: {t_metal:.2f}s (Speedup: {t_cpu/t_metal:.1f}x)")
