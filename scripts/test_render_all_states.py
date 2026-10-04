import bpy
import os

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100

# Hide floor and shadow planes
floor = bpy.data.objects.get("Studio_Floor")
if floor:
    floor.hide_render = True
    floor.hide_viewport = True

shadow = bpy.data.objects.get("Floating_Ground_Shadow")
if shadow:
    shadow.hide_render = True
    shadow.hide_viewport = True

aura = bpy.data.objects.get("Globe_Inner_Aura")
if aura:
    aura.hide_render = True
    aura.hide_viewport = True

test_frames = [1, 60, 120, 180, 240]
out_dir = "/tmp/test_states"
os.makedirs(out_dir, exist_ok=True)

for f in test_frames:
    scene.frame_set(f)
    out_path = f"{out_dir}/frame_{f:03d}.png"
    scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered frame {f} to {out_path}")

print("All test state frames rendered successfully!")
