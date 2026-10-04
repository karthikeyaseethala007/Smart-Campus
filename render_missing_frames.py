import os
import sys
import subprocess

out_dir = "/Users/karthikeya.s/.gemini/antigravity-ide/brain/dab923e1-2e4e-4119-a833-1f4986b63310/transparent_render_1080p"
blend_file = "/Users/karthikeya.s/Documents/focus/hero_particle_animation.blend"
blender_bin = "/Applications/Blender.app/Contents/MacOS/Blender"

ranges = [
    (38, 60),
    (157, 180),
    (218, 240)
]

for start, end in ranges:
    print(f"=== Rendering frames {start} to {end} ===")
    script = f"""
import bpy
scene = bpy.context.scene
scene.render.film_transparent = True
scene.cycles.device = 'GPU'
scene.cycles.samples = 16
scene.cycles.use_denoising = True
if 'Studio_Floor' in bpy.data.objects:
    bpy.data.objects['Studio_Floor'].hide_render = True
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.file_format = 'PNG'
scene.frame_start = {start}
scene.frame_end = {end}
scene.render.filepath = '{out_dir}/frame_'
bpy.ops.render.render(animation=True)
"""
    tmp_script = f"/tmp/render_missing_{start}_{end}.py"
    with open(tmp_script, "w") as f:
        f.write(script)
    cmd = [blender_bin, "-b", blend_file, "-P", tmp_script]
    res = subprocess.run(cmd)
    print(f"Done frames {start}-{end}, exit code: {res.returncode}")

print("=== ALL MISSING FRAMES RENDERED ===")
