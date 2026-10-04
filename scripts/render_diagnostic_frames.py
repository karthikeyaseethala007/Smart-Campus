import bpy
import os

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
print(f"Loading {blend_path}")
bpy.ops.wm.open_mainfile(filepath=blend_path)

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'GPU'
scene.cycles.samples = 16
scene.cycles.use_denoising = True
scene.render.resolution_x = 960
scene.render.resolution_y = 540
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'

out_dir = "/Users/karthikeya.s/Documents/focus/diagnostic_frames"
os.makedirs(out_dir, exist_ok=True)

diagnostic_frames = [
    1, 30, 40, 50, 60, 70, 80, 105, 115, 125,
    135, 145, 160, 175, 185, 195, 205, 215, 230, 240
]

print(f"Rendering {len(diagnostic_frames)} diagnostic frames...")

for frame_num in diagnostic_frames:
    scene.frame_set(frame_num)
    frame_path = os.path.join(out_dir, f"diag_frame_{frame_num:03d}.png")
    scene.render.filepath = frame_path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered frame {frame_num:3d} -> {frame_path}")

print("All diagnostic frames successfully rendered.")
