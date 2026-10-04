import bpy

act = bpy.data.objects['Hero_Particle_System'].animation_data.action
print("Action:", act.name)
print("Layers:", len(act.layers))
for l in act.layers:
    print("Layer:", l.name)
    for s in l.strips:
        for cb in s.channelbags:
            print("Channelbag:", cb)
            for fc in cb.fcurves:
                print(f"  FCurve: {fc.data_path}[{fc.array_index}] pts={len(fc.keyframe_points)}")
                for pt in fc.keyframe_points:
                    print(f"    f={pt.co[0]:.1f}, v={pt.co[1]:.3f}, interp={pt.interpolation}")

# Also check shape keys animation data
sk = bpy.data.objects['Hero_Particle_System'].data.shape_keys
if sk and sk.animation_data:
    print("Shape keys action:", sk.animation_data.action)
    if sk.animation_data.action:
        sk_act = sk.animation_data.action
        for l in sk_act.layers:
            for s in l.strips:
                for cb in s.channelbags:
                    for fc in cb.fcurves:
                        print(f"  SK FCurve: {fc.data_path}[{fc.array_index}] pts={len(fc.keyframe_points)}")
                        for pt in fc.keyframe_points:
                            print(f"    f={pt.co[0]:.1f}, v={pt.co[1]:.3f}, interp={pt.interpolation}")

# Also evaluate frames across 1 to 240
print("\n=== EVALUATING FRAMES 1..240 ===")
scene = bpy.context.scene
obj = bpy.data.objects['Hero_Particle_System']
for f in range(1, 241, 10):
    scene.frame_set(f)
    sk_vals = {kb.name: round(kb.value, 3) for kb in sk.key_blocks}
    print(f"F{f:03d}: rot_z={obj.rotation_euler.z*180/3.14159:.1f}deg, scale={obj.scale.x:.2f}, SK={sk_vals}")
