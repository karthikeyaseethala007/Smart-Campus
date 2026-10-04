import bpy

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

obj = bpy.data.objects['Hero_Particle_System']
ad = obj.animation_data
act = ad.action

print("Action:", act.name)
for layer in act.layers:
    print(f"Layer: {layer.name}")
    for strip in layer.strips:
        print(f"  Strip: type={type(strip)}")
        for cb in strip.channelbags:
            slot_id = cb.slot.identifier if cb.slot else None
            print(f"    Channelbag: slot={slot_id}, fcurves={len(cb.fcurves)}")
            for fc in cb.fcurves:
                print(f"      FCurve: {fc.data_path}[{fc.array_index}] keys={len(fc.keyframe_points)}")
                for pt in fc.keyframe_points:
                    print(f"        pt: f={pt.co[0]}, val={pt.co[1]}")

# Let's test creating a separate dedicated action for the Object transform:
# In Blender, standard practice is:
# Shape keys have their own Action (on mesh.shape_keys.animation_data)
# Object transform has its own Action (on obj.animation_data)
# Let's see: mesh.shape_keys.animation_data:
sk = obj.data.shape_keys
print("\nShape keys anim data:", sk.animation_data)
if sk.animation_data:
    print("SK Action:", sk.animation_data.action)
