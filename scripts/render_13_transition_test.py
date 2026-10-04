import bpy
import os
import math
import numpy as np

print("=== RENDERING 13 TRANSITION TEST FRAMES ===")

blend_file = "/Users/karthikeya.s/Documents/focus/hero_particle_animation.blend"
bpy.ops.wm.open_mainfile(filepath=blend_file)

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'GPU'
scene.cycles.samples = 32
scene.render.film_transparent = True
scene.render.resolution_x = 960
scene.render.resolution_y = 540
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'

# Metal GPU
prefs = bpy.context.preferences
cprefs = prefs.addons['cycles'].preferences
cprefs.compute_device_type = 'METAL'
cprefs.get_devices()
for d in cprefs.devices:
    if d.type == 'METAL':
        d.use = True

obj = bpy.data.objects['Hero_Particle_System']
kb = obj.data.shape_keys.key_blocks

# Disable any actions/animation on the object and shape keys for explicit state testing
if obj.animation_data:
    obj.animation_data_clear()
if obj.data.shape_keys.animation_data:
    obj.data.shape_keys.animation_data_clear()

out_dir = "/Users/karthikeya.s/Documents/focus/references/mdx-analysis/13_transition_test_blender"
os.makedirs(out_dir, exist_ok=True)

test_frames = [
    ("01_globe_hold", "State_Globe", 40, 60.0),
    ("02_globe_25pct", "Transition_Globe_Pre", 76, 114.0),
    ("03_globe_50pct", "Transition_Globe_Energy", 83, 124.5),
    ("04_globe_75pct", "Transition_Globe_Mid", 90, 135.0),
    ("05_electricity_resolved", "Transition_Electricity_Resolve", 96, 144.0),
    ("06_electricity_25pct", "Transition_Electricity_Pre", 112, 168.0),
    ("07_electricity_50pct", "Transition_Electricity_Energy", 116, 174.0),
    ("08_electricity_75pct", "Transition_Electricity_Mid", 120, 180.0),
    ("09_fire_resolved", "Transition_Fire_Resolve", 124, 186.0),
    ("10_fire_25pct", "Transition_Fire_Pre", 139, 208.5),
    ("11_fire_50pct", "Transition_Fire_Energy", 144, 216.0),
    ("12_fire_75pct", "Transition_Fire_Mid", 148, 222.0),
    ("13_lock_resolved", "Transition_Lock_Resolve", 152, 228.0),
]

for label, shape_name, fnum, rot_deg in test_frames:
    # Reset all shape keys to 0
    for block in kb:
        block.value = 0.0
    
    # Set the active shape key to 1.0 (if not Basis State_Globe)
    if shape_name in kb and shape_name != "State_Globe":
        kb[shape_name].value = 1.0
    
    # Set rotation
    obj.rotation_euler.z = math.radians(rot_deg)
    
    # Render
    fpath = f"{out_dir}/{label}.png"
    scene.render.filepath = fpath
    bpy.ops.render.render(write_still=True)
    print(f"Rendered: {label} (Shape: {shape_name}, Rot: {rot_deg} deg) -> {fpath}")

print("=== ALL 13 TEST BLENDER FRAMES RENDERED ===")
