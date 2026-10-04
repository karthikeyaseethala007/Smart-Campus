import bpy
import numpy as np

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

scene = bpy.context.scene
obj = bpy.data.objects['Hero_Particle_System']
sk = obj.data.shape_keys
kb = sk.key_blocks

print("=== SHAPE KEY EVALUATION ACROSS FRAMES 1..240 ===")
active_ranges = {}
for name in kb.keys():
    active_ranges[name] = []

for f in range(1, 241):
    scene.frame_set(f)
    for name, block in kb.items():
        v = block.value
        if v > 0.001:
            active_ranges[name].append((f, round(v, 4)))

for name, frames in active_ranges.items():
    if frames:
        f_nums = [f for f, v in frames]
        max_v = max(v for f, v in frames)
        print(f"ShapeKey '{name}': active in frames {min(f_nums)}..{max(f_nums)} (count: {len(frames)}), max val={max_v}")
    else:
        print(f"ShapeKey '{name}': NEVER ACTIVE (always 0.0)")
