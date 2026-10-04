import bpy
import time
import os
import resource

def get_memory_mb():
    usage = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    return usage / (1024 * 1024)

def profile_after():
    print("=" * 60)
    print("AFTER PERFORMANCE PROFILING: Untitled(1).blend")
    print("=" * 60)
    
    scene = bpy.data.scenes.get("Scene") or bpy.context.scene
    bpy.context.window.scene = scene
    depsgraph = bpy.context.evaluated_depsgraph_get()
    
    # 1. Dependency Graph & Frame Evaluation Time
    test_frames = [1, 40, 80, 120, 160, 200, 240]
    
    # Warm up
    scene.frame_set(1)
    depsgraph.update()
    
    t0 = time.perf_counter()
    for f in range(1, 241):
        scene.frame_set(f)
        depsgraph = bpy.context.evaluated_depsgraph_get()
        # evaluate particle mesh
        hero_obj = bpy.data.objects.get("Hero_Particle_System")
        eval_obj = hero_obj.evaluated_get(depsgraph) if hero_obj else None
        _ = len(eval_obj.data.vertices) if eval_obj and eval_obj.type == 'MESH' else 0
    t_full_timeline = time.perf_counter() - t0
    avg_timeline_fps = 240.0 / t_full_timeline
    avg_eval_ms = (t_full_timeline / 240.0) * 1000.0
    
    print(f"Full 240 frames evaluation time: {t_full_timeline:.4f} s")
    print(f"Average Frame Evaluation Time: {avg_eval_ms:.2f} ms")
    print(f"Simulated Viewport FPS (depsgraph & mesh eval): {avg_timeline_fps:.2f} FPS")
    
    # Measure specific representative frames
    print("\n--- Specific Frame Evaluation Times ---")
    frame_eval_details = {}
    for f in test_frames:
        t_f0 = time.perf_counter()
        scene.frame_set(f)
        depsgraph = bpy.context.evaluated_depsgraph_get()
        hero_obj = bpy.data.objects.get("Hero_Particle_System")
        eval_obj = hero_obj.evaluated_get(depsgraph) if hero_obj else None
        _ = len(eval_obj.data.vertices) if eval_obj and eval_obj.type == 'MESH' else 0
        t_f1 = time.perf_counter()
        ms = (t_f1 - t_f0) * 1000.0
        frame_eval_details[f] = ms
        print(f"  Frame {f:3d}: {ms:.2f} ms")
        
    # Consecutive section: frames 80-120
    t_sec0 = time.perf_counter()
    for f in range(80, 121):
        scene.frame_set(f)
        depsgraph = bpy.context.evaluated_depsgraph_get()
        hero_obj = bpy.data.objects.get("Hero_Particle_System")
        eval_obj = hero_obj.evaluated_get(depsgraph) if hero_obj else None
        _ = len(eval_obj.data.vertices) if eval_obj and eval_obj.type == 'MESH' else 0
    t_sec_duration = time.perf_counter() - t_sec0
    sec_fps = 41.0 / t_sec_duration
    print(f"\nSection Frames 80-120 evaluation: {t_sec_duration:.4f} s ({sec_fps:.2f} FPS)")
    
    # Memory
    mem_mb = get_memory_mb()
    print(f"Process Memory Usage: {mem_mb:.2f} MB")
    
    # Scene stats
    print(f"Total Objects: {len(bpy.data.objects)}")
    print(f"Total Meshes: {len(bpy.data.meshes)}")
    print(f"Total Materials: {len(bpy.data.materials)}")
    print(f"Total Modifiers: {sum(len(o.modifiers) for o in bpy.data.objects)}")
    print(f"Total Lights: {len(bpy.data.lights)}")
    
    # Configure Metal GPU
    prefs = bpy.context.preferences
    cycles_prefs = prefs.addons['cycles'].preferences
    cycles_prefs.compute_device_type = 'METAL'
    cycles_prefs.get_devices()
    for d in cycles_prefs.devices:
        if d.type == 'METAL':
            d.use = True
        else:
            d.use = False
            
    # Cycles Render Performance Test at 1920x1080 (Production Resolution)
    print("\n--- Optimized Cycles Render Test (1080p, 64 samples, Metal GPU) ---")
    out_dir = "/Users/karthikeya.s/Documents/focus/optimized_renders"
    os.makedirs(out_dir, exist_ok=True)
    
    scene.render.engine = 'CYCLES'
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100
    scene.cycles.samples = 64
    scene.cycles.device = 'GPU'
    
    render_times = {}
    t_render_total_start = time.perf_counter()
    for f in test_frames:
        scene.frame_set(f)
        scene.render.filepath = os.path.join(out_dir, f"frame_{f:03d}.png")
        t0 = time.perf_counter()
        bpy.ops.render.render(write_still=True)
        r_time = time.perf_counter() - t0
        render_times[f] = r_time
        print(f"Render Frame {f:3d}: {r_time:.2f} s")
    t_render_total = time.perf_counter() - t_render_total_start
    avg_render = sum(render_times.values()) / len(render_times)
    print(f"Total 7 test frames render time: {t_render_total:.2f} s")
    print(f"Average render time per frame (1080p, 64 samples): {avg_render:.2f} s")
    
    print("\n" + "=" * 60)
    print("AFTER OPTIMIZATION SUMMARY:")
    print(f"Viewport simulated FPS: {avg_timeline_fps:.2f} FPS")
    print(f"Frame evaluation avg: {avg_eval_ms:.2f} ms")
    print(f"Render time / frame (1080p Cycles 64s): {avg_render:.2f} s")
    print(f"Memory: {mem_mb:.2f} MB")
    print(f"Objects: {len(bpy.data.objects)}")
    print("=" * 60)

if __name__ == '__main__':
    profile_after()
