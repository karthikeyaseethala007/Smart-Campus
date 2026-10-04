import bpy

scene = bpy.context.scene
obj = bpy.data.objects['Hero_Particle_System']
sk = obj.data.shape_keys

print(f"{'Frame':<6} | {'rot_z (deg)':<12} | " + " | ".join([f"{kb.name[:12]:<12}" for kb in sk.key_blocks]))
print("-" * 180)

# Check frames at key steps and user requested checkpoints
check_frames = [1, 10, 20, 30, 32, 40, 48, 56, 60, 64, 70, 80, 86, 90, 100, 107, 110, 117, 120, 125, 130, 133, 140, 150, 155, 160, 170, 177, 180, 190, 200, 210, 220, 225, 230, 240]

for f in check_frames:
    scene.frame_set(f)
    vals = " | ".join([f"{kb.value:<12.3f}" for kb in sk.key_blocks])
    print(f"{f:<6} | {obj.rotation_euler.z*180/3.14159:<12.1f} | {vals}")
