import bpy
import numpy as np

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
print(f"Opening blend file: {blend_path}")
bpy.ops.wm.open_mainfile(filepath=blend_path)

scene = bpy.context.scene
p_obj = bpy.data.objects['Hero_Particle_System']
mesh = p_obj.data
sk = mesh.shape_keys
kb = sk.key_blocks

# 1. Retrieve the 4 artist base states
P_G = np.array([v.co for v in kb['State_Globe'].data])
P_E = np.array([v.co for v in kb['State_Electricity'].data])
P_F = np.array([v.co for v in kb['State_Fire'].data])
P_L = np.array([v.co for v in kb['State_Lock'].data])

N = len(P_G)
assert N == 3200, f"Expected 3200 vertices, got {N}"
print(f"Verified exactly {N} persistent vertices in {p_obj.name}.")

# 2. Compute Intermediate States
# --- A. Globe -> Electricity ---
r_G = np.linalg.norm(P_G, axis=1, keepdims=True)
theta_G = np.arctan2(P_G[:, 1:2], P_G[:, 0:1])
phi_G = np.arcsin(np.clip(P_G[:, 2:3] / np.maximum(r_G, 1e-6), -1.0, 1.0))
n_G = P_G / np.maximum(r_G, 1e-6)

# Globe_PreDistort: Subtle harmonic surface ripple on sphere
delta_r = 0.08 * np.sin(3 * phi_G) * np.cos(2 * theta_G) + 0.04 * np.cos(4 * theta_G)
P_G_pre = (1 - 0.15) * P_G + 0.15 * P_E + delta_r * n_G

# Globe_Energy: Swirling azimuthal expansion along electromagnetic field lines
P_base_ge = (1 - 0.45) * P_G + 0.45 * P_E
z_ge = P_base_ge[:, 2]
dth_ge = 0.50 * (1.0 - np.clip((z_ge / 2.2)**2, 0, 1))
boost_ge = 1.0 + 0.22 * np.cos(np.clip(np.pi * z_ge / 4.0, -np.pi/2, np.pi/2))**2
x_ge = boost_ge * (P_base_ge[:, 0] * np.cos(dth_ge) - P_base_ge[:, 1] * np.sin(dth_ge))
y_ge = boost_ge * (P_base_ge[:, 0] * np.sin(dth_ge) + P_base_ge[:, 1] * np.cos(dth_ge))
z_ge = z_ge + 0.08 * np.sin(3 * theta_G[:, 0])
P_G_energy = np.stack([x_ge, y_ge, z_ge], axis=1)

# Globe_Transition: Particles stream along curved arcs into lightning bolt
P_base_gt = (1 - 0.78) * P_G + 0.78 * P_E
z_gt = P_base_gt[:, 2]
dth_gt = 0.22 * (1.0 - np.clip((z_gt / 2.2)**2, 0, 1))
x_gt = P_base_gt[:, 0] * np.cos(dth_gt) - P_base_gt[:, 1] * np.sin(dth_gt)
y_gt = P_base_gt[:, 0] * np.sin(dth_gt) + P_base_gt[:, 1] * np.cos(dth_gt)
P_G_trans = np.stack([x_gt, y_gt, z_gt], axis=1)

# --- B. Electricity -> Fire ---
# Electricity_PreFire: Thermal softening and upward convective drift
P_base_ep = (1 - 0.20) * P_E + 0.20 * P_F
dz_ep = 0.08 * (1.0 + P_base_ep[:, 2] / 2.0)
dx_ep = 0.06 * np.sin(3.5 * P_base_ep[:, 2])
dy_ep = 0.04 * np.cos(2.5 * P_base_ep[:, 2])
P_E_pre = np.stack([P_base_ep[:, 0] + dx_ep, P_base_ep[:, 1] + dy_ep, P_base_ep[:, 2] + dz_ep], axis=1)

