import bpy
import math

filepath = "/Users/karthikeya.s/Documents/focus/hero_particle_animation.blend"
bpy.ops.wm.open_mainfile(filepath=filepath)

p_obj = bpy.data.objects['Hero_Particle_System']
mesh = p_obj.data
sk = mesh.shape_keys
kb = sk.key_blocks

# 1. Clear any existing animation data
if p_obj.animation_data:
    p_obj.animation_data_clear()
if sk.animation_data:
    sk.animation_data_clear()

p_obj.animation_data_create()
sk.animation_data_create()

p_obj.rotation_mode = 'XYZ'

# 2. Keyframe shape keys and continuous Z-rotation at every frame [1..240]
# Exact schedule:
# 1–32:     GLOBE HOLD (rotates)
# 33–72:    GLOBE -> ELECTRICITY (40 frames)
# 73–105:   ELECTRICITY HOLD (33 frames, stable hold!)
# 106–140:  ELECTRICITY -> FIRE (35 frames)
# 141–170:  FIRE HOLD (30 frames, stable hold!)
# 171–205:  FIRE -> LOCK (35 frames)
# 206–240:  LOCK HOLD (35 frames, stable hold!)

def hermite(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)

# Reset all values
for k in ['State_Electricity', 'State_Fire', 'State_Lock']:
    kb[k].value = 0.0

for f in range(1, 241):
    # Z rotation: exactly 360 degrees over 240 frames
    rot_z = 2.0 * math.pi * (f - 1) / 239.0
    p_obj.rotation_euler = (0, 0, rot_z)
    p_obj.keyframe_insert(data_path="rotation_euler", index=2, frame=f)
    
    val_elec = 0.0
    val_fire = 0.0
    val_lock = 0.0
    
    if f <= 32:
        # Globe Hold
        val_elec = 0.0
        val_fire = 0.0
        val_lock = 0.0
    elif f <= 72:
        # Globe -> Electricity
        t = (f - 32) / 40.0
        val_elec = hermite(t)
    elif f <= 105:
        # Electricity Hold (Stable!)
        val_elec = 1.0
    elif f <= 140:
        # Electricity -> Fire
        t = (f - 105) / 35.0
        val_elec = 1.0 - hermite(t)
        val_fire = hermite(t)
    elif f <= 170:
        # Fire Hold (Stable!)
        val_fire = 1.0
    elif f <= 205:
        # Fire -> Lock
        t = (f - 170) / 35.0
        val_fire = 1.0 - hermite(t)
        val_lock = hermite(t)
    else:
        # Lock Hold (Stable!)
        val_lock = 1.0
        
    kb['State_Electricity'].value = val_elec
    kb['State_Fire'].value = val_fire
    kb['State_Lock'].value = val_lock
    
    kb['State_Electricity'].keyframe_insert(data_path="value", frame=f)
    kb['State_Fire'].keyframe_insert(data_path="value", frame=f)
    kb['State_Lock'].keyframe_insert(data_path="value", frame=f)

print("Keyframed all 240 frames successfully.")

# Verify values at milestones
test_frames = [1, 20, 32, 52, 73, 90, 105, 122, 141, 155, 170, 188, 206, 225, 240]
for tf in test_frames:
    bpy.context.scene.frame_set(tf)
    print(f"Frame {tf:03d}: Elec={kb['State_Electricity'].value:.3f}, Fire={kb['State_Fire'].value:.3f}, Lock={kb['State_Lock'].value:.3f}, RotZ={math.degrees(p_obj.rotation_euler[2]):.1f} deg")

# Save updated blend file
bpy.ops.wm.save_mainfile(filepath=filepath)
# Also copy to Untitled(1).blend for backup/consistency
bpy.ops.wm.save_mainfile(filepath="/Users/karthikeya.s/Documents/focus/Untitled(1).blend")
print(f"SUCCESS: Saved updated animation system to {filepath} and Untitled(1).blend")
