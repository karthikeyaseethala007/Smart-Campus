import bpy
import numpy as np

print("=== GENERATING 12 EXPLICIT INTERMEDIATE DEFORMATION STATES ===")

blend_file = "/Users/karthikeya.s/Documents/focus/hero_particle_animation.blend"
bpy.ops.wm.open_mainfile(filepath=blend_file)

obj = bpy.data.objects['Hero_Particle_System']
mesh = obj.data
sk = mesh.shape_keys
kb = sk.key_blocks

globe = np.array([v.co for v in kb['State_Globe'].data])
N = len(globe)
assert N == 3200, f"Expected 3200 vertices, got {N}"

r = np.linalg.norm(globe, axis=1)
theta = np.arctan2(globe[:, 1], globe[:, 0])
phi = np.arcsin(np.clip(globe[:, 2] / np.maximum(r, 1e-6), -1.0, 1.0))

# -------------------------------------------------------------
# TRANSITION 1: GLOBE -> ELECTRICITY
# -------------------------------------------------------------

# 1. State_Globe (Basis) - already exists

# 2. Trans_Globe_Pre: Equatorial tangential acceleration & wave perturbation
th_pre = theta + 0.45 * np.cos(2 * phi)
dr_pre = 0.25 * np.cos(3 * theta) * np.cos(2 * phi) + 0.10 * np.sin(5 * theta)
r_pre = r + dr_pre
x_pre = r_pre * np.cos(phi) * np.cos(th_pre)
y_pre = r_pre * np.cos(phi) * np.sin(th_pre)
z_pre = globe[:, 2] * 0.95 + 0.20 * np.sin(3 * theta) * np.cos(phi)
coords_g_pre = np.stack([x_pre, y_pre, z_pre], axis=1)

# 3. Trans_Globe_Energy: Radial swell (+25%) & orbital particle stream
r_energy = r * (1.18 + 0.18 * np.abs(np.cos(3 * theta)))
th_energy = theta + 0.9 * np.sign(phi + 1e-6) * (1.0 - np.abs(np.sin(phi)) * 0.5)
z_energy = 1.65 * np.sin(phi) + 0.35 * np.sin(4 * theta + 2 * phi)
x_energy = r_energy * np.cos(th_energy) * np.cos(phi * 0.7)
y_energy = r_energy * np.sin(th_energy) * np.cos(phi * 0.7)
coords_g_energy = np.stack([x_energy, y_energy, z_energy], axis=1)

# 4. Trans_Globe_Mid: Harmonic field loops emerging from cloud
r_xy_mid1 = 1.55 + 0.38 * np.cos(4 * theta) + 0.14 * np.sin(6 * theta)
psi_mid1 = theta + 0.35 * np.sin(2 * phi)
z_mid1 = 1.70 * np.sin(phi) + 0.24 * np.sin(3 * theta + 2 * phi)
coords_g_mid = np.stack([r_xy_mid1 * np.cos(psi_mid1), r_xy_mid1 * np.sin(psi_mid1), z_mid1], axis=1)

# 5. State_Electricity (Resolved Electricity)
z_elec = 1.75 * np.sin(phi) + 0.18 * np.sin(3 * theta + 2 * phi)
r_xy_elec = 1.35 + 0.45 * np.cos(4 * theta) * np.cos(2 * phi) + 0.15 * np.sin(6 * theta)
psi_elec = theta + 0.30 * np.sin(2 * phi)
coords_elec = np.stack([r_xy_elec * np.cos(psi_elec), r_xy_elec * np.sin(psi_elec), z_elec], axis=1)

# -------------------------------------------------------------
# TRANSITION 2: ELECTRICITY -> FIRE
# -------------------------------------------------------------

# 6. Trans_Elec_Pre: Horizontal wave rings decouple & tilt vertically
u_norm = (phi + np.pi/2) / np.pi
z_e_pre = z_elec + 0.40 * (1.0 + np.sin(phi)) * (0.8 + 0.4 * np.sin(3 * theta))
r_xy_e_pre = r_xy_elec * (1.08 - 0.22 * u_norm)
psi_e_pre = psi_elec + 0.35 * u_norm
coords_e_pre = np.stack([r_xy_e_pre * np.cos(psi_e_pre), r_xy_e_pre * np.sin(psi_e_pre), z_e_pre], axis=1)

