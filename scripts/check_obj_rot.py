import bpy

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

obj = bpy.data.objects['Hero_Particle_System']
print('Obj anim data:', obj.animation_data)
if obj.animation_data and obj.animation_data.action:
    print('Action name:', obj.animation_data.action.name)
    for l in obj.animation_data.action.layers:
        for s in l.strips:
            for cb in s.channelbags:
                slot_id = cb.slot.identifier if cb.slot else None
                print(f'Channelbag slot: {slot_id}')
                for fc in cb.fcurves:
                    print(f'  FCurve: {fc.data_path}[{fc.array_index}] keys={len(fc.keyframe_points)}')
                    for pt in fc.keyframe_points:
                        print(f'    frame={pt.co[0]}, val={pt.co[1]}')

scene = bpy.context.scene
print("\nEvaluating rotation across frames:")
for f in [1, 30, 60, 90, 120, 150, 180, 210, 240]:
    scene.frame_set(f)
    print(f'Frame {f:3d}: rot_z = {obj.rotation_euler.z:.4f} rad ({obj.rotation_euler.z*180/3.14159:.1f} deg)')
