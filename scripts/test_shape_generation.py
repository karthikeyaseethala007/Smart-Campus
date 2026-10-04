import bpy
import numpy as np

mesh = bpy.data.objects['Hero_Particle_System'].data
kb = mesh.shape_keys.key_blocks
globe = np.array([v.co for v in kb['State_Globe'].data])
N = len(globe)

# Compute spherical coordinates of Globe vertices
r = np.linalg.norm(globe, axis=1)
theta = np.arctan2(globe[:, 1], globe[:, 0])
phi = np.arcsin(np.clip(globe[:, 2] / np.maximum(r, 1e-6), -1.0, 1.0))

print(f"Spherical coords computed for {N} particles.")

# 1. State_Electricity (Concentric 3D wave rings & field coils)
# Full 3D radial depth
z_elec = 1.75 * np.sin(phi) + 0.18 * np.sin(3 * theta + 2 * phi)
r_xy_elec = 1.35 + 0.45 * np.cos(4 * theta) * np.cos(2 * phi) + 0.15 * np.sin(6 * theta)
psi_elec = theta + 0.3 * np.sin(2 * phi)
x_elec = r_xy_elec * np.cos(psi_elec)
y_elec = r_xy_elec * np.sin(psi_elec)
elec_coords = np.stack([x_elec, y_elec, z_elec], axis=1)

# 2. State_Fire (Volumetric 3D flame plume)
u_fire = (phi + np.pi/2) / np.pi # [0, 1]
z_fire = -1.8 + 3.65 * (u_fire**0.85) + 0.12 * np.cos(3 * theta)
r_xy_fire = (1.35 * (1.05 - 0.65 * u_fire) + 0.28 * np.sin(3 * theta + 4 * u_fire)) * (0.88 + 0.12 * np.cos(5 * theta))
psi_fire = theta + 0.8 * u_fire
x_fire = r_xy_fire * np.cos(psi_fire)
y_fire = r_xy_fire * np.sin(psi_fire)
fire_coords = np.stack([x_fire, y_fire, z_fire], axis=1)

# 3. State_Lock (Volumetric padlock: 3D tumbler base + 3D tubular arch)
is_base = phi < 0.22
lock_coords = np.zeros_like(globe)

# Base particles
u_base = (phi[is_base] + np.pi/2) / (0.22 + np.pi/2)
th_base = theta[is_base]
r_factor = 0.85 + 0.15 * (r[is_base] / 2.0)
xb = 1.30 * np.sign(np.cos(th_base)) * (np.abs(np.cos(th_base))**0.65) * r_factor
yb = 1.15 * np.sign(np.sin(th_base)) * (np.abs(np.sin(th_base))**0.65) * r_factor
zb = -1.8 + 1.85 * u_base
lock_coords[is_base] = np.stack([xb, yb, zb], axis=1)

# Shackle particles
is_shackle = ~is_base
u_sh = (phi[is_shackle] - 0.22) / (np.pi/2 - 0.22) # [0, 1]
alpha = u_sh * np.pi # arch angle [0, pi]
arch_radius = 0.82
xc = -arch_radius * np.cos(alpha)
zc = 0.12 + 0.95 * np.sin(alpha)
beta = theta[is_shackle]
rt = 0.26 * (0.85 + 0.15 * (r[is_shackle] - 1.8) / 0.2)
xs = xc - rt * np.cos(beta) * np.cos(alpha)
ys = rt * np.sin(beta)
zs = zc + rt * np.cos(beta) * np.sin(alpha)
lock_coords[is_shackle] = np.stack([xs, ys, zs], axis=1)

# Validate across rotation angles
def check_rotation_widths(name, coords):
    print(f"\n=== Testing {name} ===")
    print(f"  X span: [{coords[:,0].min():.2f}, {coords[:,0].max():.2f}] (span={np.ptp(coords[:,0]):.2f})")
    print(f"  Y span: [{coords[:,1].min():.2f}, {coords[:,1].max():.2f}] (span={np.ptp(coords[:,1]):.2f})")
    print(f"  Z span: [{coords[:,2].min():.2f}, {coords[:,2].max():.2f}] (span={np.ptp(coords[:,2]):.2f})")
    
    widths = []
    for deg in range(0, 360, 15):
        rad = np.radians(deg)
        # Project onto camera view axis (looking along Y axis from Y=-25.68)
        # Rotated X (horizontal across screen)
        proj_x = coords[:, 0] * np.cos(rad) - coords[:, 1] * np.sin(rad)
        w = np.ptp(proj_x)
        widths.append((deg, w))
    
    w_min = min(w for _, w in widths)
    w_max = max(w for _, w in widths)
    print(f"  Projected screen width across 360 deg: min={w_min:.2f}, max={w_max:.2f}, ratio={w_min/w_max:.2f}")
    assert w_min / w_max > 0.65, f"WARNING: Minimum width ratio too low: {w_min/w_max:.2f}"
    print(f"  PASS: {name} remains fully volumetric across all 360 deg!")

check_rotation_widths("State_Globe", globe)
check_rotation_widths("State_Electricity", elec_coords)
check_rotation_widths("State_Fire", fire_coords)
check_rotation_widths("State_Lock", lock_coords)
