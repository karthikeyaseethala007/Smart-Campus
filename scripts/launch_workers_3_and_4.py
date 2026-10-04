import os
import subprocess

out_dir = "/Users/karthikeya.s/.gemini/antigravity-ide/brain/751a256d-a337-4c01-8c6b-427f3a5ae3a6/transparent_render_1080p"
blend_file = "/Users/karthikeya.s/Documents/focus/hero_particle_animation.blend"
blender_bin = "/Applications/Blender.app/Contents/MacOS/Blender"

def launch_chunk(start, end, chunk_id):
    script = f"""
import bpy
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
scene.frame_start = {start}
scene.frame_end = {end}
scene.render.filepath = '{out_dir}/frame_'
bpy.ops.render.render(animation=True)
"""
    script_file = f"/tmp/render_extra_chunk_{chunk_id}.py"
    with open(script_file, "w") as f:
        f.write(script)
    cmd = [blender_bin, "-b", blend_file, "-P", script_file]
    print(f"Launching extra chunk {chunk_id}: frames {start}-{end}")
    subprocess.Popen(cmd)

# Worker 3: 61-120
launch_chunk(61, 120, 3)
import time
time.sleep(3)
# Worker 4: 181-240
launch_chunk(181, 240, 4)
print("Both extra workers 3 and 4 launched in background!")
