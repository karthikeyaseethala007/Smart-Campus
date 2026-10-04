import bpy

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

obj = bpy.data.objects['Hero_Particle_System']
ad = obj.animation_data
print('Action:', ad.action)
print('Action slots in action:')
if ad.action:
    for slot in ad.action.slots:
        print(f"  Slot: identifier='{slot.identifier}', dir={dir(slot)}")
    print('Current ad.action_slot:', getattr(ad, 'action_slot', None))
    print('Dir ad:', [x for x in dir(ad) if 'slot' in x or 'action' in x])

scene = bpy.context.scene
print("\nTesting evaluation with depsgraph:")
for f in [1, 60, 120, 180, 240]:
    scene.frame_set(f)
    dg = bpy.context.evaluated_depsgraph_get()
    eval_obj = obj.evaluated_get(dg)
    print(f"Frame {f:3d}: obj.rot_z = {obj.rotation_euler.z:.4f}, eval_obj.rot_z = {eval_obj.rotation_euler.z:.4f}")
