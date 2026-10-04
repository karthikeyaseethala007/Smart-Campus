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

P_E_orig = np.array([v.co for v in kb['State_Electricity'].data])
N = 3200

np.random.seed(101)

# Sort original lightning particles by Z
z_sort = np.argsort(P_E_orig[:, 2])
P_E_sorted = P_E_orig[z_sort]

# Allocate 1800 particles to main bolt with 3D depth and high-voltage jitter
idx_main = np.linspace(0, N-1, 1800).astype(int)
main_bolt = P_E_sorted[idx_main].copy()
# Expand Y depth with cylindrical dielectric radius
main_bolt[:, 1] = main_bolt[:, 1] * 2.8 + np.random.normal(0, 0.08, 1800)
# Add subtle high-voltage jitter along edges
main_bolt[:, 0] += np.random.normal(0, 0.04, 1800)

def make_jagged_branch(start_pt, dir_vec, length, count, roughness=0.22):
    t = np.linspace(0, 1, count)
    pts = np.outer(1 - t, start_pt) + np.outer(t, start_pt + dir_vec * length)
    
    # Perpendicular vectors
    norm = np.linalg.norm(dir_vec)
    d = dir_vec / (norm if norm > 1e-4 else 1.0)
    p1 = np.cross(d, [0, 0, 1])
    if np.linalg.norm(p1) < 1e-3: p1 = np.cross(d, [0, 1, 0])
    p1 = p1 / np.linalg.norm(p1)
    p2 = np.cross(d, p1)
    
    # Sharp zigzag displacement
    displ = np.zeros((count, 3))
    for freq in [3, 6, 11]:
        phase = np.random.uniform(0, 2*np.pi)
        amp = roughness * length / np.sqrt(freq)
        env = np.sin(np.pi * t)
        displ += (amp * np.sin(freq * np.pi * t + phase) * env)[:, None] * p1[None, :]
        displ += (amp * np.cos(freq * np.pi * t + phase) * env)[:, None] * p2[None, :]
    
    jitter = np.random.normal(0, 0.03, (count, 3))
    return pts + displ + jitter

# Find node points on main bolt for branching
# Upper elbow (near Z = 0.9):
node_up = np.array([-0.35, 0.1, 0.85])
# Mid elbow (near Z = 0.1):
node_mid = np.array([0.40, -0.1, 0.10])
# Lower knee (near Z = -0.7):
node_low = np.array([-0.25, 0.05, -0.70])

# Branch 1: Upper-left fork (350 pts)
b1 = make_jagged_branch(node_up, np.array([-0.85, 0.40, 0.35]), 1.3, 350)
# Branch 2: Mid-right fork (350 pts)
b2 = make_jagged_branch(node_mid, np.array([0.85, -0.35, 0.40]), 1.3, 350)
# Branch 3: Lower-left fork (350 pts)
b3 = make_jagged_branch(node_low, np.array([-0.80, -0.40, -0.45]), 1.2, 350)
# Branch 4: 3D forward/backward arcs (350 pts)
b4_f = make_jagged_branch(node_up, np.array([0.20, 0.90, -0.20]), 1.0, 175)
b4_b = make_jagged_branch(node_mid, np.array([-0.20, -0.90, -0.20]), 1.0, 175)

refined_elec = np.vstack([main_bolt, b1, b2, b3, b4_f, b4_b])
assert len(refined_elec) == 3200

for i in range(N):
    kb['State_Electricity'].data[i].co = refined_elec[i]

if sk.animation_data: sk.animation_data_clear()
if obj.animation_data: obj.animation_data_clear()

scene = bpy.context.scene
scene.render.resolution_x = 960
scene.render.resolution_y = 540

for b in kb: b.value = 0.0
kb['State_Electricity'].value = 1.0

# Render 0 deg
obj.rotation_euler = (0, 0, 0)
scene.render.filepath = os.path.join(out_dir, "elec_refined_0deg.png")
bpy.ops.render.render(write_still=True)

# Render 128 deg (view at frame 86 during Electricity hold!)
obj.rotation_euler = (0, 0, np.radians(128))
scene.render.filepath = os.path.join(out_dir, "elec_refined_128deg.png")
bpy.ops.render.render(write_still=True)

print("Rendered refined electricity frames!")
