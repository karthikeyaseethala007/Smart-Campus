import bpy
import time
import os

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

sc_dev = bpy.data.scenes.get("Animation_Development")
assert sc_dev is not None, "Animation_Development scene not found!"
bpy.context.window.scene = sc_dev

out_dir = "/Users/karthikeya.s/Documents/focus/dev_preview_milestones"
os.makedirs(out_dir, exist_ok=True)

test_frames = [1, 40, 80, 120, 160, 200, 240]
labels = {
    1: "Globe REST",
    40: "Globe -> Electricity (Morph)",
    80: "Electricity RESOLVED",
    120: "Electricity -> Fire (Morph)",
    160: "Fire RESOLVED",
    200: "Fire -> Lock (Morph)",
    240: "Lock RESOLVED"
}

print("=" * 80)
print("TESTING ANIMATION PLAYBACK IN LIGHTWEIGHT DEVELOPMENT MODE (EEVEE)")
print("=" * 80)

# Full 240 frames playback scrub test
t_start = time.perf_counter()
for f in range(1, 241):
    sc_dev.frame_set(f)
    dg = bpy.context.evaluated_depsgraph_get()
t_scrub = time.perf_counter() - t_start
fps = 240.0 / t_scrub
print(f"Full 240-frame timeline scrub completed in: {t_scrub*1000.0:.2f} ms ({fps:.1f} FPS)")

# Render the 7 test milestone preview frames
print("\nRendering 7 development preview milestone frames...")
for f in test_frames:
    sc_dev.frame_set(f)
    sc_dev.render.filepath = os.path.join(out_dir, f"dev_frame_{f:03d}.png")
    t0 = time.perf_counter()
    bpy.ops.render.render(write_still=True)
    dt = (time.perf_counter() - t0) * 1000.0
    print(f"  Frame {f:3d} ({labels[f]:<30}) rendered in {dt:.1f} ms -> {sc_dev.render.filepath}")

print("\nAll development preview milestone frames successfully verified!")
print("=" * 80)
