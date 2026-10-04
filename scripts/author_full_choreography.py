import bpy
import numpy as np
import math

print("=== AUTHORING CONTINUOUS PARTICLE CHOREOGRAPHY WITH 12 INTERMEDIATE STATES ===")

blend_file = "/Users/karthikeya.s/Documents/focus/hero_particle_animation.blend"
bpy.ops.wm.open_mainfile(filepath=blend_file)

obj = bpy.data.objects['Hero_Particle_System']
mesh = obj.data
sk = mesh.shape_keys
kb = sk.key_blocks

globe = np.array([v.co for v in kb['State_Globe'].data])
elec = np.array([v.co for v in kb['State_Electricity'].data])
fire = np.array([v.co for v in kb['State_Fire'].data])
lock = np.array([v.co for v in kb['State_Lock'].data])
N = len(globe)
assert N == 3200

# Spherical coords of Globe for reference
r_g = np.linalg.norm(globe, axis=1)
th_g = np.arctan2(globe[:, 1], globe[:, 0])
phi_g = np.arcsin(np.clip(globe[:, 2] / np.maximum(r_g, 1e-6), -1.0, 1.0))

def compute_deformed_state(A, B, trans_type, tau):
    """
    Computes P_i(tau) = (1 - w(tau)) * A_i + w(tau) * B_i + deformation(tau, i)
    tau in [0, 1]
    """
    if tau <= 0.0:
        return A.copy()
    if tau >= 1.0:
        return B.copy()
    
    # Smoothstep interpolation
    w = 3.0 * (tau ** 2) - 2.0 * (tau ** 3)
    P_base = (1.0 - w) * A + w * B
    
    # Envelope is 0 at tau=0 and tau=1, peaking at tau=0.5
    env = np.sin(np.pi * tau)
    
    # Per-particle coordinate metrics
    r_base = np.linalg.norm(P_base, axis=1, keepdims=True)
    r_base_safe = np.maximum(r_base, 1e-4)
    u_rad = P_base / r_base_safe
    
    th_base = np.arctan2(P_base[:, 1], P_base[:, 0])
    phi_base = np.arcsin(np.clip(P_base[:, 2] / r_base_safe[:, 0], -1.0, 1.0))
    u_norm = (P_base[:, 2] + 2.0) / 4.0
    u_norm = np.clip(u_norm, 0.0, 1.0)
    
    indices = np.arange(N)
    
    if trans_type == 'globe_to_elec':
        # 1. Radial expansion (+28% to +36% swell)
        m_burst = 0.62 * (1.0 + 0.30 * np.cos(3 * th_base)) * (np.cos(phi_base) ** 1.4)
        d_radial = u_rad * m_burst[:, np.newaxis]
        
        # 2. Tangential orbital swirl around Z
        u_tang = np.stack([-np.sin(th_base), np.cos(th_base), np.zeros(N)], axis=1)
        m_swirl = 0.95 * np.sign(phi_base + 1e-4) * np.cos(phi_base)
        d_swirl = u_tang * m_swirl[:, np.newaxis]
        
        # 3. Wave stretching along electric field lobes
        dx_wave = 0.45 * np.cos(4 * th_base + np.pi * tau) * np.cos(th_base)
        dy_wave = 0.45 * np.cos(4 * th_base + np.pi * tau) * np.sin(th_base)
        dz_wave = 0.40 * np.sin(3 * th_base + 2 * phi_base)
        d_wave = np.stack([dx_wave, dy_wave, dz_wave], axis=1)
        
        # 4. Coherent harmonic turbulence
        psi = 4 * th_base + 3 * phi_base + (indices % 29) * (2 * np.pi / 29)
        d_turb = 0.18 * np.stack([
            np.cos(psi + 2 * np.pi * tau),
            np.sin(psi + 2 * np.pi * tau),
            0.5 * np.cos(2 * psi)
        ], axis=1)
        
        deform = env * (d_radial + d_swirl + d_wave + d_turb)
        return P_base + deform
        
    elif trans_type == 'elec_to_fire':
        # 1. Upward buoyant laminar surge
        dz_surge = 1.15 * (1.30 - 0.70 * u_norm) * (1.0 + 0.28 * np.cos(3 * th_base))
        d_surge = np.zeros((N, 3))
        d_surge[:, 2] = dz_surge
        
        # 2. Vortex swirl plume
        th_vortex = th_base + 1.9 * u_norm
        u_vortex = np.stack([-np.sin(th_vortex), np.cos(th_vortex), np.zeros(N)], axis=1)
        m_vortex = 0.75 * (1.1 - 0.5 * u_norm)
        d_vortex = u_vortex * m_vortex[:, np.newaxis]
        
        # 3. Radial flaring / dispersion (+26% swell at mid-height)
        m_flare = 0.52 * np.sin(np.pi * u_norm) * (1.0 + 0.25 * np.cos(4 * th_base))
        u_xy = np.stack([np.cos(th_base), np.sin(th_base), np.zeros(N)], axis=1)
        d_flare = u_xy * m_flare[:, np.newaxis]
        
        # 4. Flickering flame crests
        psi2 = 3 * th_base + 4 * u_norm + (indices % 31) * (2 * np.pi / 31)
        d_flicker = 0.24 * np.stack([
            np.cos(psi2),
            np.sin(psi2),
            0.6 * np.sin(2 * psi2 + np.pi * tau)
        ], axis=1)
        
        deform = env * (d_surge + d_vortex + d_flare + d_flicker)
        return P_base + deform
        
    elif trans_type == 'fire_to_lock':
        # Split into shackle and base
        is_shackle = (phi_g >= 0.22)
        is_base = ~is_shackle
        
        deform = np.zeros((N, 3))
        
        # Shackle particles: arch curling motion
        u_s = np.clip((phi_g[is_shackle] - 0.22) / (np.pi / 2 - 0.22), 0.0, 1.0)
        curl_x = -0.55 * np.sin(np.pi * u_s) * np.sign(P_base[is_shackle, 0])
        curl_z = 0.50 * np.sin(np.pi * u_s) * (1.0 - np.abs(P_base[is_shackle, 0]) / 1.5)
        d_curl = np.stack([curl_x, np.zeros_like(curl_x), curl_z], axis=1)
        
        pinch_x = -0.28 * np.cos(th_base[is_shackle])
        d_pinch = np.stack([pinch_x, np.zeros_like(pinch_x), np.zeros_like(pinch_x)], axis=1)
        
        psi_s = 5 * th_base[is_shackle] + (indices[is_shackle] % 37) * (2 * np.pi / 37)
        d_snap_s = 0.14 * np.stack([np.sin(psi_s), np.cos(psi_s), 0.1 * np.cos(2 * psi_s)], axis=1)
        
        deform[is_shackle] = env * (d_curl + d_pinch + d_snap_s)
        
        # Base particles: tumbler consolidation into rectangular corners
        th_b = th_base[is_base]
        corn_x = 0.42 * np.sign(np.cos(th_b)) * (np.abs(np.cos(th_b)) ** 2)
        corn_y = 0.35 * np.sign(np.sin(th_b)) * (np.abs(np.sin(th_b)) ** 2)
        corn_z = -0.16 * np.ones_like(corn_x)
        d_corner = np.stack([corn_x, corn_y, corn_z], axis=1)
        
        psi_b = 5 * th_b + (indices[is_base] % 37) * (2 * np.pi / 37)
        d_snap_b = 0.14 * np.stack([np.sin(psi_b), np.cos(psi_b), 0.1 * np.cos(2 * psi_b)], axis=1)
        
        deform[is_base] = env * (d_corner + d_snap_b)
        return P_base + deform