# Electricity_Energy: Thermal blooming and buoyant expansion
P_base_ee = (1 - 0.50) * P_E + 0.50 * P_F
factor_ee = 1.0 + 0.18 * np.sin(np.clip(np.pi * (P_base_ee[:, 2] + 1.8) / 3.6, 0, np.pi))
x_ee = P_base_ee[:, 0] * factor_ee + 0.10 * np.sin(2.5 * P_base_ee[:, 2] + 0.5)
y_ee = P_base_ee[:, 1] * factor_ee
z_ee = P_base_ee[:, 2] + 0.12 * (1.0 + P_base_ee[:, 2] / 2.0)
P_E_energy = np.stack([x_ee, y_ee, z_ee], axis=1)

# Electricity_Transition: Particles converge into twin curving flame tongues
P_base_et = (1 - 0.80) * P_E + 0.80 * P_F
x_et = P_base_et[:, 0] + 0.04 * np.sin(3.0 * P_base_et[:, 2])
y_et = P_base_et[:, 1]
z_et = P_base_et[:, 2] + 0.04
P_E_trans = np.stack([x_et, y_et, z_et], axis=1)

# --- C. Fire -> Lock ---
# Fire_PreLock: Thermal cooling and vertical stabilization
P_base_fp = (1 - 0.20) * P_F + 0.20 * P_L
z_damp = P_base_fp[:, 2] - 0.06 * np.maximum(0.0, P_base_fp[:, 2] - 0.8)
P_F_pre = np.stack([P_base_fp[:, 0], P_base_fp[:, 1], z_damp], axis=1)

# Fire_Energy: Crystallization into tumbler body + arched shackle
P_base_fe = (1 - 0.52) * P_F + 0.52 * P_L
is_sh = P_base_fe[:, 2] > 0.1
x_fe = P_base_fe[:, 0].copy()
y_fe = P_base_fe[:, 1].copy()
z_fe = P_base_fe[:, 2].copy()
z_fe[is_sh] += 0.10 * np.cos(np.clip(np.pi * P_base_fe[is_sh, 0] / 2.0, -np.pi/2, np.pi/2))
x_fe[~is_sh] *= 0.96
y_fe[~is_sh] *= 0.96
P_F_energy = np.stack([x_fe, y_fe, z_fe], axis=1)

# Fire_Transition: Padlock structure snaps into mechanical alignment
P_F_trans = (1 - 0.82) * P_F + 0.82 * P_L

intermediates = [
    ('Globe_PreDistort', P_G_pre),
    ('Globe_Energy', P_G_energy),
    ('Globe_Transition', P_G_trans),
    ('Electricity_PreFire', P_E_pre),
    ('Electricity_Energy', P_E_energy),
    ('Electricity_Transition', P_E_trans),
    ('Fire_PreLock', P_F_pre),
    ('Fire_Energy', P_F_energy),
    ('Fire_Transition', P_F_trans),
]

# Set/add shape keys
for name, coords in intermediates:
    if name in kb:
        block = kb[name]
    else:
        block = p_obj.shape_key_add(name=name, from_mix=False)
    block.relative_key = kb['State_Globe']
    block.slider_min = 0.0
    block.slider_max = 1.0
    for i in range(N):
        block.data[i].co = coords[i]
    print(f"Set shape key data: {name}")

# 3. Shape Keys Keyframing
all_animated_keys = [
    'Globe_PreDistort',
    'Globe_Energy',
    'Globe_Transition',
    'State_Electricity',
    'Electricity_PreFire',
    'Electricity_Energy',
    'Electricity_Transition',
    'State_Fire',
    'Fire_PreLock',
    'Fire_Energy',
    'Fire_Transition',
    'State_Lock',
]

# Clear existing animation on shape keys
if sk.animation_data:
    sk.animation_data_clear()
sk.animation_data_create()

def smooth(u):
    u = np.clip(u, 0.0, 1.0)
    return 3*u**2 - 2*u**3

