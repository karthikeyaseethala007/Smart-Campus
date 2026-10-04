import bpy
import time

filepath = "/Users/karthikeya.s/Documents/focus/hero_particle_animation.blend"
bpy.ops.wm.open_mainfile(filepath=filepath)

scene = bpy.context.scene

# Measure frame evaluation ms
t0 = time.time()
for f in range(1, 241):
    scene.frame_set(f)
    dg = bpy.context.evaluated_depsgraph_get()
t_eval = (time.time() - t0) / 240.0 * 1000.0
fps_est = 1000.0 / t_eval if t_eval > 0 else 999.0
print(f"AFTER: Average Frame Evaluation Time: {t_eval:.2f} ms (~{fps_est:.1f} FPS)")

# Measure render time per frame with optimized Cycles Metal
scene.render.engine = 'CYCLES'
scene.cycles.device = 'GPU'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'
prefs.get_devices()
for d in prefs.devices:
    d.use = (d.type == 'METAL')

scene.render.filepath = "/tmp/test_after_render.png"

# Test render at frames 1, 90 (Electricity), 155 (Fire), 225 (Lock)
times = []
for f in [1, 90, 155, 225]:
    scene.frame_set(f)
    t_start = time.time()
    bpy.ops.render.render(write_still=True)
    dur = (time.time() - t_start) * 1000.0
    times.append(dur)
    print(f"  Frame {f} render time: {dur:.1f} ms")

avg_render_ms = sum(times) / len(times)
print(f"AFTER: Average Single Frame Render Time (Cycles 32 samples): {avg_render_ms:.1f} ms")
