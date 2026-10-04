import bpy
import os

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
# Enable Metal GPU if available
prefs = bpy.context.preferences
cprefs = prefs.addons['cycles'].preferences
cprefs.compute_device_type = 'METAL'
cprefs.get_devices()
for d in cprefs.devices:
    if d.type == 'METAL':
        d.use = True
scene.cycles.device = 'GPU'
scene.cycles.samples = 32

scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100

# HIDE STUDIO FLOOR!
floor = bpy.data.objects.get("Studio_Floor")
if floor:
    floor.hide_render = True
    floor.hide_viewport = True

# Also ensure Floating_Ground_Shadow is hidden or check how it looks
shadow = bpy.data.objects.get("Floating_Ground_Shadow")
if shadow:
    shadow.hide_render = True
    shadow.hide_viewport = True

out_path = "/tmp/test_frame_001_transparent.png"
scene.render.filepath = out_path
scene.frame_set(1)
bpy.ops.render.render(write_still=True)
print(f"Rendered test frame 1 to {out_path}")
