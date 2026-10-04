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

P_G = np.array([v.co for v in kb['State_Globe'].data])
P_E_orig = np.array([v.co for v in kb['State_Electricity'].data])
P_F_orig = np.array([v.co for v in kb['State_Fire'].data])
P_L = np.array([v.co for v in kb['State_Lock'].data])

N = 3200

# -------------------------------------------------------------
# 1. BUILD UNMISTAKABLE 3D BRANCHING ELECTRICITY (3200 particles)
# -------------------------------------------------------------
# We want:
# - Main central lightning bolt (thick, jagged, energetic)
# - Prominent branching arcs / forks (upper-left, mid-right, lower-left, 3D depth)
# - Sharp jagged lightning path with high-voltage branches
np.random.seed(42)

# Segment-based lightning generator
def generate_lightning_branch(start, end, num_pts, roughness=0.18, num_subdiv=3):
    # Generates jagged points between start and end
    t = np.linspace(0, 1, num_pts)
    line = np.outer(1 - t, start) + np.outer(t, end)
    # Add jagged perpendicular offsets
    direction = end - start
    length = np.linalg.norm(direction)
    # Perpendicular vectors
    p1 = np.cross(direction, [0, 0, 1])
    if np.linalg.norm(p1) < 1e-4:
        p1 = np.cross(direction, [0, 1, 0])
    p1 = p1 / np.linalg.norm(p1)
    p2 = np.cross(direction, p1)
    p2 = p2 / np.linalg.norm(p2)
    
    # Harmonic jagged displacement
    displ = np.zeros((num_pts, 3))
    for freq in [2, 4, 7, 13]:
        phase1 = np.random.uniform(0, 2*np.pi)
        phase2 = np.random.uniform(0, 2*np.pi)
        amp = roughness * length / np.sqrt(freq)
        envelope = np.sin(np.pi * t) # zero at ends
        displ += (amp * np.sin(freq * np.pi * t + phase1) * envelope)[:, None] * p1[None, :]
        displ += (amp * np.cos(freq * np.pi * t + phase2) * envelope)[:, None] * p2[None, :]
        
    # Micro jitter along plasma channel
    jitter = np.random.normal(0, 0.035, (num_pts, 3))
    return line + displ + jitter

# Let's allocate 3200 particles across the branching lightning tree:
# Main trunk: 1400 particles (Z: +1.85 down to -1.85)
# Sharp lightning nodes:
p_top = np.array([0.15, 0.05, 1.85])
p_mid1 = np.array([-0.35, 0.12, 0.85])
p_elbow = np.array([0.45, -0.10, 0.10])
p_mid2 = np.array([-0.20, 0.08, -0.75])
p_bot = np.array([-0.05, -0.05, -1.85])

pts_trunk1 = generate_lightning_branch(p_top, p_mid1, 350, roughness=0.14)
pts_trunk2 = generate_lightning_branch(p_mid1, p_elbow, 350, roughness=0.16)
pts_trunk3 = generate_lightning_branch(p_elbow, p_mid2, 350, roughness=0.16)
pts_trunk4 = generate_lightning_branch(p_mid2, p_bot, 350, roughness=0.14)
trunk = np.vstack([pts_trunk1, pts_trunk2, pts_trunk3, pts_trunk4]) # 1400

# Branch 1: Upper-left fork (shoots off from p_mid1 toward [-1.2, 0.45, 1.45])
p_b1_end = np.array([-1.25, 0.45, 1.45])
b1_main = generate_lightning_branch(p_mid1, p_b1_end, 300, roughness=0.22)
p_b1_sub = p_mid1 * 0.4 + p_b1_end * 0.6 + np.array([-0.1, 0.1, 0.0])
p_b1_sub_end = np.array([-1.55, 0.15, 1.05])
b1_fork = generate_lightning_branch(p_b1_sub, p_b1_sub_end, 150, roughness=0.20)
branch1 = np.vstack([b1_main, b1_fork]) # 450

# Branch 2: Mid-right fork (shoots off from p_elbow toward [1.35, -0.35, 0.65])
p_b2_end = np.array([1.35, -0.40, 0.70])
b2_main = generate_lightning_branch(p_elbow, p_b2_end, 320, roughness=0.22)
p_b2_sub = p_elbow * 0.4 + p_b2_end * 0.6
p_b2_sub_end = np.array([1.60, 0.25, 0.20])
b2_fork = generate_lightning_branch(p_b2_sub, p_b2_sub_end, 150, roughness=0.20)
branch2 = np.vstack([b2_main, b2_fork]) # 470