# 7. Trans_Elec_Energy: Upward laminar surge & turbulent plume expansion (+22%)
z_e_energy = -1.8 + 3.85 * (u_norm**0.75) + 0.32 * np.sin(3 * theta + 2 * u_norm)
r_xy_e_energy = (1.50 * (1.10 - 0.65 * u_norm) + 0.35 * np.sin(3 * theta + 4 * u_norm)) * (0.88 + 0.15 * np.cos(5 * theta))
psi_e_energy = theta + 1.25 * u_norm + 0.20 * np.sin(4 * theta)
coords_e_energy = np.stack([r_xy_e_energy * np.cos(psi_e_energy), r_xy_e_energy * np.sin(psi_e_energy), z_e_energy], axis=1)

# 8. Trans_Elec_Mid: Teardrop flame body with flickering crests
z_e_mid = -1.8 + 3.70 * (u_norm**0.82) + 0.20 * np.cos(3 * theta)
r_xy_e_mid = (1.40 * (1.05 - 0.65 * u_norm) + 0.28 * np.sin(3 * theta + 3 * u_norm)) * (0.90 + 0.12 * np.cos(5 * theta))
psi_e_mid = theta + 0.95 * u_norm
coords_e_mid = np.stack([r_xy_e_mid * np.cos(psi_e_mid), r_xy_e_mid * np.sin(psi_e_mid), z_e_mid], axis=1)

# 9. State_Fire (Resolved Fire Column)
z_fire = -1.8 + 3.65 * (u_norm**0.85) + 0.12 * np.cos(3 * theta)
r_xy_fire = (1.35 * (1.05 - 0.65 * u_norm) + 0.28 * np.sin(3 * theta + 4 * u_norm)) * (0.88 + 0.12 * np.cos(5 * theta))
psi_fire = theta + 0.80 * u_norm
coords_fire = np.stack([r_xy_fire * np.cos(psi_fire), r_xy_fire * np.sin(psi_fire), z_fire], axis=1)

# -------------------------------------------------------------
# TRANSITION 3: FIRE -> LOCK
# -------------------------------------------------------------
is_base = phi < 0.22
is_shackle = ~is_base

# 10. Trans_Fire_Pre: Flame tips curl inward into loop; base consolidates
coords_f_pre = np.zeros_like(globe)
# Base
u_b = (phi[is_base] + np.pi/2) / (0.22 + np.pi/2)
th_b = theta[is_base]
rf_b = 0.85 + 0.15 * (r[is_base] / 2.0)
xb_pre = 1.35 * np.sign(np.cos(th_b)) * (np.abs(np.cos(th_b))**0.68) * rf_b
yb_pre = 1.20 * np.sign(np.sin(th_b)) * (np.abs(np.sin(th_b))**0.68) * rf_b
zb_pre = -1.8 + 1.85 * (u_b**0.90) + 0.15 * np.cos(3 * th_b)
coords_f_pre[is_base] = np.stack([xb_pre, yb_pre, zb_pre], axis=1)
# Shackle
u_s = (phi[is_shackle] - 0.22) / (np.pi/2 - 0.22)
alpha_s = u_s * np.pi
xc_s = -0.82 * np.cos(alpha_s)
zc_s = 0.10 + 1.05 * np.sin(alpha_s)
beta_s = theta[is_shackle]
rt_s = 0.38 * (0.85 + 0.15 * (r[is_shackle] - 1.8) / 0.2) + 0.08 * np.sin(3 * beta_s)
xs_pre = xc_s - rt_s * np.cos(beta_s) * np.cos(alpha_s)
ys_pre = rt_s * np.sin(beta_s)
zs_pre = zc_s + rt_s * np.cos(beta_s) * np.sin(alpha_s)
coords_f_pre[is_shackle] = np.stack([xs_pre, ys_pre, zs_pre], axis=1)

