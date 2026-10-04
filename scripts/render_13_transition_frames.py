import bpy
import os

out_dir = "/Users/karthikeya.s/Documents/focus/references/mdx-analysis/final-difference-audit/transition_13_test/blender_frames"
os.makedirs(out_dir, exist_ok=True)

scene = bpy.context.scene
scene.render.film_transparent = True
scene.cycles.device = 'CPU'
scene.cycles.samples = 16
scene.cycles.use_denoising = True

if 'Studio_Floor' in bpy.data.objects:
    bpy.data.objects['Studio_Floor'].hide_render = True

scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.file_format = 'PNG'

# The 13 required transition frames
frames_13 = [
    (1, "01_Globe_hold"),
    (61, "02_Globe_25pct_deformation"),
    (68, "03_Globe_50pct_deformation"),
    (74, "04_Globe_75pct_deformation"),
    (80, "05_Electricity_resolved"),
    (111, "06_Electricity_25pct_deformation"),
    (118, "07_Electricity_50pct_deformation"),
    (124, "08_Electricity_75pct_deformation"),
    (131, "09_Fire_resolved"),
    (167, "10_Fire_25pct_deformation"),
    (174, "11_Fire_50pct_deformation"),
    (180, "12_Fire_75pct_deformation"),
    (187, "13_Lock_resolved")
]

print(f"=== RENDERING ONLY THE 13 TRANSITION TEST FRAMES ===")
for f, name in frames_13:
    scene.frame_set(f)
    out_path = f"{out_dir}/frame_{f:03d}_{name}.png"
    scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered: frame {f:3d} -> {name}")

print("=== ALL 13 TEST FRAMES RENDERED SUCCESSFULLY ===")
