import bpy
import time

filepath = "/Users/karthikeya.s/Documents/focus/hero_particle_animation.blend"
bpy.ops.wm.open_mainfile(filepath=filepath)

scene = bpy.context.scene
print("Current scene:", scene.name, "engine:", scene.render.engine)

# Measure frame evaluation ms
t0 = time.time()
for f in range(1, 241, 10):
    scene.frame_set(f)
    dg = bpy.context.evaluated_depsgraph_get()
t_eval = (time.time() - t0) / 24.0 * 1000.0
fps_est = 1000.0 / t_eval if t_eval > 0 else 999.0
print(f"BASELINE: Average Frame Evaluation Time: {t_eval:.2f} ms (~{fps_est:.1f} FPS)")

# Test render frame 1 with Cycles Metal
scene.render.engine = 'CYCLES'
scene.cycles.device = 'GPU'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'
prefs.get_devices()
for d in prefs.devices:
    d.use = (d.type == 'METAL')

scene.cycles.samples = 32
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.filepath = "/tmp/test_baseline_render.png"

t_rend0 = time.time()
bpy.ops.render.render(write_still=True)
t_render_ms = (time.time() - t_rend0) * 1000.0
print(f"BASELINE: Single Frame Render Time (Cycles 32 samples): {t_render_ms:.1f} ms")