print("\n--- UPDATING SHAPE KEYS ---")
coords_globe = globe.copy()
coords_g_pre = compute_deformed_state(globe, elec, 'globe_to_elec', 0.25)
coords_g_energy = compute_deformed_state(globe, elec, 'globe_to_elec', 0.50)
coords_g_mid = compute_deformed_state(globe, elec, 'globe_to_elec', 0.75)
coords_elec = elec.copy()

coords_e_pre = compute_deformed_state(elec, fire, 'elec_to_fire', 0.25)
coords_e_energy = compute_deformed_state(elec, fire, 'elec_to_fire', 0.50)
coords_e_mid = compute_deformed_state(elec, fire, 'elec_to_fire', 0.75)
coords_fire = fire.copy()

coords_f_pre = compute_deformed_state(fire, lock, 'fire_to_lock', 0.25)
coords_f_energy = compute_deformed_state(fire, lock, 'fire_to_lock', 0.50)
coords_f_mid = compute_deformed_state(fire, lock, 'fire_to_lock', 0.75)
coords_lock = lock.copy()

states = [
    ("State_Globe", coords_globe),
    ("Transition_Globe_Pre", coords_g_pre),
    ("Transition_Globe_Energy", coords_g_energy),
    ("Transition_Globe_Mid", coords_g_mid),
    ("Transition_Electricity_Resolve", coords_elec),
    ("Transition_Electricity_Pre", coords_e_pre),
    ("Transition_Electricity_Energy", coords_e_energy),
    ("Transition_Electricity_Mid", coords_e_mid),
    ("Transition_Fire_Resolve", coords_fire),
    ("Transition_Fire_Pre", coords_f_pre),
    ("Transition_Fire_Energy", coords_f_energy),
    ("Transition_Fire_Mid", coords_f_mid),
    ("Transition_Lock_Resolve", coords_lock),
]

