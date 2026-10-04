import bpy

# Test keyframe insertion on object and shape keys
obj = bpy.data.objects['Hero_Particle_System']
mesh = obj.data
sk = mesh.shape_keys

print("Testing keyframe insertion...")
obj.rotation_euler.z = 0.0
obj.keyframe_insert(data_path="rotation_euler", index=2, frame=1)
obj.rotation_euler.z = 6.2831853
obj.keyframe_insert(data_path="rotation_euler", index=2, frame=240)

kb_elec = sk.key_blocks['State_Electricity']
kb_elec.value = 0.0
kb_elec.keyframe_insert(data_path="value", frame=1)
kb_elec.keyframe_insert(data_path="value", frame=55)
kb_elec.value = 1.0
kb_elec.keyframe_insert(data_path="value", frame=80)

print("Keyframe insertion succeeded!")
