import bpy
import os

print("=== RENDERING EXACT CHRONOLOGICAL TRANSITION TEST FRAMES ===")

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

out_dir = "/Users/karthikeya.s/Documents/focus/references/mdx-analysis/exact_transition_test_frames"
os.makedirs(out_dir, exist_ok=True)

test_milestones = [
    ("01_Globe_Hold_End", 69, "Globe HOLD (End)"),
    ("02_Globe_to_Elec_15pct", 73, "Globe -> Elec (15%)"),
    ("03_Globe_to_Elec_40pct", 80, "Globe -> Elec (40%)"),
    ("04_Globe_to_Elec_60pct", 85, "Globe -> Elec (60%)"),
    ("05_Globe_to_Elec_80pct", 91, "Globe -> Elec (80%)"),
    ("06_Electricity_Hold", 102, "Electricity HOLD"),
    ("07_Elec_to_Fire_15pct", 110, "Elec -> Fire (15%)"),
    ("08_Elec_to_Fire_40pct", 114, "Elec -> Fire (40%)"),
    ("09_Elec_to_Fire_60pct", 118, "Elec -> Fire (60%)"),
    ("10_Elec_to_Fire_80pct", 121, "Elec -> Fire (80%)"),
    ("11_Fire_Hold", 130, "Fire HOLD"),
    ("12_Fire_to_Lock_15pct", 138, "Fire -> Lock (15%)"),
    ("13_Fire_to_Lock_50pct", 144, "Fire -> Lock (50%)"),
    ("14_Fire_to_Lock_80pct", 149, "Fire -> Lock (80%)"),
    ("15_Lock_Hold", 156, "Lock HOLD"),
]

for tag, fnum, desc in test_milestones:
    scene.frame_set(fnum)
    fpath = f"{out_dir}/{tag}_f{fnum:03d}.png"
    scene.render.filepath = fpath
    bpy.ops.render.render(write_still=True)
    print(f"Rendered: {tag} (Frame {fnum}) -> {fpath}")

print("=== ALL CHRONOLOGICAL TEST FRAMES RENDERED ===")
