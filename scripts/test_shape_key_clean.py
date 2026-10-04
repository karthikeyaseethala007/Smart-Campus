import bpy
import numpy as np

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

scene = bpy.context.scene
obj = bpy.data.objects['Hero_Particle_System']
sk = obj.data.shape_keys
kb = sk.key_blocks

# 1. Record original values for every shape key on every frame 1..240
orig_values = {}
for name in kb.keys():
    orig_values[name] = np.zeros(241)

for f in range(1, 241):
    scene.frame_set(f)
    for name in kb.keys():
        orig_values[name][f] = kb[name].value

print("Original values recorded.")

# Check unused keys
unused = []
for name, vals in orig_values.items():
    if np.max(np.abs(vals)) < 1e-4:
        unused.append(name)
print(f"Completely unused shape keys (always 0): {unused}")

# 2. Test cleaning fcurves
act = bpy.data.actions['Hero_Particle_MeshAction']
strip = act.layers[0].strips[0]
cb_keys = None
for cb in strip.channelbags:
    if cb.slot.identifier == 'KEKey':
        cb_keys = cb
        break

print(f"Found ChannelBag for KEKey with {len(cb_keys.fcurves)} fcurves.")

# Let's see how many keyframes each fcurve currently has
total_keys_before = sum(len(fc.keyframe_points) for fc in cb_keys.fcurves)
print(f"Total keyframes before: {total_keys_before}")

# For each fcurve, let's test decimation:
# If consecutive points have the same value (e.g. 0.0), intermediate points are redundant!
# For example, [f1:0, f2:0, f3:0 ... f30:0] can be just [f1:0, f30:0].
for fc in cb_keys.fcurves:
    pts = [(kp.co[0], kp.co[1]) for kp in fc.keyframe_points]
    # find keep indices
    keep_indices = {0, len(pts) - 1}
    for i in range(1, len(pts) - 1):
        prev_f, prev_v = pts[i - 1]
        curr_f, curr_v = pts[i]
        next_f, next_v = pts[i + 1]
        # if curr is not on a flat line between prev and next, keep it
        if abs(curr_v - prev_v) > 1e-5 or abs(curr_v - next_v) > 1e-5:
            keep_indices.add(i)
            # also keep the boundary points
            keep_indices.add(i - 1)
            keep_indices.add(i + 1)
            
    print(f"FCurve {fc.data_path}: keys before={len(pts)}, keys after redundant flat removal={len(keep_indices)}")