def set_shape_key(name, coords):
    if name not in kb:
        kb_new = obj.shape_key_add(name=name, from_mix=False)
    else:
        kb_new = kb[name]
    for i in range(N):
        kb_new.data[i].co = coords[i]

for name, arr in states:
    set_shape_key(name, arr)

set_shape_key("State_Electricity", coords_elec)
set_shape_key("State_Fire", coords_fire)
set_shape_key("State_Lock", coords_lock)

# =========================================================================
# KEYFRAME FULL 240-FRAME CONTINUOUS CHOREOGRAPHY
# =========================================================================

# 1. Clear previous animation data
if obj.animation_data:
    obj.animation_data_clear()
obj.animation_data_create()

if sk.animation_data:
    sk.animation_data_clear()
sk.animation_data_create()

# 2. CONTINUOUS Z ROTATION: perfectly linear, never stops
obj.rotation_euler.z = 0.0
obj.keyframe_insert(data_path="rotation_euler", index=2, frame=1)
obj.rotation_euler.z = 2 * math.pi
obj.keyframe_insert(data_path="rotation_euler", index=2, frame=240)

def get_action_fcurves(action):
    fcurves = []
    if not action:
        return fcurves
    if hasattr(action, 'fcurves'):
        return list(action.fcurves)
    if hasattr(action, 'layers'):
        for layer in action.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    for fc in cb.fcurves:
                        fcurves.append(fc)
    return fcurves

# Make rotation linear
for fc in get_action_fcurves(obj.animation_data.action):
    if fc.data_path == "rotation_euler" and fc.array_index == 2:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'
print("Configured continuous linear Z-rotation across 240 frames.")

# 3. SCALE: subtle breathing, mostly stable
scale_tracks = [
    (1, 1.000),
    (69, 1.000),
    (83, 1.040),
    (96, 1.005),
    (108, 1.000),
    (116, 1.035),
    (124, 1.000),
    (135, 1.000),
    (144, 0.975),
    (152, 1.000),
    (194, 1.000),
    (240, 0.940),
]
for f, s in scale_tracks:
    obj.scale = (s, s, s)
    obj.keyframe_insert(data_path="scale", frame=f)

# 4. SHAPE KEY TRACKS (Sum of active keys == 1.0 at every frame)
def set_key_track(key_name, frames_values):
    if key_name not in kb:
        return
    block = kb[key_name]
    for f, val in frames_values:
        block.value = val
        block.keyframe_insert(data_path="value", frame=f)

# Initialize all shape keys to 0 at frame 1
for block in kb:
    if block.name != 'State_Globe':
        block.value = 0.0
        block.keyframe_insert(data_path="value", frame=1)

# Transition 1: Globe -> Electricity (f69 to f96)
# f69: Globe Hold end (all keys 0 -> Basis is 100%)
# f76: Transition_Globe_Pre is 1.0
# f83: Transition_Globe_Energy is 1.0
# f90: Transition_Globe_Mid is 1.0
# f96: Transition_Electricity_Resolve is 1.0
set_key_track("Transition_Globe_Pre", [
    (1, 0.0), (69, 0.0), (76, 1.0), (83, 0.0), (240, 0.0)
])
set_key_track("Transition_Globe_Energy", [
    (1, 0.0), (76, 0.0), (83, 1.0), (90, 0.0), (240, 0.0)
])
set_key_track("Transition_Globe_Mid", [
    (1, 0.0), (83, 0.0), (90, 1.0), (96, 0.0), (240, 0.0)
])
set_key_track("Transition_Electricity_Resolve", [
    (1, 0.0), (90, 0.0), (96, 1.0), (108, 1.0), (112, 0.0), (240, 0.0)
])

