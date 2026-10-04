import bpy
import numpy as np

blend_path = "/Users/karthikeya.s/Documents/focus/hero_particle_animation_updated.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

obj = bpy.data.objects['Hero_Particle_System']
sk = obj.data.shape_keys
kb = sk.key_blocks

P_globe = np.load("/Users/karthikeya.s/Documents/focus/target_globe.npy")
P_elec = np.load("/Users/karthikeya.s/Documents/focus/target_electricity.npy")
P_fire = np.load("/Users/karthikeya.s/Documents/focus/target_fire.npy")
P_lock = np.load("/Users/karthikeya.s/Documents/focus/target_lock.npy")

# Precompute intermediate states
# 1. Globe_Energy: Swell + spiral dispersion
np.random.seed(42)
P_globe_energy = P_globe * (1.12 + np.random.normal(0, 0.05, (3200, 3)))

# 2. Globe_To_Electricity: 50% morph + jagged noise
P_g_to_e = 0.5 * P_globe + 0.5 * P_elec + np.random.normal(0, 0.08, (3200, 3))

# 3. Electricity_Energy: High voltage pulse swell
P_elec_energy = P_elec * 1.08 + np.random.normal(0, 0.06, (3200, 3))

# 4. Electricity_ToFire: 50% morph
P_e_to_f = 0.45 * P_elec + 0.55 * P_fire + np.random.normal(0, 0.06, (3200, 3))

# 5. Fire_Energy: Thermal updraft swell
P_fire_energy = P_fire.copy()
P_fire_energy[:, 2] += 0.25 # upward draft
P_fire_energy[:, :2] *= 1.08

# 6. Fire_ToLock: 50% morph
P_f_to_l = 0.4 * P_fire + 0.6 * P_lock + np.random.normal(0, 0.05, (3200, 3))

intermediates = [
    ('Globe_Energy', P_globe_energy),
    ('Globe_To_Electricity', P_g_to_e),
    ('Electricity_Energy', P_elec_energy),
    ('Electricity_ToFire', P_e_to_f),
    ('Fire_Energy', P_fire_energy),
    ('Fire_ToLock', P_f_to_l)
]

for name, arr in intermediates:
    if name not in kb:
        new_kb = obj.shape_key_add(name=name, from_mix=False)
    else:
        new_kb = kb[name]
    for i in range(3200):
        new_kb.data[i].co = arr[i]

# Clear existing animation on shape keys and object
if sk.animation_data:
    sk.animation_data_clear()
if obj.animation_data:
    obj.animation_data_clear()

# Animate Object continuous 360 rotation around Z
obj.rotation_mode = 'XYZ'
obj.rotation_euler = (0, 0, 0)
obj.keyframe_insert(data_path="rotation_euler", index=2, frame=1)
obj.rotation_euler = (0, 0, 2 * np.pi)
obj.keyframe_insert(data_path="rotation_euler", index=2, frame=240)

# Set linear interpolation for smooth rotation
if obj.animation_data and obj.animation_data.action:
    # Set extrapolation or linear keyframe interpolation
    for fcurve in obj.animation_data.action.fcurves if hasattr(obj.animation_data.action, 'fcurves') else []:
        for kf in fcurve.keyframe_points:
            kf.interpolation = 'LINEAR'

# Clear all shape key values
for b in kb:
    b.value = 0.0

# Define master keyframe track for shape keys
# Helper function to insert smooth keyframes
def key_sk(name, frame, val):
    b = kb[name]
    b.value = val
    b.keyframe_insert(data_path="value", frame=frame)

# 1. GLOBE HOLD: Frames 1 to 35
key_sk('State_Globe', 1, 1.0)
key_sk('State_Globe', 35, 1.0)
key_sk('State_Globe', 55, 0.0)

# 2. GLOBE -> ELECTRICITY TRANSITION: Frames 36 to 70
key_sk('Globe_Energy', 35, 0.0)
key_sk('Globe_Energy', 46, 0.8)
key_sk('Globe_Energy', 56, 0.0)

key_sk('Globe_To_Electricity', 44, 0.0)
key_sk('Globe_To_Electricity', 56, 1.0)
key_sk('Globe_To_Electricity', 68, 0.0)

key_sk('State_Electricity', 52, 0.0)
key_sk('State_Electricity', 70, 1.0)

# 3. ELECTRICITY HOLD: Frames 71 to 105 (35 frames)
key_sk('State_Electricity', 105, 1.0)
key_sk('State_Electricity', 124, 0.0)

# 4. ELECTRICITY -> FIRE TRANSITION: Frames 106 to 142
key_sk('Electricity_Energy', 105, 0.0)
key_sk('Electricity_Energy', 116, 0.85)
key_sk('Electricity_Energy', 126, 0.0)

key_sk('Electricity_ToFire', 114, 0.0)
key_sk('Electricity_ToFire', 128, 1.0)
key_sk('Electricity_ToFire', 140, 0.0)

key_sk('State_Fire', 122, 0.0)
key_sk('State_Fire', 142, 1.0)

# 5. FIRE HOLD: Frames 143 to 175 (33 frames)
key_sk('State_Fire', 175, 1.0)
key_sk('State_Fire', 194, 0.0)

# 6. FIRE -> LOCK TRANSITION: Frames 176 to 210
key_sk('Fire_Energy', 175, 0.0)
key_sk('Fire_Energy', 186, 0.8)
key_sk('Fire_Energy', 196, 0.0)

key_sk('Fire_ToLock', 184, 0.0)
key_sk('Fire_ToLock', 198, 1.0)
key_sk('Fire_ToLock', 210, 0.0)

key_sk('State_Lock', 192, 0.0)
key_sk('State_Lock', 210, 1.0)

# 7. LOCK HOLD: Frames 211 to 240 (30 frames)
key_sk('State_Lock', 240, 1.0)

# Ensure lights & camera are optimized
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = 240
scene.render.fps = 24
scene.render.film_transparent = True
scene.render.image_settings.color_mode = 'RGBA'

# Verify objects hidden
for hidden_name in ['Studio_Floor', 'Floating_Ground_Shadow', 'Globe_Inner_Aura']:
    if hidden_name in bpy.data.objects:
        bpy.data.objects[hidden_name].hide_render = True
        bpy.data.objects[hidden_name].hide_viewport = True

bpy.ops.wm.save_as_mainfile(filepath="/Users/karthikeya.s/Documents/focus/hero_particle_animation_updated.blend")
print("Master animation baked successfully into hero_particle_animation_updated.blend!")
