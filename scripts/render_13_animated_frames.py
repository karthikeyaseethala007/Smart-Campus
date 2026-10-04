import bpy
import os

print("=== RENDERING 13 ANIMATED TEST FRAMES AT EXACT TIMING ===")

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

out_dir = "/Users/karthikeya.s/Documents/focus/references/mdx-analysis/13_transition_animated_blender"
os.makedirs(out_dir, exist_ok=True)

test_frames = [
    ("01_globe_hold", 40),
    ("02_globe_25pct", 76),
    ("03_globe_50pct", 83),
    ("04_globe_75pct", 90),
    ("05_electricity_resolved", 96),
    ("06_electricity_25pct", 112),
    ("07_electricity_50pct", 116),
    ("08_electricity_75pct", 120),
    ("09_fire_resolved", 124),
    ("10_fire_25pct", 139),
    ("11_fire_50pct", 144),
    ("12_fire_75pct", 148),
    ("13_lock_resolved", 152),
]

for label, fnum in test_frames:
    scene.frame_set(fnum)
    fpath = f"{out_dir}/{label}.png"
    scene.render.filepath = fpath
    bpy.ops.render.render(write_still=True)
    print(f"Rendered: {label} (Frame {fnum}) -> {fpath}")

print("=== ALL 13 ANIMATED BLENDER FRAMES RENDERED ===")
