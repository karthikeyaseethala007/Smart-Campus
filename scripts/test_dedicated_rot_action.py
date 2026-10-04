import bpy

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

obj = bpy.data.objects['Hero_Particle_System']

# Give object its own separate action
act_rot = bpy.data.actions.new(name="Hero_Object_Rotation")
obj.animation_data.action = act_rot

# Insert keyframes on obj
obj.rotation_euler.z = 0.0
obj.keyframe_insert(data_path="rotation_euler", index=2, frame=1.0)
obj.rotation_euler.z = 6.28318530718
obj.keyframe_insert(data_path="rotation_euler", index=2, frame=240.0)

# Set interpolation to linear
for layer in act_rot.layers:
    for strip in layer.strips:
        for cb in strip.channelbags:
            for fc in cb.fcurves:
                for kp in fc.keyframe_points:
                    kp.interpolation = 'LINEAR'

# Test evaluation
scene = bpy.context.scene
print("Evaluating rotation with dedicated action:")
for f in [1, 60, 120, 180, 240]:
    scene.frame_set(f)
    print(f"Frame {f:3d}: rot_z = {obj.rotation_euler.z:.4f} rad ({obj.rotation_euler.z*180/3.14159:.1f} deg)")

# Also verify shape keys still evaluate properly
sk = obj.data.shape_keys
print("\nVerifying shape key evaluation:")
for f in [1, 40, 80, 120, 160, 200, 240]:
    scene.frame_set(f)
    active_keys = {kb.name: round(kb.value, 3) for kb in sk.key_blocks if kb.value > 0.01}
    print(f"Frame {f:3d}: active={active_keys}")

# If successful, save to Untitled(1).blend
bpy.ops.wm.save_mainfile(filepath=blend_path)
print("Saved to Untitled(1).blend")
