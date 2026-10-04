import bpy

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

scene = bpy.context.scene
obj = bpy.data.objects['Hero_Particle_System']
sk = obj.data.shape_keys
kb = sk.key_blocks

print("=== SHAPE KEY VALUES SUMMARY ===")
# Inspect frame by frame values to determine exact hold and transition ranges
for f in range(1, 241, 5):
    scene.frame_set(f)
    active = []
    for k in kb.keys():
        if k != 'State_Globe' and kb[k].value > 0.01:
            active.append(f"{k}={kb[k].value:.2f}")
    if not active:
        active = ["State_Globe=1.00 (Rest)"]
    print(f"Frame {f:3d}: {', '.join(active)}")