def evaluate_timeline(f):
    keys = {k: 0.0 for k in all_animated_keys}
    
    # Phase 1: 1..35 Globe Hold
    if f <= 35:
        return keys
    
    # Phase 2: 35..75 Transition 1 (Globe -> Elec)
    elif f <= 45:
        t = smooth((f - 35) / 10.0)
        keys['Globe_PreDistort'] = t
    elif f <= 55:
        t = smooth((f - 45) / 10.0)
        keys['Globe_PreDistort'] = 1.0 - t
        keys['Globe_Energy'] = t
    elif f <= 65:
        t = smooth((f - 55) / 10.0)
        keys['Globe_Energy'] = 1.0 - t
        keys['Globe_Transition'] = t
    elif f <= 75:
        t = smooth((f - 65) / 10.0)
        keys['Globe_Transition'] = 1.0 - t
        keys['State_Electricity'] = t
        
    # Phase 3: 75..105 Electricity Hold
    elif f <= 105:
        keys['State_Electricity'] = 1.0
        
    # Phase 4: 105..145 Transition 2 (Elec -> Fire)
    elif f <= 115:
        t = smooth((f - 105) / 10.0)
        keys['State_Electricity'] = 1.0 - t
        keys['Electricity_PreFire'] = t
    elif f <= 125:
        t = smooth((f - 115) / 10.0)
        keys['Electricity_PreFire'] = 1.0 - t
        keys['Electricity_Energy'] = t
    elif f <= 135:
        t = smooth((f - 125) / 10.0)
        keys['Electricity_Energy'] = 1.0 - t
        keys['Electricity_Transition'] = t
    elif f <= 145:
        t = smooth((f - 135) / 10.0)
        keys['Electricity_Transition'] = 1.0 - t
        keys['State_Fire'] = t
        
    # Phase 5: 145..175 Fire Hold
    elif f <= 175:
        keys['State_Fire'] = 1.0
        
    # Phase 6: 175..215 Transition 3 (Fire -> Lock)
    elif f <= 185:
        t = smooth((f - 175) / 10.0)
        keys['State_Fire'] = 1.0 - t
        keys['Fire_PreLock'] = t
    elif f <= 195:
        t = smooth((f - 185) / 10.0)
        keys['Fire_PreLock'] = 1.0 - t
        keys['Fire_Energy'] = t
    elif f <= 205:
        t = smooth((f - 195) / 10.0)
        keys['Fire_Energy'] = 1.0 - t
        keys['Fire_Transition'] = t
    elif f <= 215:
        t = smooth((f - 205) / 10.0)
        keys['Fire_Transition'] = 1.0 - t
        keys['State_Lock'] = t
        
    # Phase 7: 215..240 Lock Hold
    else:
        keys['State_Lock'] = 1.0
        
    return keys

# Insert keyframes for each frame 1..240
print("Keyframing shape keys across 240 frames...")
for f in range(1, 241):
    vals = evaluate_timeline(f)
    for k_name in all_animated_keys:
        kb[k_name].value = vals[k_name]
        kb[k_name].keyframe_insert(data_path="value", frame=f)

print("Shape keys keyframing complete.")

# 4. Continuous Linear Z Rotation on Hero_Particle_System
if p_obj.animation_data:
    p_obj.animation_data_clear()
p_obj.animation_data_create()

p_obj.rotation_euler.z = 0.0
p_obj.keyframe_insert(data_path="rotation_euler", index=2, frame=1)
p_obj.rotation_euler.z = 2.0 * np.pi
p_obj.keyframe_insert(data_path="rotation_euler", index=2, frame=240)

# Set rotation interpolation to LINEAR
def get_action_fcurves(action):
    fcurves = []
    if not action:
        return fcurves
    if hasattr(action, 'fcurves'):
        fcurves.extend(action.fcurves)
    if hasattr(action, 'layers'):
        for layer in action.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    fcurves.extend(cb.fcurves)
    return fcurves

for fc in get_action_fcurves(p_obj.animation_data.action):
    if fc.data_path == "rotation_euler" and fc.array_index == 2:
        for pt in fc.keyframe_points:
            pt.interpolation = 'LINEAR'
print("Verified continuous linear Z rotation: 0° -> 360° across frames 1..240.")

# 5. Scene Settings & Render Optimization
scene.frame_start = 1
scene.frame_end = 240
scene.render.fps = 24
scene.render.fps_base = 1.0
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100

# Save blend file
bpy.ops.wm.save_mainfile(filepath=blend_path)
print(f"Successfully saved {blend_path}")

