import bpy
import time
import os

def render_section():
    print("=" * 60)
    print("RENDERING CONSECUTIVE SECTION: FRAMES 80 TO 120")
    print("=" * 60)
    
    blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
    bpy.ops.wm.open_mainfile(filepath=blend_path)
    
    scene = bpy.data.scenes.get("Scene") or bpy.context.scene
    bpy.context.window.scene = scene
    
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
            
    out_dir = "/Users/karthikeya.s/Documents/focus/section_renders"
    os.makedirs(out_dir, exist_ok=True)
    
    scene.render.engine = 'CYCLES'
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100
    scene.cycles.samples = 64
    scene.cycles.device = 'GPU'
    scene.render.use_persistent_data = True
    
    t_start = time.perf_counter()
    frame_times = []
    
    for f in range(80, 121):
        scene.frame_set(f)
        scene.render.filepath = os.path.join(out_dir, f"frame_{f:03d}.png")
        t0 = time.perf_counter()
        bpy.ops.render.render(write_still=True)
        dur = time.perf_counter() - t0
        frame_times.append(dur)
        if f in [80, 90, 100, 110, 120]:
            print(f"Rendered Frame {f:3d} in {dur:.2f} s")
            
    t_total = time.perf_counter() - t_start
    avg_dur = sum(frame_times) / len(frame_times)
    
    print("\n" + "=" * 60)
    print("CONSECUTIVE SECTION 80-120 RESULTS (41 frames):")
    print(f"Total time: {t_total:.2f} s")
    print(f"Average time per frame: {avg_dur:.2f} s")
    print(f"Fastest frame: {min(frame_times):.2f} s")
    print(f"Slowest frame: {max(frame_times):.2f} s")
    print("=" * 60)

if __name__ == '__main__':
    render_section()
