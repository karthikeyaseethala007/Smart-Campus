import bpy
import numpy as np

print("=== UPDATING BLENDER HERO PARTICLE ANIMATION ===")

blend_file = "/Users/karthikeya.s/Documents/focus/hero_particle_animation.blend"
bpy.ops.wm.open_mainfile(filepath=blend_file)

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

obj = bpy.data.objects['Hero_Particle_System']
mesh = obj.data
sk = mesh.shape_keys
kb = sk.key_blocks

globe = np.array([v.co for v in kb['State_Globe'].data])
N = len(globe)
assert N == 3200, f"Expected 3200 vertices, got {N}"
print(f"Verified 3,200 persistent vertices in {obj.name}.")

# Compute spherical coordinates from Globe Basis
r = np.linalg.norm(globe, axis=1)
theta = np.arctan2(globe[:, 1], globe[:, 0])
phi = np.arcsin(np.clip(globe[:, 2] / np.maximum(r, 1e-6), -1.0, 1.0))

# 1. State_Electricity (Concentric 3D wave rings & field coils)
z_elec = 1.75 * np.sin(phi) + 0.18 * np.sin(3 * theta + 2 * phi)
r_xy_elec = 1.35 + 0.45 * np.cos(4 * theta) * np.cos(2 * phi) + 0.15 * np.sin(6 * theta)
psi_elec = theta + 0.3 * np.sin(2 * phi)
x_elec = r_xy_elec * np.cos(psi_elec)
y_elec = r_xy_elec * np.sin(psi_elec)
elec_coords = np.stack([x_elec, y_elec, z_elec], axis=1)

# 2. State_Fire (Volumetric 3D flame plume)
u_fire = (phi + np.pi/2) / np.pi
z_fire = -1.8 + 3.65 * (u_fire**0.85) + 0.12 * np.cos(3 * theta)
r_xy_fire = (1.35 * (1.05 - 0.65 * u_fire) + 0.28 * np.sin(3 * theta + 4 * u_fire)) * (0.88 + 0.12 * np.cos(5 * theta))
psi_fire = theta + 0.8 * u_fire
x_fire = r_xy_fire * np.cos(psi_fire)
y_fire = r_xy_fire * np.sin(psi_fire)
fire_coords = np.stack([x_fire, y_fire, z_fire], axis=1)

# 3. State_Lock (Volumetric padlock: 3D tumbler base + 3D tubular arch)
is_base = phi < 0.22
lock_coords = np.zeros_like(globe)

# Tumbler base
u_base = (phi[is_base] + np.pi/2) / (0.22 + np.pi/2)
th_base = theta[is_base]
r_factor = 0.85 + 0.15 * (r[is_base] / 2.0)
xb = 1.30 * np.sign(np.cos(th_base)) * (np.abs(np.cos(th_base))**0.65) * r_factor
yb = 1.15 * np.sign(np.sin(th_base)) * (np.abs(np.sin(th_base))**0.65) * r_factor
zb = -1.8 + 1.85 * u_base
lock_coords[is_base] = np.stack([xb, yb, zb], axis=1)

# Shackle
is_shackle = ~is_base
u_sh = (phi[is_shackle] - 0.22) / (np.pi/2 - 0.22)
alpha = u_sh * np.pi
arch_radius = 0.82
xc = -arch_radius * np.cos(alpha)
zc = 0.12 + 0.95 * np.sin(alpha)
beta = theta[is_shackle]
rt = 0.26 * (0.85 + 0.15 * (r[is_shackle] - 1.8) / 0.2)
xs = xc - rt * np.cos(beta) * np.cos(alpha)
ys = rt * np.sin(beta)
zs = zc + rt * np.cos(beta) * np.sin(alpha)
lock_coords[is_shackle] = np.stack([xs, ys, zs], axis=1)

# Write updated 3D coordinates into shape keys
for i in range(N):
    kb['State_Electricity'].data[i].co = elec_coords[i]
    kb['State_Fire'].data[i].co = fire_coords[i]
    kb['State_Lock'].data[i].co = lock_coords[i]

print("Successfully written 3D volumetric coordinates to State_Electricity, State_Fire, State_Lock.")

# ANIMATION CURVES SETUP
# 1. Rotation on Hero_Particle_System: Continuous linear Z rotation (360 deg across 240 frames)
if obj.animation_data:
    obj.animation_data_clear()
obj.animation_data_create()

obj.rotation_euler.z = 0.0
obj.keyframe_insert(data_path="rotation_euler", index=2, frame=1)
obj.rotation_euler.z = 6.283185307179586
obj.keyframe_insert(data_path="rotation_euler", index=2, frame=240)

# Set rotation interpolation to LINEAR
for fc in get_action_fcurves(obj.animation_data.action):
    if fc.data_path == "rotation_euler" and fc.array_index == 2:
        for pt in fc.keyframe_points:
            pt.interpolation = 'LINEAR'
