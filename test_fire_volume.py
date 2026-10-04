import bpy
import os
import numpy as np

out_dir = "/Users/karthikeya.s/Documents/focus/test_new_shapes"
os.makedirs(out_dir, exist_ok=True)

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

obj = bpy.data.objects['Hero_Particle_System']
sk = obj.data.shape_keys
kb = sk.key_blocks

P_F_orig = np.array([v.co for v in kb['State_Fire'].data])
N = 3200

# Give Fire true isotropic radial volume around its central spine
# P_F_orig[:, 0] is X, P_F_orig[:, 1] is Y, P_F_orig[:, 2] is Z
# Map points to cylindrical coordinates:
# Let's create two spiraling licking flame tongues in 3D
np.random.seed(42)

P_F_3d = P_F_orig.copy()
# Radial distance in X from centerline of flame
x_flame = P_F_orig[:, 0]
z_norm = (P_F_orig[:, 2] + 1.85) / 3.7 # 0 at bottom, 1 at top

# Distribute particles in 3D volume around central axis
# The original Y thickness was tiny [-0.35, 0.35].
# Let's expand Y to match X width based on flame contour:
x_extent = np.abs(x_flame)
# Disperse Y smoothly within circle of radius x_extent + 0.3
theta = np.random.uniform(0, 2*np.pi, N)
# Blend original X with radial swirl
r_prof = np.clip(np.abs(x_flame), 0.2, 1.35)
P_F_3d[:, 0] = r_prof * np.cos(theta + 1.2 * z_norm)
P_F_3d[:, 1] = r_prof * np.sin(theta + 1.2 * z_norm) * 0.9
P_F_3d[:, 2] = P_F_orig[:, 2] + 0.1 * np.sin(2 * theta)

for i in range(N):
    kb['State_Fire'].data[i].co = P_F_3d[i]

if sk.animation_data: sk.animation_data_clear()
if obj.animation_data: obj.animation_data_clear()

scene = bpy.context.scene
scene.render.resolution_x = 960
scene.render.resolution_y = 540

for b in kb: b.value = 0.0
kb['State_Fire'].value = 1.0

# Render 0 deg
obj.rotation_euler = (0, 0, 0)
scene.render.filepath = os.path.join(out_dir, "fire_vol_0deg.png")
bpy.ops.render.render(write_still=True)

# Render 233 deg
obj.rotation_euler = (0, 0, np.radians(233))
scene.render.filepath = os.path.join(out_dir, "fire_vol_233deg.png")
bpy.ops.render.render(write_still=True)

print("Rendered fire_vol_0deg and fire_vol_233deg")