# 11. Trans_Fire_Energy: Arch loop closing & tumbler cylinder dense consolidation
coords_f_energy = np.zeros_like(globe)
# Base
xb_en = 1.32 * np.sign(np.cos(th_b)) * (np.abs(np.cos(th_b))**0.66) * rf_b
yb_en = 1.18 * np.sign(np.sin(th_b)) * (np.abs(np.sin(th_b))**0.66) * rf_b
zb_en = -1.8 + 1.85 * u_b
coords_f_energy[is_base] = np.stack([xb_en, yb_en, zb_en], axis=1)
# Shackle
rt_en = 0.30 * (0.85 + 0.15 * (r[is_shackle] - 1.8) / 0.2)
zc_en = 0.12 + 0.98 * np.sin(alpha_s)
xs_en = xc_s - rt_en * np.cos(beta_s) * np.cos(alpha_s)
ys_en = rt_en * np.sin(beta_s)
zs_en = zc_en + rt_en * np.cos(beta_s) * np.sin(alpha_s)
coords_f_energy[is_shackle] = np.stack([xs_en, ys_en, zs_en], axis=1)

# 12. Trans_Fire_Mid: Structural lock formation
coords_f_mid = np.zeros_like(globe)
# Base
xb_mid = 1.30 * np.sign(np.cos(th_b)) * (np.abs(np.cos(th_b))**0.65) * rf_b
yb_mid = 1.15 * np.sign(np.sin(th_b)) * (np.abs(np.sin(th_b))**0.65) * rf_b
zb_mid = -1.8 + 1.85 * u_b
coords_f_mid[is_base] = np.stack([xb_mid, yb_mid, zb_mid], axis=1)
# Shackle
rt_mid = 0.27 * (0.85 + 0.15 * (r[is_shackle] - 1.8) / 0.2)
zc_mid = 0.12 + 0.95 * np.sin(alpha_s)
xs_mid = xc_s - rt_mid * np.cos(beta_s) * np.cos(alpha_s)
ys_mid = rt_mid * np.sin(beta_s)
zs_mid = zc_mid + rt_mid * np.cos(beta_s) * np.sin(alpha_s)
coords_f_mid[is_shackle] = np.stack([xs_mid, ys_mid, zs_mid], axis=1)

# 13. State_Lock (Resolved Lock)
coords_lock = coords_f_mid.copy()
rt_lock = 0.25 * (0.85 + 0.15 * (r[is_shackle] - 1.8) / 0.2)
coords_lock[is_shackle, 0] = xc_s - rt_lock * np.cos(beta_s) * np.cos(alpha_s)
coords_lock[is_shackle, 1] = rt_lock * np.sin(beta_s)
coords_lock[is_shackle, 2] = zc_mid + rt_lock * np.cos(beta_s) * np.sin(alpha_s)

# Helper function to create or update shape key
def set_shape_key(name, coords):
    if name not in kb:
        kb_new = obj.shape_key_add(name=name, from_mix=False)
    else:
        kb_new = kb[name]
    for i in range(N):
        kb_new.data[i].co = coords[i]
    print(f"Shape key '{name}' updated ({N} vertices).")

# Update all keys
set_shape_key("State_Globe", globe)
set_shape_key("Trans_Globe_Pre", coords_g_pre)
set_shape_key("Trans_Globe_Energy", coords_g_energy)
set_shape_key("Trans_Globe_Mid", coords_g_mid)
set_shape_key("State_Electricity", coords_elec)

set_shape_key("Trans_Elec_Pre", coords_e_pre)
set_shape_key("Trans_Elec_Energy", coords_e_energy)
set_shape_key("Trans_Elec_Mid", coords_e_mid)
set_shape_key("State_Fire", coords_fire)

set_shape_key("Trans_Fire_Pre", coords_f_pre)
set_shape_key("Trans_Fire_Energy", coords_f_energy)
set_shape_key("Trans_Fire_Mid", coords_f_mid)
set_shape_key("State_Lock", coords_lock)

# Save blend file
bpy.ops.wm.save_mainfile(filepath=blend_file)
print(f"SUCCESSFULLY SAVED ALL 12 INTERMEDIATE STATES TO: {blend_file}")
