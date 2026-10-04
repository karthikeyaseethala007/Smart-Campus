import bpy
import os
import sys
import numpy as np

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
print(f"Loading {blend_path}...")
bpy.ops.wm.open_mainfile(filepath=blend_path)

scene = bpy.context.scene
p_obj = bpy.data.objects['Hero_Particle_System']
mesh = p_obj.data
sk = mesh.shape_keys
kb = sk.key_blocks

N = 3200
assert len(mesh.vertices) == N, f"Expected 3200 vertices, found {len(mesh.vertices)}"
print(f"Verified exactly {N} persistent vertices.")

# -------------------------------------------------------------
# 1. BASE STATES RETRIEVAL & SHAPING
# -------------------------------------------------------------
P_G = np.array([v.co for v in kb['State_Globe'].data])
P_E_orig = np.array([v.co for v in kb['State_Electricity'].data])
P_F_orig = np.array([v.co for v in kb['State_Fire'].data])
P_L = np.array([v.co for v in kb['State_Lock'].data])

# --- Refine State_Electricity: 3D Branching High-Voltage Structure ---
np.random.seed(101)
z_sort = np.argsort(P_E_orig[:, 2])
P_E_sorted = P_E_orig[z_sort]

# Main bolt: 1600 particles with 3D ionized thickness
idx_main = np.linspace(0, N-1, 1600).astype(int)
main_bolt = P_E_sorted[idx_main].copy()
main_bolt[:, 1] = main_bolt[:, 1] * 2.5 + np.random.normal(0, 0.08, 1600)
main_bolt[:, 0] += np.random.normal(0, 0.03, 1600)

def make_jagged_branch(start_pt, dir_vec, length, count, roughness=0.20):
    t = np.linspace(0, 1, count)
    pts = np.outer(1 - t, start_pt) + np.outer(t, start_pt + dir_vec * length)
    norm = np.linalg.norm(dir_vec)
    d = dir_vec / (norm if norm > 1e-4 else 1.0)
    p1 = np.cross(d, [0, 0, 1])
    if np.linalg.norm(p1) < 1e-3: p1 = np.cross(d, [0, 1, 0])
    p1 = p1 / np.linalg.norm(p1)
    p2 = np.cross(d, p1)
    
    displ = np.zeros((count, 3))
    for freq in [3, 6, 12]:
        phase = np.random.uniform(0, 2*np.pi)
        amp = roughness * length / np.sqrt(freq)
        env = np.sin(np.pi * t)
        displ += (amp * np.sin(freq * np.pi * t + phase) * env)[:, None] * p1[None, :]
        displ += (amp * np.cos(freq * np.pi * t + phase) * env)[:, None] * p2[None, :]
    return pts + displ + np.random.normal(0, 0.025, (count, 3))

node_up = np.array([-0.35, 0.10, 0.85])
node_mid = np.array([0.40, -0.10, 0.10])
node_low = np.array([-0.25, 0.05, -0.70])

# Branches: 1600 particles total
b1 = make_jagged_branch(node_up, np.array([-0.90, 0.35, 0.40]), 1.35, 400) # Upper-left fork
b2 = make_jagged_branch(node_mid, np.array([0.90, -0.30, 0.40]), 1.35, 400) # Mid-right fork
b3 = make_jagged_branch(node_low, np.array([-0.85, -0.35, -0.40]), 1.25, 400) # Lower-left fork
b4_f = make_jagged_branch(node_up, np.array([0.25, 0.95, -0.15]), 1.1, 200) # 3D forward arc
b4_b = make_jagged_branch(node_mid, np.array([-0.20, -0.95, -0.15]), 1.1, 200) # 3D backward arc

P_E = np.vstack([main_bolt, b1, b2, b3, b4_f, b4_b])
assert len(P_E) == N

# --- Refine State_Fire: Volumetric 3D Flame ---
P_F = P_F_orig.copy()
# Expand Y depth so flame has substantial 3D volume
z_norm_f = (P_F[:, 2] + 1.85) / 3.7
y_depth = 2.4 * (1.0 - 0.25 * z_norm_f)
P_F[:, 1] = P_F_orig[:, 1] * y_depth
# Add subtle 3D swirl to flame tips
swirl = 0.5 * (z_norm_f**1.5)
x_sw = P_F[:, 0] * np.cos(swirl) - P_F[:, 1] * np.sin(swirl)
y_sw = P_F[:, 0] * np.sin(swirl) + P_F[:, 1] * np.cos(swirl)
P_F[:, 0] = x_sw
P_F[:, 1] = y_sw

