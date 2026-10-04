import bpy
import numpy as np

print("=== CALCULATING 12 EXPLICIT INTERMEDIATE STATES WITH PHYSICS DEFORMATION ===")

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
    
    # Per-particle angles
    r_base = np.linalg.norm(P_base, axis=1, keepdims=True)
    r_base_safe = np.maximum(r_base, 1e-4)
    u_rad = P_base / r_base_safe
    
    th_base = np.arctan2(P_base[:, 1], P_base[:, 0])
    phi_base = np.arcsin(np.clip(P_base[:, 2] / r_base_safe[:, 0], -1.0, 1.0))
    u_norm = (P_base[:, 2] + 2.0) / 4.0
    u_norm = np.clip(u_norm, 0.0, 1.0)
    
    indices = np.arange(N)
    
    if trans_type == 'globe_to_elec':
        # 1. Radial expansion (+25% to +35% swell)
        m_burst = 0.58 * (1.0 + 0.28 * np.cos(3 * th_base)) * (np.cos(phi_base) ** 1.5)
        d_radial = u_rad * m_burst[:, np.newaxis]
        
        # 2. Tangential orbital swirl around Z
        u_tang = np.stack([-np.sin(th_base), np.cos(th_base), np.zeros(N)], axis=1)
        m_swirl = 0.85 * np.sign(phi_base + 1e-4) * np.cos(phi_base)
        d_swirl = u_tang * m_swirl[:, np.newaxis]
        
        # 3. Wave stretching along electric harmonics
        dx_wave = 0.42 * np.cos(4 * th_base + np.pi * tau) * np.cos(th_base)
        dy_wave = 0.42 * np.cos(4 * th_base + np.pi * tau) * np.sin(th_base)
        dz_wave = 0.38 * np.sin(3 * th_base + 2 * phi_base)
        d_wave = np.stack([dx_wave, dy_wave, dz_wave], axis=1)
        
        # 4. Coherent harmonic turbulence
        psi = 4 * th_base + 3 * phi_base + (indices % 29) * (2 * np.pi / 29)
        d_turb = 0.16 * np.stack([
            np.cos(psi + 2 * np.pi * tau),
            np.sin(psi + 2 * np.pi * tau),
            0.5 * np.cos(2 * psi)
        ], axis=1)
        
        deform = env * (d_radial + d_swirl + d_wave + d_turb)
        return P_base + deform
        
    elif trans_type == 'elec_to_fire':
        # 1. Upward buoyant laminar surge
        dz_surge = 0.95 * (1.25 - 0.65 * u_norm) * (1.0 + 0.25 * np.cos(3 * th_base))
        d_surge = np.zeros((N, 3))
        d_surge[:, 2] = dz_surge
        
        # 2. Vortex swirl plume
        th_vortex = th_base + 1.8 * u_norm
        u_vortex = np.stack([-np.sin(th_vortex), np.cos(th_vortex), np.zeros(N)], axis=1)
        m_vortex = 0.68 * (1.1 - 0.5 * u_norm)
        d_vortex = u_vortex * m_vortex[:, np.newaxis]
        
        # 3. Radial flaring / dispersion (+24% swell at mid-height)
        m_flare = 0.48 * np.sin(np.pi * u_norm) * (1.0 + 0.25 * np.cos(4 * th_base))
        u_xy = np.stack([np.cos(th_base), np.sin(th_base), np.zeros(N)], axis=1)
        d_flare = u_xy * m_flare[:, np.newaxis]
        
        # 4. Flickering flame crests
        psi2 = 3 * th_base + 4 * u_norm + (indices % 31) * (2 * np.pi / 31)
        d_flicker = 0.22 * np.stack([
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
        # Top particles sweep inward and loop across apex
        u_s = np.clip((phi_g[is_shackle] - 0.22) / (np.pi / 2 - 0.22), 0.0, 1.0)
        curl_x = -0.52 * np.sin(np.pi * u_s) * np.sign(P_base[is_shackle, 0])
        curl_z = 0.48 * np.sin(np.pi * u_s) * (1.0 - np.abs(P_base[is_shackle, 0]) / 1.5)
        d_curl = np.stack([curl_x, np.zeros_like(curl_x), curl_z], axis=1)
        
        pinch_x = -0.25 * np.cos(th_base[is_shackle])
        d_pinch = np.stack([pinch_x, np.zeros_like(pinch_x), np.zeros_like(pinch_x)], axis=1)
        
        psi_s = 5 * th_base[is_shackle] + (indices[is_shackle] % 37) * (2 * np.pi / 37)
        d_snap_s = 0.12 * np.stack([np.sin(psi_s), np.cos(psi_s), 0.1 * np.cos(2 * psi_s)], axis=1)
        
        deform[is_shackle] = env * (d_curl + d_pinch + d_snap_s)
        
        # Base particles: tumbler consolidation into rectangular corners
        th_b = th_base[is_base]
        corn_x = 0.38 * np.sign(np.cos(th_b)) * (np.abs(np.cos(th_b)) ** 2)
        corn_y = 0.32 * np.sign(np.sin(th_b)) * (np.abs(np.sin(th_b)) ** 2)
        corn_z = -0.15 * np.ones_like(corn_x)
        d_corner = np.stack([corn_x, corn_y, corn_z], axis=1)
        
        psi_b = 5 * th_b + (indices[is_base] % 37) * (2 * np.pi / 37)
        d_snap_b = 0.12 * np.stack([np.sin(psi_b), np.cos(psi_b), 0.1 * np.cos(2 * psi_b)], axis=1)
        
        deform[is_base] = env * (d_corner + d_snap_b)
        return P_base + deform

print("\n--- COMPUTING 13 STATES ---")

# 1. Globe Hold
coords_globe = globe.copy()

# Transition 1: Globe -> Electricity
coords_g_pre = compute_deformed_state(globe, elec, 'globe_to_elec', 0.25)
coords_g_energy = compute_deformed_state(globe, elec, 'globe_to_elec', 0.50)
coords_g_mid = compute_deformed_state(globe, elec, 'globe_to_elec', 0.75)
coords_elec = elec.copy()

# Transition 2: Electricity -> Fire
coords_e_pre = compute_deformed_state(elec, fire, 'elec_to_fire', 0.25)
coords_e_energy = compute_deformed_state(elec, fire, 'elec_to_fire', 0.50)
coords_e_mid = compute_deformed_state(elec, fire, 'elec_to_fire', 0.75)
coords_fire = fire.copy()

# Transition 3: Fire -> Lock
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

for name, arr in states:
    r = np.linalg.norm(arr, axis=1)
    print(f"{name:30s}: span X={np.ptp(arr[:,0]):.2f}, Y={np.ptp(arr[:,1]):.2f}, Z={np.ptp(arr[:,2]):.2f}, mean R={r.mean():.2f}, max R={r.max():.2f}")

# Helper function to create or update shape key
def set_shape_key(name, coords):
    if name not in kb:
        kb_new = obj.shape_key_add(name=name, from_mix=False)
    else:
        kb_new = kb[name]
    for i in range(N):
        kb_new.data[i].co = coords[i]
    print(f"Shape key '{name}' updated.")

# Update all keys in blend file
for name, arr in states:
    set_shape_key(name, arr)

# Also ensure legacy names match if needed
set_shape_key("State_Electricity", coords_elec)
set_shape_key("State_Fire", coords_fire)
set_shape_key("State_Lock", coords_lock)

bpy.ops.wm.save_mainfile(filepath=blend_file)
print(f"=== SUCCESSFULLY SAVED ALL 12 INTERMEDIATE STATES TO {blend_file} ===")
