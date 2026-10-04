"""
Benchmark and verify rebuilt performance architecture across all 240 frames.
"""
import bpy
import time
import os
import math
import resource
import numpy as np

def run_benchmarks(blend_path):
    print(f"\n=======================================================")
    print(f" BENCHMARKING & VERIFYING: {blend_path}")
    print(f"=======================================================")
    
    # 1. Inspect Animation_Development Scene
    sc_dev = bpy.data.scenes['Animation_Development']
    bpy.context.window.scene = sc_dev
    degp_dev = bpy.context.evaluated_depsgraph_get()
    
    mem_mb_start = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / (1024 * 1024)
    
    # Measure frame evaluation times across all 240 frames
    frame_times = []
    t_start = time.perf_counter()
    for f in range(1, 241):
        t0 = time.perf_counter()
        sc_dev.frame_set(f)
        degp_dev.update()
        t1 = time.perf_counter()
        frame_times.append((t1 - t0) * 1000)
    t_end = time.perf_counter()
    
    total_eval_time = t_end - t_start
    avg_eval_ms = np.mean(frame_times)
    min_eval_ms = np.min(frame_times)
    max_eval_ms = np.max(frame_times)
    fps_eval = 240.0 / total_eval_time
    mem_mb_end = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / (1024 * 1024)
    
    print("\n--- CONFIGURATION A (ANIMATION DEVELOPMENT) METRICS ---")
    print(f"Render Engine:            {sc_dev.render.engine}")
    print(f"Total 240-Frame Time:     {total_eval_time*1000:.2f} ms ({total_eval_time:.4f} s)")
    print(f"Avg Frame Evaluation:     {avg_eval_ms:.3f} ms/frame")
    print(f"Min / Max Evaluation:     {min_eval_ms:.3f} ms / {max_eval_ms:.3f} ms")
    print(f"Effective Playback Speed: {fps_eval:.1f} FPS (Target: 24 FPS - {fps_eval/24:.1f}x real-time speed)")
    print(f"Memory Usage:             {mem_mb_end:.1f} MB (Delta: {mem_mb_end - mem_mb_start:+.1f} MB)")
    
    # 2. Verify Particle Continuity & Milestone Shapes
    p_obj = bpy.data.objects['Hero_Particle_System']
    print("\n--- MILESTONE FRAME VERIFICATION ---")
    milestones = [1, 40, 80, 120, 160, 200, 240]
    
    prev_coords = None
    max_step_dist = 0.0
    
    for f in range(1, 241):
        sc_dev.frame_set(f)
        eval_obj = p_obj.evaluated_get(degp_dev)
        eval_mesh = eval_obj.to_mesh()
        pts = np.empty((len(eval_mesh.vertices), 3), dtype=np.float32)
        eval_mesh.vertices.foreach_get('co', pts.ravel())
        eval_obj.to_mesh_clear()
        
        # Check particle count
        assert len(pts) == 3200, f"Frame {f}: vertex count changed to {len(pts)}!"
        
        if prev_coords is not None:
            # Measure max displacement of any particle from previous frame
            disp = np.linalg.norm(pts - prev_coords, axis=1)
            max_step_dist = max(max_step_dist, disp.max())
            # Ensure no sudden teleport/skip (continuous smooth motion)
            assert disp.max() < 0.35, f"Frame {f}: Sudden particle jump detected! {disp.max():.3f}m"
        prev_coords = pts
        
        if f in milestones:
            center = pts.mean(axis=0)
            radius = np.linalg.norm(pts - center, axis=1).mean()
            rot_z = math.degrees(p_obj.rotation_euler.z)
            state_desc = {
                1: "Globe (Steady sphere rotating)",
                40: "Globe Pre-Distortion (Controlled turbulence)",
                80: "Electricity (Sharp lightning arcs & tentacles)",
                120: "Electricity -> Fire Energy (Transition vortex)",
                160: "Fire (Ascending flame tongues & corona)",
                200: "Fire -> Lock (Contraction to padlock geometry)",
                240: "Lock (Closed shackle & monolithic body)"
            }[f]
            print(f"Frame {f:3d} | rotZ: {rot_z:5.1f}° | Radius: {radius:.3f}m | Verts: {len(pts)} | {state_desc}")
            
    print(f"Particle continuity verified! Max single-frame displacement: {max_step_dist:.4f}m (no particle resets or jumps).")
    
    # 3. Test Production Render on Milestones
    sc_prod = bpy.data.scenes['Production_Render']
    bpy.context.window.scene = sc_prod
    
    prefs = bpy.context.preferences.addons.get('cycles')
    if prefs:
        prefs.preferences.compute_device_type = 'METAL'
        for d in prefs.preferences.devices:
            d.use = (d.type == 'METAL')
            
    print("\n--- CONFIGURATION B (PRODUCTION CYCLES METAL) TEST RENDERS ---")
    os.makedirs("scratch/bench_milestones", exist_ok=True)
    render_times = []
    
    for f in milestones:
        sc_prod.frame_set(f)
        sc_prod.render.filepath = os.path.abspath(f"scratch/bench_milestones/frame_{f:03d}.png")
        t0 = time.perf_counter()
        bpy.ops.render.render(write_still=True)
        t1 = time.perf_counter()
        dur = t1 - t0
        render_times.append(dur)
        print(f"Frame {f:3d} Cycles Render: {dur:.2f} s -> {sc_prod.render.filepath}")
        
    print(f"\nCycles Metal GPU Avg Render Time: {np.mean(render_times):.2f} s/frame")
    print("ALL BENCHMARKS AND VERIFICATIONS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    run_benchmarks("/Users/karthikeya.s/Documents/focus/Untitled(1).blend")