# --- State_Lock: Solid 3D Padlock ---
P_L = P_L.copy()

# Store updated primary base states into key blocks
for i in range(N):
    kb['State_Electricity'].data[i].co = P_E[i]
    kb['State_Fire'].data[i].co = P_F[i]
print("Updated State_Electricity (3D branching) and State_Fire (3D volumetric).")

# -------------------------------------------------------------
# 2. STEP 1 DIAGNOSTIC RENDERS (Isolated states at rotation = 0)
# -------------------------------------------------------------
step1_dir = "/Users/karthikeya.s/Documents/focus/diagnostic_step1_isolated"
os.makedirs(step1_dir, exist_ok=True)

if sk.animation_data: sk.animation_data_clear()
if p_obj.animation_data: p_obj.animation_data_clear()
p_obj.rotation_euler = (0, 0, 0)

scene.render.resolution_x = 960
scene.render.resolution_y = 540
scene.render.resolution_percentage = 100

for state in ['State_Globe', 'State_Electricity', 'State_Fire', 'State_Lock']:
    for b in kb: b.value = 0.0
    kb[state].value = 1.0
    scene.render.filepath = os.path.join(step1_dir, f"{state}.png")
    bpy.ops.render.render(write_still=True)
    print(f"Rendered isolated {state} to {scene.render.filepath}")

# -------------------------------------------------------------
# 3. INTERMEDIATE SHAPE KEYS CREATION
# -------------------------------------------------------------
# A. Globe -> Electricity
r_G = np.linalg.norm(P_G, axis=1, keepdims=True)
theta_G = np.arctan2(P_G[:, 1:2], P_G[:, 0:1])
phi_G = np.arcsin(np.clip(P_G[:, 2:3] / np.maximum(r_G, 1e-6), -1.0, 1.0))
n_G = P_G / np.maximum(r_G, 1e-6)

# Globe_Pre: Harmonic electromagnetic ripple
delta_r = 0.08 * np.sin(3 * phi_G) * np.cos(2 * theta_G) + 0.04 * np.cos(4 * theta_G)
P_G_pre = (1 - 0.15) * P_G + 0.15 * P_E + delta_r * n_G

# Globe_Energy: Swirling azimuthal expansion
P_base_ge = (1 - 0.45) * P_G + 0.45 * P_E
z_ge = P_base_ge[:, 2]
dth_ge = 0.50 * (1.0 - np.clip((z_ge / 2.2)**2, 0, 1))
boost_ge = 1.0 + 0.22 * np.cos(np.clip(np.pi * z_ge / 4.0, -np.pi/2, np.pi/2))**2
x_ge = boost_ge * (P_base_ge[:, 0] * np.cos(dth_ge) - P_base_ge[:, 1] * np.sin(dth_ge))
y_ge = boost_ge * (P_base_ge[:, 0] * np.sin(dth_ge) + P_base_ge[:, 1] * np.cos(dth_ge))
z_ge = z_ge + 0.08 * np.sin(3 * theta_G[:, 0])
P_G_energy = np.stack([x_ge, y_ge, z_ge], axis=1)

# Globe_To_Electricity: Particles streaming into branching lightning
P_G_to_elec = (1 - 0.80) * P_G + 0.80 * P_E

# B. Electricity -> Fire
P_base_ep = (1 - 0.20) * P_E + 0.20 * P_F
dz_ep = 0.08 * (1.0 + P_base_ep[:, 2] / 2.0)
dx_ep = 0.06 * np.sin(3.5 * P_base_ep[:, 2])
dy_ep = 0.04 * np.cos(2.5 * P_base_ep[:, 2])
P_E_pre = np.stack([P_base_ep[:, 0] + dx_ep, P_base_ep[:, 1] + dy_ep, P_base_ep[:, 2] + dz_ep], axis=1)

