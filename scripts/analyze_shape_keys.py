import bpy

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

act = bpy.data.actions['Hero_Particle_MeshAction']
strip = act.layers[0].strips[0]

print("Total channelbags:", len(strip.channelbags))
for cb_idx, cb in enumerate(strip.channelbags):
    print(f"\nChannelBag {cb_idx}: slot={cb.slot}, fcurves={len(cb.fcurves)}")
    for fc in cb.fcurves:
        vals = [kp.co[1] for kp in fc.keyframe_points]
        non_zero = [v for v in vals if abs(v) > 1e-4]
        max_v = max(vals) if vals else 0
        min_v = min(vals) if vals else 0
        print(f"  FCurve: '{fc.data_path}' [{fc.array_index}] | keys: {len(fc.keyframe_points)} | min: {min_v:.3f}, max: {max_v:.3f}, non-zero count: {len(non_zero)}")

# Also let's check which shape keys have any difference from the basis (State_Globe)
obj = bpy.data.objects['Hero_Particle_System']
sk = obj.data.shape_keys
basis = sk.key_blocks['State_Globe']
print("\nShape Keys Analysis:")
for kb in sk.key_blocks:
    diff_count = 0
    max_diff = 0.0
    for i in range(len(kb.data)):
        d = (kb.data[i].co - basis.data[i].co).length
        if d > 1e-4:
            diff_count += 1
            if d > max_diff:
                max_diff = d
    print(f"  ShapeKey '{kb.name}': diff_verts={diff_count}/3200, max_displacement={max_diff:.4f}")
