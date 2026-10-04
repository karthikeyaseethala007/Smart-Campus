import bpy
import numpy as np

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

scene = bpy.context.scene
obj = bpy.data.objects['Hero_Particle_System']

frames = [32, 40, 48, 56, 64, 86, 107, 117, 125, 133, 155, 177, 225]
frame_labels = [
    "End of Globe HOLD",
    "Globe -> Electricity (18%)",
    "Globe -> Electricity (40%)",
    "Globe -> Electricity (60%)",
    "Globe -> Electricity (80%)",
    "Electricity HOLD",
    "Electricity -> Fire (15%)",
    "Electricity -> Fire (40%)",
    "Electricity -> Fire (60%)",
    "Electricity -> Fire (80%)",
    "Fire HOLD",
    "Fire -> Lock (15%)",
    "Lock HOLD"
]

print("=" * 110)
print(f"{'Frame':<6} | {'Label':<28} | {'Verts':<6} | {'BBox X':<14} | {'BBox Y':<14} | {'BBox Z':<14} | {'Max Step':<9} | {'Mean Step':<9}")
print("=" * 110)

prev_coords = None

for f, label in zip(frames, frame_labels):
    scene.frame_set(f)
    depsgraph = bpy.context.evaluated_depsgraph_get()
    
    # Evaluate object deformation with shape keys
    eval_obj = obj.evaluated_get(depsgraph)
    
    # We want vertex positions deformed by shape keys
    # If modifiers are present, we can get vertex positions from evaluated mesh or directly compute from shape keys:
    sk = obj.data.shape_keys
    # Compute composite position from shape keys:
    basis = np.array([tuple(v.co) for v in sk.key_blocks[0].data])
    composite = basis.copy()
    for kb in sk.key_blocks[1:]:
        val = kb.value
        if abs(val) > 1e-6:
            kb_co = np.array([tuple(v.co) for v in kb.data])
            composite += val * (kb_co - basis)
            
    n_verts = len(composite)
    min_x, max_x = composite[:, 0].min(), composite[:, 0].max()
    min_y, max_y = composite[:, 1].min(), composite[:, 1].max()
    min_z, max_z = composite[:, 2].min(), composite[:, 2].max()
    
    if prev_coords is not None:
        step_disp = np.linalg.norm(composite - prev_coords, axis=1)
        max_d = step_disp.max()
        mean_d = step_disp.mean()
    else:
        max_d = 0.0
        mean_d = 0.0
        
    prev_coords = composite.copy()
    
    print(f"{f:<6} | {label:<28} | {n_verts:<6} | [{min_x:5.2f}, {max_x:5.2f}] | [{min_y:5.2f}, {max_y:5.2f}] | [{min_z:5.2f}, {max_z:5.2f}] | {max_d:<9.3f} | {mean_d:<9.3f}")

print("=" * 110)