# Transition 2: Electricity -> Fire (f108 to f124)
# f108: Electricity Hold end
# f112: Transition_Electricity_Pre is 1.0
# f116: Transition_Electricity_Energy is 1.0
# f120: Transition_Electricity_Mid is 1.0
# f124: Transition_Fire_Resolve is 1.0
set_key_track("Transition_Electricity_Pre", [
    (1, 0.0), (108, 0.0), (112, 1.0), (116, 0.0), (240, 0.0)
])
set_key_track("Transition_Electricity_Energy", [
    (1, 0.0), (112, 0.0), (116, 1.0), (120, 0.0), (240, 0.0)
])
set_key_track("Transition_Electricity_Mid", [
    (1, 0.0), (116, 0.0), (120, 1.0), (124, 0.0), (240, 0.0)
])
set_key_track("Transition_Fire_Resolve", [
    (1, 0.0), (120, 0.0), (124, 1.0), (135, 1.0), (139, 0.0), (240, 0.0)
])

# Transition 3: Fire -> Lock (f135 to f152)
# f135: Fire Hold end
# f139: Transition_Fire_Pre is 1.0
# f144: Transition_Fire_Energy is 1.0
# f148: Transition_Fire_Mid is 1.0
# f152: Transition_Lock_Resolve is 1.0
set_key_track("Transition_Fire_Pre", [
    (1, 0.0), (135, 0.0), (139, 1.0), (144, 0.0), (240, 0.0)
])
set_key_track("Transition_Fire_Energy", [
    (1, 0.0), (139, 0.0), (144, 1.0), (148, 0.0), (240, 0.0)
])
set_key_track("Transition_Fire_Mid", [
    (1, 0.0), (144, 0.0), (148, 1.0), (152, 0.0), (240, 0.0)
])
set_key_track("Transition_Lock_Resolve", [
    (1, 0.0), (148, 0.0), (152, 1.0), (240, 1.0)
])

# Set shape key F-curves to linear between adjacent handoffs
if sk.animation_data and sk.animation_data.action:
    for fc in get_action_fcurves(sk.animation_data.action):
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'
print("Choreographed shape key tracks with exact sum-to-1 linear handoffs.")

# 5. CORE LIGHT BLOOM RESPONSE
core_light = bpy.data.objects.get('Core_Light')
if core_light and core_light.data:
    ld = core_light.data
    if ld.animation_data:
        ld.animation_data_clear()
    ld.animation_data_create()
    light_keys = [
        (1, 65.0),
        (69, 65.0),
        (83, 95.0),
        (96, 68.0),
        (108, 65.0),
        (116, 120.0),
        (124, 70.0),
        (135, 65.0),
        (144, 88.0),
        (152, 68.0),
        (194, 65.0),
        (240, 65.0),
    ]
    for f, val in light_keys:
        ld.energy = val
        ld.keyframe_insert(data_path="energy", frame=f)
print("Configured Core_Light energy bloom.")

# 6. FLOATING GROUND SHADOW
shadow = bpy.data.objects.get('Floating_Ground_Shadow')
if shadow:
    if shadow.animation_data:
        shadow.animation_data_clear()
    shadow.animation_data_create()
    shadow_keys = [
        (1, 1.00),
        (69, 1.00),
        (83, 1.06),
        (96, 1.02),
        (108, 1.00),
        (116, 0.96),
        (124, 0.99),
        (135, 1.00),
        (144, 1.04),
        (152, 1.01),
        (194, 1.00),
        (240, 0.95),
    ]
    for f, s in shadow_keys:
        shadow.scale = (s, s, 1.0)
        shadow.keyframe_insert(data_path="scale", frame=f)
print("Configured Floating_Ground_Shadow scale.")

# Ensure transparent film and 240 frames
scene = bpy.context.scene
scene.render.film_transparent = True
scene.frame_start = 1
scene.frame_end = 240

bpy.ops.wm.save_mainfile(filepath=blend_file)
print(f"=== FULL MASTER CHOREOGRAPHY SAVED TO: {blend_file} ===")
