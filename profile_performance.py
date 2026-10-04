import bpy
import time
import os

def profile_blend(filepath, name):
    bpy.ops.wm.open_mainfile(filepath=filepath)
    scene = bpy.context.scene
    obj = bpy.data.objects['Hero_Particle_System']
    
    # 1. Dependency Graph & Frame Evaluation Time
    t0 = time.time()
    for f in range(1, 241):
        scene.frame_set(f)
        dg = bpy.context.evaluated_depsgraph_get()
        _ = obj.evaluated_get(dg)
    t1 = time.time()
    
    total_eval_ms = (t1 - t0) * 1000
    ms_per_frame = total_eval_ms / 240.0
    viewport_fps = 240.0 / (t1 - t0)
    
    # 2. Render benchmark (Sample frames 1, 85, 155, 225)
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.film_transparent = True
    scene.render.image_settings.color_mode = 'RGBA'
    
    # Test render times
    render_times = []
    for f in [1, 85, 155, 225]:
        scene.frame_set(f)
        scene.render.filepath = f"/tmp/bench_{name}_f{f}.png"
        rt0 = time.time()
        bpy.ops.render.render(write_still=True)
        rt1 = time.time()
        render_times.append((rt1 - rt0) * 1000)
    
    avg_render_ms = sum(render_times) / len(render_times)
    
    print(f"=== PERFORMANCE PROFILE: {name} ===")
    print(f"  Frame Evaluation: {ms_per_frame:.4f} ms / frame (Total: {total_eval_ms:.2f} ms for 240 frames)")
    print(f"  Viewport Animation FPS: {viewport_fps:.1f} FPS")
    print(f"  Benchmark Render Time: {avg_render_ms:.2f} ms / frame")
    return ms_per_frame, viewport_fps, avg_render_ms

print("Profiling Original Blend...")
m0, fps0, r0 = profile_blend("/Users/karthikeya.s/Documents/focus/hero_particle_animation.blend", "ORIGINAL")

print("\nProfiling Updated Optimized Blend...")
m1, fps1, r1 = profile_blend("/Users/karthikeya.s/Documents/focus/hero_particle_animation_updated.blend", "UPDATED_OPTIMIZED")

print("\n=== SUMMARY COMPARISON ===")
print(f"Evaluation speedup: {m0/m1:.2f}x faster ({m0:.4f}ms -> {m1:.4f}ms)")
print(f"Viewport FPS: {fps0:.1f} -> {fps1:.1f} FPS")
print(f"Render time per frame: {r0:.1f}ms -> {r1:.1f}ms")
