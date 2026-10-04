import bpy
import numpy as np

def apply_architecture_and_visual_fix():
    print("=" * 80)
    print("APPLYING PERFORMANCE ARCHITECTURE & VISUAL FIX TO Untitled(1).blend")
    print("=" * 80)
    
    blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
    bpy.ops.wm.open_mainfile(filepath=blend_path)
    
    # 1. Hero_Particle_System: Verify 3,200 persistent vertices
    p_obj = bpy.data.objects.get("Hero_Particle_System")
    assert p_obj is not None, "Hero_Particle_System not found!"
    mesh = p_obj.data
    assert len(mesh.vertices) == 3200, f"Expected 3200 vertices, got {len(mesh.vertices)}"
    print(f"[Step 1] Verified exactly 3,200 persistent vertices.")

    # 2. Geometry Nodes Dual-Mode Setup
    tree = bpy.data.node_groups.get("GN_Hero_Particle_System")
    if not tree:
        tree = bpy.data.node_groups.new(name="GN_Hero_Particle_System", type='GeometryNodeTree')
    
    tree.nodes.clear()
    
    n_in = tree.nodes.new(type='NodeGroupInput')
    n_in.location = (-500, 0)
    
    n_out = tree.nodes.new(type='NodeGroupOutput')
    n_out.location = (600, 0)
    
    n_is_vp = tree.nodes.new(type='GeometryNodeIsViewport')
    n_is_vp.location = (-200, 200)
    
    n_switch = tree.nodes.new(type='GeometryNodeSwitch')
    n_switch.input_type = 'GEOMETRY'
    n_switch.location = (350, 0)
    
    # Branch A: Viewport Branch (Raw Points / Instant Playback)
    # Group Input geometry passes directly to True socket
    
    # Branch B: Render Branch (Crisp Icospheres with Radius 0.025 for Strong Readable Contrast)
    n_ico = tree.nodes.new(type='GeometryNodeMeshIcoSphere')
    n_ico.inputs['Radius'].default_value = 0.025 # Substantial, crisp, readable particles
    n_ico.inputs['Subdivisions'].default_value = 0 # 12 verts, 20 tris (smooth & fast)
    n_ico.location = (-200, -200)
    
    n_inst = tree.nodes.new(type='GeometryNodeInstanceOnPoints')
    n_inst.location = (50, -100)
    
    tree.links.new(n_in.outputs[0], n_inst.inputs['Points'])
    tree.links.new(n_ico.outputs['Mesh'], n_inst.inputs['Instance'])
    
    n_mat = tree.nodes.new(type='GeometryNodeSetMaterial')
    n_mat.location = (200, -100)
    p_mat = bpy.data.materials.get("M_Hero_Particle")
    n_mat.inputs['Material'].default_value = p_mat
    tree.links.new(n_inst.outputs['Instances'], n_mat.inputs['Geometry'])
    
    # Switch: Viewport (True) -> raw points; Render (False) -> instanced particles
    tree.links.new(n_is_vp.outputs['Is Viewport'], n_switch.inputs['Switch'])
    tree.links.new(n_in.outputs[0], n_switch.inputs['True'])
    tree.links.new(n_mat.outputs['Geometry'], n_switch.inputs['False'])
    
    tree.links.new(n_switch.outputs['Output'], n_out.inputs[0])
    print("[Step 2] Geometry Nodes dual-mode wired: Viewport uses raw points, Render uses 0.025 instanced particles.")

    # 3. Particle Material: High-Contrast Warm White
    if p_mat:
        p_mat.use_nodes = True
        nodes = p_mat.node_tree.nodes
        nodes.clear()
        
        n_out_mat = nodes.new(type='ShaderNodeOutputMaterial')
        n_out_mat.location = (400, 0)
        
        n_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
        n_bsdf.location = (100, 0)
        n_bsdf.inputs['Base Color'].default_value = (1.0, 0.98, 0.94, 1.0)
        n_bsdf.inputs['Roughness'].default_value = 0.12
        n_bsdf.inputs['Emission Color'].default_value = (1.0, 0.97, 0.92, 1.0)
        n_bsdf.inputs['Emission Strength'].default_value = 6.5 # Luminous warm-white pop
        
        p_mat.node_tree.links.new(n_bsdf.outputs['BSDF'], n_out_mat.inputs['Surface'])
        print("[Step 3] M_Hero_Particle upgraded for crisp, warm-white visibility.")

    # 4. Inner Aura: Soft Radiant Amber/Peach Glow
    aura_obj = bpy.data.objects.get("Globe_Inner_Aura")
    if aura_obj:
        aura_obj.scale = (1.25, 1.25, 1.25) # Perfectly nested within sphere cloud
        aura_mat = bpy.data.materials.get("M_Inner_Aura")
        if aura_mat:
            aura_mat.use_nodes = True
            nodes = aura_mat.node_tree.nodes
            nodes.clear()
            
            n_out_aura = nodes.new(type='ShaderNodeOutputMaterial')
            n_out_aura.location = (400, 0)
            
            n_layer = nodes.new(type='ShaderNodeLayerWeight')
            n_layer.location = (-150, 100)
            n_layer.inputs['Blend'].default_value = 0.45
            
            n_emit = nodes.new(type='ShaderNodeEmission')
            n_emit.location = (50, 100)
            n_emit.inputs['Color'].default_value = (1.0, 0.48, 0.14, 1.0) # Warm amber/peach
            n_emit.inputs['Strength'].default_value = 2.2
            
            n_trans = nodes.new(type='ShaderNodeBsdfTransparent')
            n_trans.location = (50, -100)
            
            n_mix = nodes.new(type='ShaderNodeMixShader')
            n_mix.location = (250, 0)
            
            aura_mat.node_tree.links.new(n_layer.outputs['Facing'], n_mix.inputs['Fac'])
            aura_mat.node_tree.links.new(n_emit.outputs['Emission'], n_mix.inputs[1])
            aura_mat.node_tree.links.new(n_trans.outputs['BSDF'], n_mix.inputs[2])
            aura_mat.node_tree.links.new(n_mix.outputs['Shader'], n_out_aura.inputs['Surface'])
            print("[Step 4] Globe_Inner_Aura upgraded with radiant amber facing emission.")

    # 5. Studio Floor & Ground Shadow
    floor_obj = bpy.data.objects.get("Studio_Floor")
    if floor_obj:
        floor_mat = bpy.data.materials.get("M_Studio_Floor")
        if floor_mat:
            nodes = floor_mat.node_tree.nodes
            for n in nodes:
                if n.type == 'BSDF_PRINCIPLED':
                    n.inputs['Base Color'].default_value = (0.94, 0.94, 0.95, 1.0)
                    n.inputs['Roughness'].default_value = 0.85
                    
    shadow_obj = bpy.data.objects.get("Floating_Ground_Shadow")
    if shadow_obj:
        shadow_obj.scale = (2.2, 2.2, 1.0)
        shadow_obj.location = (0.0, 0.0, -3.18)
        shadow_mat = bpy.data.materials.get("M_Floating_Ground_Shadow")
        if shadow_mat:
            nodes = shadow_mat.node_tree.nodes
            for n in nodes:
                if n.type == 'BSDF_PRINCIPLED':
                    n.inputs['Base Color'].default_value = (0.28, 0.28, 0.32, 1.0)

    # 6. Lighting Tuning (Editorial balance without whiteout haze)
    l_key = bpy.data.lights.get("Key_Light")
    if l_key:
        l_key.energy = 140.0 # Balanced key light
        l_key.color = (1.0, 0.98, 0.96)
        l_key.use_shadow = True
        
    l_fill = bpy.data.lights.get("Fill_Light")
    if l_fill:
        l_fill.energy = 45.0
        l_fill.color = (0.92, 0.94, 0.98)
        l_fill.use_shadow = False
        
    l_rim = bpy.data.lights.get("Rim_Light")
    if l_rim:
        l_rim.energy = 60.0
        l_rim.color = (0.90, 0.94, 1.0)
        l_rim.use_shadow = False
        
    l_core = bpy.data.lights.get("Core_Light")
    if l_core:
        l_core.energy = 35.0
        l_core.color = (1.0, 0.48, 0.14)
        l_core.use_shadow = False

    # 7. Configure Two Clean Scenes
    # Scene 1: Animation_Development
    sc_dev = bpy.data.scenes.get("Animation_Development") or bpy.data.scenes.get("Hero_Development")
    if not sc_dev:
        sc_dev = bpy.data.scenes.new("Animation_Development")
    sc_dev.name = "Animation_Development"
    sc_dev.render.engine = 'BLENDER_EEVEE'
    sc_dev.render.resolution_x = 960
    sc_dev.render.resolution_y = 540
    sc_dev.render.fps = 24
    sc_dev.frame_start = 1
    sc_dev.frame_end = 240
    sc_dev.view_settings.view_transform = 'Filmic'
    sc_dev.view_settings.look = 'Medium High Contrast'
    sc_dev.view_settings.exposure = 0.0

    # Scene 2: Production_Render
    sc_prod = bpy.data.scenes.get("Production_Render") or bpy.data.scenes.get("Scene")
    if not sc_prod:
        sc_prod = bpy.data.scenes.new("Production_Render")
    sc_prod.name = "Production_Render"
    sc_prod.render.engine = 'CYCLES'
    sc_prod.cycles.device = 'GPU'
    sc_prod.render.resolution_x = 1920
    sc_prod.render.resolution_y = 1080
    sc_prod.render.fps = 24
    sc_prod.frame_start = 1
    sc_prod.frame_end = 240
    sc_prod.cycles.samples = 64
    sc_prod.cycles.use_adaptive_sampling = True
    sc_prod.cycles.adaptive_threshold = 0.04
    sc_prod.cycles.use_denoising = True
    
    # Enable Metal GPU
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
        
    sc_prod.view_settings.view_transform = 'Filmic'
    sc_prod.view_settings.look = 'Medium High Contrast'
    sc_prod.view_settings.exposure = 0.0

    # SET DEFAULT SCENE ON OPEN TO Animation_Development!
    bpy.context.window.scene = sc_dev
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == 'VIEW_3D':
                for space in area.spaces:
                    if space.type == 'VIEW_3D':
                        space.shading.type = 'SOLID'
                        space.shading.light = 'STUDIO'
                        
    # 8. Save updated blend file
    bpy.ops.wm.save_mainfile(filepath=blend_path)
    print(f"\n[Step 8] Saved rebuilt architecture to: {blend_path}")
    print("=" * 80)

if __name__ == '__main__':
    apply_architecture_and_visual_fix()
