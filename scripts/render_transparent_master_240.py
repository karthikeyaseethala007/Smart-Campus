import bpy
import os
import sys
import time

blend_path = "/Users/karthikeya.s/Documents/focus/hero_particle_animation.blend"
frames_dir = "/Users/karthikeya.s/Documents/focus/public/assets/hero/frames_alpha"
os.makedirs(frames_dir, exist_ok=True)

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.compression = 15
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100

# Hide floor and background planes completely
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

# Ensure particles are visible
ps = bpy.data.objects.get("Hero_Particle_System")
if ps:
    ps.hide_render = False
    ps.hide_viewport = False

scene.frame_start = 1
scene.frame_end = 240
scene.render.filepath = os.path.join(frames_dir, "frame_")

print("--- COMMENCING 240-FRAME TRANSPARENT RENDER ---")
t0 = time.time()
bpy.ops.render.render(animation=True)
t1 = time.time()
print(f"--- 240 FRAMES RENDERED IN {t1 - t0:.2f} SECONDS ---")
