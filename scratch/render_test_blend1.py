import bpy
import os

scene = bpy.context.scene
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.film_transparent = True

out_dir = "/Users/karthikeya.s/Documents/focus/scratch/test_blend1_renders"
os.makedirs(out_dir, exist_ok=True)

test_frames = [1, 80, 150, 220]
for f in test_frames:
    scene.frame_set(f)
    scene.render.filepath = os.path.join(out_dir, f"blend1_frame_{f:04d}.png")
    bpy.ops.render.render(write_still=True)
    print(f"Rendered frame {f} to {scene.render.filepath}")