# Electricity_Energy: Thermal expansion and buoyant vortex
P_base_ee = (1 - 0.50) * P_E + 0.50 * P_F
factor_ee = 1.0 + 0.20 * np.sin(np.clip(np.pi * (P_base_ee[:, 2] + 1.8) / 3.6, 0, np.pi))
x_ee = P_base_ee[:, 0] * factor_ee + 0.08 * np.sin(2.5 * P_base_ee[:, 2])
y_ee = P_base_ee[:, 1] * factor_ee
z_ee = P_base_ee[:, 2] + 0.12 * (1.0 + P_base_ee[:, 2] / 2.0)
P_E_energy = np.stack([x_ee, y_ee, z_ee], axis=1)

# Electricity_ToFire: Converging into twin flame tongues
P_E_to_fire = (1 - 0.80) * P_E + 0.80 * P_F

# C. Fire -> Lock
P_base_fp = (1 - 0.20) * P_F + 0.20 * P_L
z_damp = P_base_fp[:, 2] - 0.06 * np.maximum(0.0, P_base_fp[:, 2] - 0.8)
P_F_pre = np.stack([P_base_fp[:, 0], P_base_fp[:, 1], z_damp], axis=1)

# Fire_Energy: Crystallization into shackle arch + tumbler body
P_base_fe = (1 - 0.52) * P_F + 0.52 * P_L
is_sh = P_base_fe[:, 2] > 0.1
x_fe = P_base_fe[:, 0].copy()
y_fe = P_base_fe[:, 1].copy()
z_fe = P_base_fe[:, 2].copy()
z_fe[is_sh] += 0.10 * np.cos(np.clip(np.pi * P_base_fe[is_sh, 0] / 2.0, -np.pi/2, np.pi/2))
x_fe[~is_sh] *= 0.96
y_fe[~is_sh] *= 0.96
P_F_energy = np.stack([x_fe, y_fe, z_fe], axis=1)

# Fire_ToLock: Padlock snapping into alignment
P_F_to_lock = (1 - 0.82) * P_F + 0.82 * P_L

intermediates = [
    ('Globe_Pre', P_G_pre),
    ('Globe_Energy', P_G_energy),
    ('Globe_To_Electricity', P_G_to_elec),
    ('Electricity_PreFire', P_E_pre),
    ('Electricity_Energy', P_E_energy),
    ('Electricity_ToFire', P_E_to_fire),
    ('Fire_PreLock', P_F_pre),
    ('Fire_Energy', P_F_energy),
    ('Fire_ToLock', P_F_to_lock),
]

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
    print(f"Configured shape key: {name}")

# -------------------------------------------------------------
# 4. KEYFRAME ANIMATION: EXACT PRODUCTION TIMING (240 FRAMES)
# -------------------------------------------------------------
# 1–32:    GLOBE HOLD
# 33–72:   GLOBE → ELECTRICITY
# 73–100:  ELECTRICITY HOLD
# 101–140: ELECTRICITY → FIRE
# 141–170: FIRE HOLD
# 171–210: FIRE → LOCK
# 211–240: LOCK HOLD

all_anim_keys = [
    'Globe_Pre',
    'Globe_Energy',
    'Globe_To_Electricity',
    'State_Electricity',
    'Electricity_PreFire',
    'Electricity_Energy',
    'Electricity_ToFire',
    'State_Fire',
    'Fire_PreLock',
    'Fire_Energy',
    'Fire_ToLock',
    'State_Lock',
]

if sk.animation_data: sk.animation_data_clear()
sk.animation_data_create()

def hermite(u):
    u = np.clip(u, 0.0, 1.0)
    return 3 * u**2 - 2 * u**3

