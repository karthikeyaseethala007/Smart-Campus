import bpy
import os
import time

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

# 1. Hide/Disable Globe_Inner_Aura
aura_obj = bpy.data.objects.get("Globe_Inner_Aura")
if aura_obj:
    aura_obj.hide_viewport = True
    aura_obj.hide_render = True
    print("Disabled static Globe_Inner_Aura.")

# 2. Upgrade M_Hero_Particle shader with radial internal amber energy core
p_mat = bpy.data.materials.get("M_Hero_Particle")
if p_mat:
    p_mat.use_nodes = True
    nodes = p_mat.node_tree.nodes
    nodes.clear()
    
    n_out = nodes.new(type='ShaderNodeOutputMaterial')
    n_out.location = (600, 0)
    
    n_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    n_bsdf.location = (300, 0)
    n_bsdf.inputs['Roughness'].default_value = 0.12
    
    # Texture Coordinate (Object coordinates)
    n_tex = nodes.new(type='ShaderNodeTexCoord')
    n_tex.location = (-500, 0)
    
    # Vector Math (Length of object position = distance from center)
    n_len = nodes.new(type='ShaderNodeVectorMath')
    n_len.operation = 'LENGTH'
    n_len.location = (-300, 0)
    p_mat.node_tree.links.new(n_tex.outputs['Object'], n_len.inputs[0])
    
    # Map Range: r from 0.4 to 1.6 -> Fac 0 to 1
    n_map = nodes.new(type='ShaderNodeMapRange')
    n_map.location = (-100, 0)
    n_map.inputs['From Min'].default_value = 0.3
    n_map.inputs['From Max'].default_value = 1.6
    n_map.inputs['To Min'].default_value = 0.0
    n_map.inputs['To Max'].default_value = 1.0
    p_mat.node_tree.links.new(n_len.outputs['Value'], n_map.inputs['Value'])
    
    # Color Ramp / Mix Color: Inner Amber -> Outer Warm White
    # Fac = 0 (Center): Warm Amber/Peach [1.0, 0.50, 0.16]
    # Fac = 1 (Shell): Brilliant Warm White [1.0, 0.98, 0.95]
    n_mix = nodes.new(type='ShaderNodeMix')
    n_mix.data_type = 'RGBA'
    n_mix.location = (100, 100)
    n_mix.inputs['A'].default_value = (1.0, 0.50, 0.16, 1.0) # Inner amber core
    n_mix.inputs['B'].default_value = (1.0, 0.98, 0.95, 1.0) # Outer warm white
    p_mat.node_tree.links.new(n_map.outputs['Result'], n_mix.inputs['Factor'])
    
    # Emission Strength: Core = 5.0, Outer = 8.5
    n_mix_str = nodes.new(type='ShaderNodeMix')
    n_mix_str.data_type = 'FLOAT'
    n_mix_str.location = (100, -100)
    n_mix_str.inputs['A'].default_value = 5.0  # Core strength
    n_mix_str.inputs['B'].default_value = 8.5  # Outer strength
    p_mat.node_tree.links.new(n_map.outputs['Result'], n_mix_str.inputs['Factor'])
    
    p_mat.node_tree.links.new(n_mix.outputs['Result'], n_bsdf.inputs['Base Color'])
    p_mat.node_tree.links.new(n_mix.outputs['Result'], n_bsdf.inputs['Emission Color'])
    p_mat.node_tree.links.new(n_mix_str.outputs['Result'], n_bsdf.inputs['Emission Strength'])
    p_mat.node_tree.links.new(n_bsdf.outputs['BSDF'], n_out.inputs['Surface'])
    print("M_Hero_Particle shader configured with internal energy core gradient.")

# 3. Soft Studio Lighting with High-Key Contrast
# Set Studio Floor
floor_obj = bpy.data.objects.get("Studio_Floor")
if floor_obj and floor_obj.data.materials:
    f_mat = floor_obj.data.materials[0]
    for n in f_mat.node_tree.nodes:
        if n.type == 'BSDF_PRINCIPLED':
            n.inputs['Base Color'].default_value = (0.93, 0.93, 0.94, 1.0)
            n.inputs['Roughness'].default_value = 0.9

# Core light
l_core = bpy.data.lights.get("Core_Light")
if l_core:
    l_core.energy = 40.0
    l_core.color = (1.0, 0.50, 0.16)

# Key light
l_key = bpy.data.lights.get("Key_Light")
if l_key:
    l_key.energy = 130.0
    l_key.color = (1.0, 0.98, 0.96)

# Fill light
l_fill = bpy.data.lights.get("Fill_Light")
if l_fill:
    l_fill.energy = 40.0

# Rim light
l_rim = bpy.data.lights.get("Rim_Light")
if l_rim:
    l_rim.energy = 50.0

# Save blend
bpy.ops.wm.save_mainfile(filepath=blend_path)

# Render the 4 test frames
scene = bpy.data.scenes.get("Production_Render")
bpy.context.window.scene = scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'GPU'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'
prefs.get_devices()
for d in prefs.devices:
    d.use = True

scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.cycles.samples = 64
scene.cycles.use_adaptive_sampling = True
scene.cycles.use_denoising = True

out_dir = "/Users/karthikeya.s/Documents/focus/test_visual_frames_v2"
os.makedirs(out_dir, exist_ok=True)

for f in [1, 86, 155, 225]:
    scene.frame_set(f)
    scene.render.filepath = os.path.join(out_dir, f"frame_{f:03d}.png")
    print(f"Rendering frame {f}...")
    t0 = time.perf_counter()
    bpy.ops.render.render(write_still=True)
    print(f"Rendered frame {f} in {time.perf_counter() - t0:.2f} s")