# Branch 3: Lower-left fork (shoots off from p_mid2 toward [-1.15, -0.45, -1.35])
p_b3_end = np.array([-1.15, -0.45, -1.35])
b3_main = generate_lightning_branch(p_mid2, p_b3_end, 280, roughness=0.20)
p_b3_sub = p_mid2 * 0.5 + p_b3_end * 0.5
p_b3_sub_end = np.array([-0.70, 0.45, -1.55])
b3_fork = generate_lightning_branch(p_b3_sub, p_b3_sub_end, 120, roughness=0.18)
branch3 = np.vstack([b3_main, b3_fork]) # 400

# Branch 4: 3D Forward/Backward depth discharges (giving true spatial presence)
# Fork 4A: Forward discharge from p_mid1
p_b4_end = np.array([0.25, 0.85, 0.55])
b4_main = generate_lightning_branch(p_mid1, p_b4_end, 240, roughness=0.25)
# Fork 4B: Backward discharge from p_mid2
p_b5_end = np.array([0.15, -0.85, -0.45])
b5_main = generate_lightning_branch(p_mid2, p_b5_end, 240, roughness=0.25)
branch4 = np.vstack([b4_main, b5_main]) # 480

elec_pts = np.vstack([trunk, branch1, branch2, branch3, branch4]) # total 1400 + 450 + 470 + 400 + 480 = 3200!
print("Generated branching electricity points:", elec_pts.shape)
assert len(elec_pts) == 3200

# -------------------------------------------------------------
# 2. BUILD VOLUMETRIC 3D FLAME (3200 particles)
# -------------------------------------------------------------
# Take the artist's beautiful flame silhouette P_F_orig, but give it:
# - Rich 3D volumetric depth in Y so it's not a flat wafer
# - Dynamic licking flame tongues with upward convective twist
P_F_vol = P_F_orig.copy()
# Expand Y depth based on flame width and height
# Base is teardrop round, top tongues swirl in 3D
r_xy = np.sqrt(P_F_vol[:, 0]**2 + (P_F_vol[:, 1]*3.0)**2)
z_norm = (P_F_vol[:, 2] + 1.85) / 3.7 # 0 to 1
# Volumetric radial expansion in Y
y_expansion = 2.4 * (1.0 - 0.25 * z_norm) # fuller volume
P_F_vol[:, 1] = P_F_orig[:, 1] * y_expansion
# Add gentle convective helical swirl to flame tips
swirl_angle = 0.8 * (z_norm**1.5)
x_new = P_F_vol[:, 0] * np.cos(swirl_angle) - P_F_vol[:, 1] * np.sin(swirl_angle)
y_new = P_F_vol[:, 0] * np.sin(swirl_angle) + P_F_vol[:, 1] * np.cos(swirl_angle)
P_F_vol[:, 0] = x_new
P_F_vol[:, 1] = y_new

print("P_F_vol shape:", P_F_vol.shape)
print("P_F_vol Y span:", P_F_vol[:, 1].max() - P_F_vol[:, 1].min())

# Update shape keys in blender
for i in range(N):
    kb['State_Electricity'].data[i].co = elec_pts[i]
    kb['State_Fire'].data[i].co = P_F_vol[i]

# Clear animations
if sk.animation_data:
    sk.animation_data_clear()
if obj.animation_data:
    obj.animation_data_clear()

# Render diagnostic views
scene = bpy.context.scene
scene.render.resolution_x = 960
scene.render.resolution_y = 540
scene.render.resolution_percentage = 100

# Render 1: Electricity at 0 deg (Step 1 front view)
for b in kb: b.value = 0.0
kb['State_Electricity'].value = 1.0
obj.rotation_euler = (0, 0, 0)
scene.render.filepath = os.path.join(out_dir, "elec_0deg.png")
bpy.ops.render.render(write_still=True)

# Render 2: Electricity at 128 deg (Angle during Electricity hold in animation!)
obj.rotation_euler = (0, 0, np.radians(128))
scene.render.filepath = os.path.join(out_dir, "elec_128deg.png")
bpy.ops.render.render(write_still=True)

# Render 3: Fire at 0 deg (Step 1 front view)
for b in kb: b.value = 0.0
kb['State_Fire'].value = 1.0
obj.rotation_euler = (0, 0, 0)
scene.render.filepath = os.path.join(out_dir, "fire_0deg.png")
bpy.ops.render.render(write_still=True)

# Render 4: Fire at 233 deg (Angle during Fire hold in animation!)
obj.rotation_euler = (0, 0, np.radians(233))
scene.render.filepath = os.path.join(out_dir, "fire_233deg.png")
bpy.ops.render.render(write_still=True)

print("Test renders complete in", out_dir)