print("Created continuous linear Z rotation curve.")

# 2. Scale breathing response on Hero_Particle_System
scale_keys = [
    (1, 1.000),
    (55, 1.000),
    (68, 1.042),   # Peak swell during Morph 1 (+4.2%)
    (80, 1.008),   # Resolve
    (95, 1.000),   # Settle
    (104, 1.000),  # Hold
    (118, 1.035),  # Peak surge during Morph 2 (+3.5%)
    (131, 1.006),  # Resolve
    (148, 1.000),  # Settle
    (160, 1.000),  # Hold
    (174, 0.972),  # Compression during Morph 3 (-2.8%)
    (187, 1.005),  # Resolve
    (197, 1.000),  # Settle
    (220, 1.000),  # Steady lock rotation
    (240, 0.950),  # Optical recession towards editorial
]
for f, s in scale_keys:
    obj.scale = (s, s, s)
    obj.keyframe_insert(data_path="scale", frame=f)

# 3. Shape Keys Animation on mesh.shape_keys
if sk.animation_data:
    sk.animation_data_clear()
sk.animation_data_create()

# Keyframes for State_Electricity
kb_elec = kb['State_Electricity']
elec_keyframes = [
    (1, 0.0),
    (55, 0.0),
    (68, 0.50),   # Peak intermediate deformation
    (80, 1.0),    # Resolve
    (104, 1.0),   # Hold
    (118, 0.50),  # Morph out
    (131, 0.0),   # Resolved out
    (240, 0.0),
]
for f, val in elec_keyframes:
    kb_elec.value = val
    kb_elec.keyframe_insert(data_path="value", frame=f)

# Keyframes for State_Fire
kb_fire = kb['State_Fire']
fire_keyframes = [
    (1, 0.0),
    (104, 0.0),
    (118, 0.50),  # Peak intermediate deformation
    (131, 1.0),   # Resolve
    (160, 1.0),   # Hold
    (174, 0.50),  # Morph out
    (187, 0.0),   # Resolved out
    (240, 0.0),
]
for f, val in fire_keyframes:
    kb_fire.value = val
    kb_fire.keyframe_insert(data_path="value", frame=f)

# Keyframes for State_Lock
kb_lock = kb['State_Lock']
lock_keyframes = [
    (1, 0.0),
    (160, 0.0),
    (174, 0.50),  # Peak intermediate deformation
    (187, 1.0),   # Resolve
    (240, 1.0),   # Hold & rotate
]
for f, val in lock_keyframes:
    kb_lock.value = val
    kb_lock.keyframe_insert(data_path="value", frame=f)

print("Created 3-phase shape key curves (Hold -> Intermediate Deformation -> Resolve -> Settle).")

# 4. Orange Core Energy illumination response on Core_Light
core_light = bpy.data.objects.get('Core_Light')
if core_light and core_light.data:
    light_data = core_light.data
    if light_data.animation_data:
        light_data.animation_data_clear()
    light_data.animation_data_create()
    
    energy_keys = [
        (1, 65.0),
        (55, 65.0),
        (68, 84.0),   # Peak Morph 1 (+29%)
        (80, 70.0),
        (95, 65.0),
        (104, 65.0),
        (118, 110.0), # Peak Morph 2 Fire surge (+69%)
        (131, 72.0),
        (148, 65.0),
        (160, 65.0),
        (174, 86.0),  # Peak Morph 3 Lock (+32%)
        (187, 70.0),
        (197, 65.0),
        (240, 65.0),
    ]
    for f, val in energy_keys:
        light_data.energy = val
        light_data.keyframe_insert(data_path="energy", frame=f)
    print("Created responsive internal orange core energy keyframes.")

# 5. Ground Contact Shadow response on Floating_Ground_Shadow
shadow = bpy.data.objects.get('Floating_Ground_Shadow')
if shadow:
    if shadow.animation_data:
        shadow.animation_data_clear()
    shadow.animation_data_create()
    
    shadow_keys = [
        (1, 1.00),
        (55, 1.00),
        (68, 1.05),
        (80, 1.02),
        (95, 1.00),
        (104, 1.00),
        (118, 0.96),
        (131, 0.99),
        (148, 1.00),
        (160, 1.00),
        (174, 1.04),
        (187, 1.01),
        (197, 1.00),
        (240, 0.95),
    ]
    for f, s in shadow_keys:
        shadow.scale = (s, s, 1.0)
        shadow.keyframe_insert(data_path="scale", frame=f)
    print("Created responsive physical ground shadow keyframes.")

# Ensure transparent film rendering
scene = bpy.context.scene
scene.render.film_transparent = True
scene.cycles.use_denoising = True
scene.frame_start = 1
scene.frame_end = 240

# Save blend file
bpy.ops.wm.save_mainfile(filepath=blend_file)
print(f"SUCCESSFULLY SAVED UPDATED BLENDER MASTER FILE: {blend_file}")