def evaluate_frame(f):
    k = {key: 0.0 for key in all_anim_keys}
    
    # 1–32: GLOBE HOLD
    if f <= 32:
        return k
    
    # 33–72: GLOBE → ELECTRICITY (40 frames)
    elif f <= 42:
        t = hermite((f - 32) / 10.0)
        k['Globe_Pre'] = t
    elif f <= 52:
        t = hermite((f - 42) / 10.0)
        k['Globe_Pre'] = 1.0 - t
        k['Globe_Energy'] = t
    elif f <= 62:
        t = hermite((f - 52) / 10.0)
        k['Globe_Energy'] = 1.0 - t
        k['Globe_To_Electricity'] = t
    elif f <= 72:
        t = hermite((f - 62) / 10.0)
        k['Globe_To_Electricity'] = 1.0 - t
        k['State_Electricity'] = t
        
    # 73–100: ELECTRICITY HOLD (28 frames)
    elif f <= 100:
        k['State_Electricity'] = 1.0
        
    # 101–140: ELECTRICITY → FIRE (40 frames)
    elif f <= 110:
        t = hermite((f - 100) / 10.0)
        k['State_Electricity'] = 1.0 - t
        k['Electricity_PreFire'] = t
    elif f <= 120:
        t = hermite((f - 110) / 10.0)
        k['Electricity_PreFire'] = 1.0 - t
        k['Electricity_Energy'] = t
    elif f <= 130:
        t = hermite((f - 120) / 10.0)
        k['Electricity_Energy'] = 1.0 - t
        k['Electricity_ToFire'] = t
    elif f <= 140:
        t = hermite((f - 130) / 10.0)
        k['Electricity_ToFire'] = 1.0 - t
        k['State_Fire'] = t
        
    # 141–170: FIRE HOLD (30 frames)
    elif f <= 170:
        k['State_Fire'] = 1.0
        
    # 171–210: FIRE → LOCK (40 frames)
    elif f <= 180:
        t = hermite((f - 170) / 10.0)
        k['State_Fire'] = 1.0 - t
        k['Fire_PreLock'] = t
    elif f <= 190:
        t = hermite((f - 180) / 10.0)
        k['Fire_PreLock'] = 1.0 - t
        k['Fire_Energy'] = t
    elif f <= 200:
        t = hermite((f - 190) / 10.0)
        k['Fire_Energy'] = 1.0 - t
        k['Fire_ToLock'] = t
    elif f <= 210:
        t = hermite((f - 200) / 10.0)
        k['Fire_ToLock'] = 1.0 - t
        k['State_Lock'] = t
        
    # 211–240: LOCK HOLD (30 frames)
    else:
        k['State_Lock'] = 1.0
        
    return k

print("Inserting shape key animation keyframes across 240 frames...")
for f in range(1, 241):
    vals = evaluate_frame(f)
    for key_name in all_anim_keys:
        kb[key_name].value = vals[key_name]
        kb[key_name].keyframe_insert(data_path="value", frame=f)

# -------------------------------------------------------------
# 5. CONTINUOUS LINEAR Z ROTATION (0° → 360°)
# -------------------------------------------------------------
if p_obj.animation_data: p_obj.animation_data_clear()
p_obj.animation_data_create()

p_obj.rotation_euler = (0, 0, 0)
p_obj.keyframe_insert(data_path="rotation_euler", index=2, frame=1)
p_obj.rotation_euler.z = 2.0 * np.pi
p_obj.keyframe_insert(data_path="rotation_euler", index=2, frame=240)

# Set interpolation to linear
def set_linear_rotation(action):
    if not action: return
    fcurves = []
    if hasattr(action, 'fcurves'): fcurves.extend(action.fcurves)
    if hasattr(action, 'layers'):
        for layer in action.layers:
            for strip in layer.strips:
                for cb in strip.channelbags: fcurves.extend(cb.fcurves)
    for fc in fcurves:
        if fc.data_path == "rotation_euler" and fc.array_index == 2:
            for pt in fc.keyframe_points:
                pt.interpolation = 'LINEAR'

set_linear_rotation(p_obj.animation_data.action)
print("Configured continuous linear rotation 0° -> 360°.")

# Configure scene
scene.frame_start = 1
scene.frame_end = 240
scene.render.fps = 24
scene.render.fps_base = 1.0

# Save blend file
bpy.ops.wm.save_mainfile(filepath=blend_path)
print(f"Saved master file: {blend_path}")

# -------------------------------------------------------------
# 6. RENDER THE 13 REQUIRED TEST DIAGNOSTIC FRAMES
# -------------------------------------------------------------
# Required frames: 1, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240
diag_frames = [1, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240]
diag_dir = "/Users/karthikeya.s/Documents/focus/diagnostic_test_13"
os.makedirs(diag_dir, exist_ok=True)

scene.render.resolution_x = 960
scene.render.resolution_y = 540

print("Rendering 13 diagnostic frames...")
for f in diag_frames:
    scene.frame_set(f)
    scene.render.filepath = os.path.join(diag_dir, f"frame_{f:03d}.png")
    bpy.ops.render.render(write_still=True)
    print(f"Rendered diagnostic frame {f} to {scene.render.filepath}")

print("All 13 diagnostic frames rendered successfully!")
