import bpy

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

obj = bpy.data.objects['Hero_Particle_System']
sk = obj.data.shape_keys

for sc in bpy.data.scenes:
    print(f"\n--- Testing Scene: {sc.name} ---")
    bpy.context.window.scene = sc
    for f in [1, 40, 86, 155, 225]:
        sc.frame_set(f)
        dg = bpy.context.evaluated_depsgraph_get()
        rot_z = obj.rotation_euler.z * 180 / 3.14159
        active_sk = {kb.name: round(kb.value, 3) for kb in sk.key_blocks if kb.value > 0.01}
        print(f"  Frame {f:3d}: rot_z={rot_z:5.1f} deg, shape_keys={active_sk}")
