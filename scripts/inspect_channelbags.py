import bpy

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

act = bpy.data.actions['Hero_Particle_MeshAction']
strip = act.layers[0].strips[0]
for cb in strip.channelbags:
    print(f"ChannelBag: {cb}")
    print("ChannelBag dir:", dir(cb))
    for fc in cb.fcurves:
        print(f"  FCurve: {fc.data_path} [{fc.array_index}] (keys: {len(fc.keyframe_points)})")
        for pt in fc.keyframe_points:
            print(f"    frame {pt.co[0]}: {pt.co[1]}")

# Also let's inspect the mesh data and shape keys of Hero_Particle_Mesh
obj = bpy.data.objects['Hero_Particle_System']
sk = obj.data.shape_keys
print("\nShape keys on Hero_Particle_Mesh:")
for kb in sk.key_blocks:
    print(f"  {kb.name}: val={kb.value}, mute={kb.mute}, rel={kb.relative_key.name if kb.relative_key else None}")
