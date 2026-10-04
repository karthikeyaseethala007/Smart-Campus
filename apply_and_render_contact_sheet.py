import bpy
import os
import numpy as np


out_dir = "/Users/karthikeya.s/Documents/focus/test_new_shapes"
os.makedirs(out_dir, exist_ok=True)

blend_path = "/Users/karthikeya.s/Documents/focus/hero_particle_animation.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

obj = bpy.data.objects['Hero_Particle_System']
sk = obj.data.shape_keys
kb = sk.key_blocks

P_globe = np.load("/Users/karthikeya.s/Documents/focus/target_globe.npy")
P_elec = np.load("/Users/karthikeya.s/Documents/focus/target_electricity.npy")
P_fire = np.load("/Users/karthikeya.s/Documents/focus/target_fire.npy")
P_lock = np.load("/Users/karthikeya.s/Documents/focus/target_lock.npy")

print("Applying target positions to shape keys...")
for i in range(3200):
    kb['State_Globe'].data[i].co = P_globe[i]
    kb['State_Electricity'].data[i].co = P_elec[i]
    kb['State_Fire'].data[i].co = P_fire[i]
    kb['State_Lock'].data[i].co = P_lock[i]

# Also ensure base basis has clean globe coordinates
for i in range(3200):
    obj.data.vertices[i].co = P_globe[i]

scene = bpy.context.scene
scene.render.resolution_x = 960
scene.render.resolution_y = 540
scene.render.film_transparent = True
scene.render.image_settings.color_mode = 'RGBA'

# Clear animation temporarily for still test
if sk.animation_data: sk.animation_data_clear()
if obj.animation_data: obj.animation_data_clear()

# Render each state still
states = [
    ('State_Globe', 'STATE_GLOBE', 0.0),
    ('State_Electricity', 'STATE_ELECTRICITY', 0.0),
    ('State_Fire', 'STATE_FIRE', 0.0),
    ('State_Lock', 'STATE_LOCK', 0.0)
]

for sk_name, label, rot_deg in states:
    for b in kb: b.value = 0.0
    kb[sk_name].value = 1.0
    obj.rotation_euler = (0, 0, np.radians(rot_deg))
    scene.render.filepath = os.path.join(out_dir, f"{label}.png")
    bpy.ops.render.render(write_still=True)
    print(f"Rendered {label}.png")

# Also render Electricity at 128 deg (view at frame 86 during hold!)
for b in kb: b.value = 0.0
kb['State_Electricity'].value = 1.0
obj.rotation_euler = (0, 0, np.radians(128.0))
scene.render.filepath = os.path.join(out_dir, "STATE_ELECTRICITY_ROT128.png")
bpy.ops.render.render(write_still=True)
print("Rendered STATE_ELECTRICITY_ROT128.png")

# Save updated blend file as pre-render master
bpy.ops.wm.save_as_mainfile(filepath="/Users/karthikeya.s/Documents/focus/hero_particle_animation_updated.blend")
print("Saved hero_particle_animation_updated.blend")

