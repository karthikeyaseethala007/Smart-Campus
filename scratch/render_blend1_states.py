import bpy
import numpy as np

bpy.ops.wm.open_mainfile(filepath="/Users/karthikeya.s/Documents/focus/Untitled(1).blend1")
scene = bpy.context.scene
scene.render.film_transparent = True
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.file_format = 'PNG'

floor = bpy.data.objects.get("Studio_Floor")
if floor:
    floor.hide_render = True

out_dir = "/Users/karthikeya.s/Documents/focus/scratch/blend1_states"
import os
os.makedirs(out_dir, exist_ok=True)

test_frames = [1, 80, 150, 220]
rendered_images = []

for f in test_frames:
    scene.frame_set(f)
    out_path = f"{out_dir}/state_frame_{f:04d}.png"
    scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered frame {f}")
    
    img = bpy.data.images.load(out_path)
    px = np.array(img.pixels[:]).reshape((1080, 1920, 4))
    rendered_images.append(px)
    bpy.data.images.remove(img)

# Create a 2x2 contact sheet on a light neutral background (like website)
h, w = 1080 // 2, 1920 // 2
contact = np.ones((h * 2, w * 2, 4), dtype=np.float32)
# light background #f8f9fa
contact[:, :, 0] = 0.97
contact[:, :, 1] = 0.98
contact[:, :, 2] = 0.98
contact[:, :, 3] = 1.0

# Subsample by 2
positions = [(0, 0), (0, 1), (1, 0), (1, 1)]
for idx, px in enumerate(rendered_images):
    sub = px[::2, ::2, :]
    r, c = positions[idx]
    y_start, y_end = r * h, (r + 1) * h
    x_start, x_end = c * w, (c + 1) * w
    
    alpha = sub[:, :, 3:4]
    rgb = sub[:, :, :3]
    bg = contact[y_start:y_end, x_start:x_end, :3]
    # alpha compositing
    comp = rgb * alpha + bg * (1.0 - alpha)
    contact[y_start:y_end, x_start:x_end, :3] = comp

# Save contact sheet via Blender image
contact_img = bpy.data.images.new("contact_sheet", width=w*2, height=h*2, alpha=True)
contact_img.pixels.foreach_set(contact.flatten())
contact_path = "/Users/karthikeya.s/Documents/focus/scratch/blend1_contact_sheet.png"
contact_img.filepath_raw = contact_path
contact_img.file_format = 'PNG'
contact_img.save()
print("Saved contact sheet to", contact_path)
