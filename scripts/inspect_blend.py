import bpy

print("\n=== BLENDER 5.2 SCENE INSPECTION ===")
for obj in bpy.data.objects:
    print(f"Object: {obj.name}, type={obj.type}, loc={obj.location}, rot={obj.rotation_euler}, scale={obj.scale}")
    if obj.type == 'MESH':
        mesh = obj.data
        print(f"  Mesh: {mesh.name}, verts={len(mesh.vertices)}")
        if mesh.shape_keys:
            print("  Shape keys:")
            for kb in mesh.shape_keys.key_blocks:
                print(f"    - {kb.name}: value={kb.value}, mute={kb.mute}")
                # check bounds of coordinates
                coords = [v.co for v in kb.data]
                xs = [c.x for c in coords]
                ys = [c.y for c in coords]
                zs = [c.z for c in coords]
                print(f"      X: [{min(xs):.2f}, {max(xs):.2f}], Y: [{min(ys):.2f}, {max(ys):.2f}], Z: [{min(zs):.2f}, {max(zs):.2f}]")

def dump_action(name, act):
    print(f"--- Action: {name} (type: {type(act)}) ---")
    if hasattr(act, 'fcurves'):
        for fc in act.fcurves:
            print(f"  Legacy FCurve: {fc.data_path}[{fc.array_index}], points={len(fc.keyframe_points)}")
            for pt in fc.keyframe_points:
                print(f"    f={pt.co[0]:.1f}, val={pt.co[1]:.3f}, interp={pt.interpolation}")
    if hasattr(act, 'layers'):
        for layer in act.layers:
            print(f"  Layer: {layer.name}")
            for strip in layer.strips:
                print(f"    Strip: {strip.name}")
                for channelbag in strip.channelbags:
                    slot_name = channelbag.slot.name if channelbag.slot else "no-slot"
                    print(f"      Channelbag (Slot: {slot_name}):")
                    for fc in channelbag.fcurves:
                        print(f"        FCurve: {fc.data_path}[{fc.array_index}], pts={len(fc.keyframe_points)}")
                        for pt in fc.keyframe_points:
                            print(f"          f={pt.co[0]:.1f}, val={pt.co[1]:.3f}, interp={pt.interpolation}")

for act in bpy.data.actions:
    dump_action(act.name, act)

print("\n=== FRAME EVALUATION ===")
# Check keyframe values at various frames
scene = bpy.context.scene
mesh_obj = bpy.data.objects['Hero_Particle_System']
sk = mesh_obj.data.shape_keys
for f in [1, 30, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240]:
    scene.frame_set(f)
    rot_z = mesh_obj.rotation_euler.z
    sk_vals = {kb.name: round(kb.value, 3) for kb in sk.key_blocks}
    print(f"Frame {f:3d}: rot_z={rot_z:.3f} rad ({rot_z*180/3.14159:.1f} deg), shape_keys={sk_vals}")

