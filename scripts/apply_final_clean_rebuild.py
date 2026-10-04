import bpy

def apply_clean_rebuild():
    print("=" * 80)
    print("APPLYING FINAL CLEAN REBUILD TO Untitled(1).blend")
    print("=" * 80)
    
    src_path = "/Users/karthikeya.s/Documents/focus/Untitled(1)_pre_rebuild_backup.blend"
    dst_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
    print(f"Loading pristine backup: {src_path}")
    bpy.ops.wm.open_mainfile(filepath=src_path)
    
    # -------------------------------------------------------------------------
    # 1. VERIFY BASE MESH & PERSISTENT PARTICLES
    # -------------------------------------------------------------------------
    p_obj = bpy.data.objects.get("Hero_Particle_System")
    assert p_obj is not None, "Hero_Particle_System not found!"
    mesh = p_obj.data
    assert len(mesh.vertices) == 3200, f"Expected 3200 vertices, got {len(mesh.vertices)}"
    print(f"[Step 1] Verified exactly 3,200 persistent vertices in {p_obj.name}.")

    # -------------------------------------------------------------------------
    # 2. GEOMETRY NODES: DUAL-MODE (FAST VIEWPORT VS PRODUCTION RENDER)
    # -------------------------------------------------------------------------
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
    # In Viewport, pass Group Input geometry directly to True socket
    # Zero instancing overhead, >100 FPS timeline playback!
    
    # Branch B: Render Branch (Crisp Icospheres with Radius 0.024)
    n_ico = tree.nodes.new(type='GeometryNodeMeshIcoSphere')
    n_ico.inputs['Radius'].default_value = 0.024
    n_ico.inputs['Subdivisions'].default_value = 0
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
    print("[Step 2] Geometry Nodes dual-mode configured: Viewport uses raw points, Render uses 0.024 instanced particles.")

    # -------------------------------------------------------------------------
    # 3. DISABLE STATIC INNER AURA SPHERE
    # -------------------------------------------------------------------------
    aura_obj = bpy.data.objects.get("Globe_Inner_Aura")
    if aura_obj:
        aura_obj.hide_viewport = True
        aura_obj.hide_render = True
        print("[Step 3] Disabled static Globe_Inner_Aura (no static orb blocking shapes).")

    # -------------------------------------------------------------------------
    # 4. PARTICLE MATERIAL: WARM WHITE WITH INTERNAL AMBER CORE ENERGY
    # -------------------------------------------------------------------------
    if p_mat:
        p_mat.use_nodes = True
        nodes = p_mat.node_tree.nodes
        nodes.clear()
        
        n_out = nodes.new(type='ShaderNodeOutputMaterial')
        n_out.location = (600, 0)
        
        n_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
        n_bsdf.location = (300, 0)
        n_bsdf.inputs['Roughness'].default_value = 0.12
        
        # Object Position Texture Coordinate
        n_tex = nodes.new(type='ShaderNodeTexCoord')
        n_tex.location = (-500, 0)
        
        # Length (distance from center)
        n_len = nodes.new(type='ShaderNodeVectorMath')
        n_len.operation = 'LENGTH'
        n_len.location = (-300, 0)
        p_mat.node_tree.links.new(n_tex.outputs['Object'], n_len.inputs[0])
        
        # Map Range: r from 0.3 to 1.6
        n_map = nodes.new(type='ShaderNodeMapRange')
        n_map.location = (-100, 0)
        n_map.inputs['From Min'].default_value = 0.3
        n_map.inputs['From Max'].default_value = 1.6
        n_map.inputs['To Min'].default_value = 0.0
        n_map.inputs['To Max'].default_value = 1.0
        p_mat.node_tree.links.new(n_len.outputs['Value'], n_map.inputs['Value'])
        
        # Color Ramp / Mix: Core Amber [1.0, 0.50, 0.16] -> Shell Warm White [1.0, 0.98, 0.95]
        n_mix = nodes.new(type='ShaderNodeMix')
        n_mix.data_type = 'RGBA'
        n_mix.location = (100, 100)
        n_mix.inputs['A'].default_value = (1.0, 0.50, 0.16, 1.0)
        n_mix.inputs['B'].default_value = (1.0, 0.98, 0.95, 1.0)
        p_mat.node_tree.links.new(n_map.outputs['Result'], n_mix.inputs['Factor'])
        
        # Emission Strength: Core = 5.0, Outer = 8.5
        n_mix_str = nodes.new(type='ShaderNodeMix')
        n_mix_str.data_type = 'FLOAT'
        n_mix_str.location = (100, -100)
        n_mix_str.inputs['A'].default_value = 5.0
        n_mix_str.inputs['B'].default_value = 8.5
        p_mat.node_tree.links.new(n_map.outputs['Result'], n_mix_str.inputs['Factor'])
        
        p_mat.node_tree.links.new(n_mix.outputs['Result'], n_bsdf.inputs['Base Color'])
        p_mat.node_tree.links.new(n_mix.outputs['Result'], n_bsdf.inputs['Emission Color'])
        p_mat.node_tree.links.new(n_mix_str.outputs['Result'], n_bsdf.inputs['Emission Strength'])
        p_mat.node_tree.links.new(n_bsdf.outputs['BSDF'], n_out.inputs['Surface'])
        print("[Step 4] M_Hero_Particle shader configured with internal energy core gradient.")

    # -------------------------------------------------------------------------
    # 5. LIGHTING & ENVIRONMENT TUNING (HIGH CONTRAST EDITORIAL)
    # -------------------------------------------------------------------------
    floor_obj = bpy.data.objects.get("Studio_Floor")
    if floor_obj and floor_obj.data.materials:
        f_mat = floor_obj.data.materials[0]
        for n in f_mat.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                n.inputs['Base Color'].default_value = (0.93, 0.93, 0.94, 1.0)
                n.inputs['Roughness'].default_value = 0.9
                
    shadow_obj = bpy.data.objects.get("Floating_Ground_Shadow")
    if shadow_obj:
        shadow_obj.scale = (2.2, 2.2, 1.0)
        shadow_obj.location = (0.0, 0.0, -3.18)
        shadow_mat = bpy.data.materials.get("M_Floating_Ground_Shadow")
        if shadow_mat:
            for n in shadow_mat.node_tree.nodes:
                if n.type == 'BSDF_PRINCIPLED':
                    n.inputs['Base Color'].default_value = (0.28, 0.28, 0.32, 1.0)

    l_core = bpy.data.lights.get("Core_Light")
    if l_core:
        l_core.energy = 40.0
        l_core.color = (1.0, 0.50, 0.16)
        l_core.use_shadow = False

    l_key = bpy.data.lights.get("Key_Light")
    if l_key:
        l_key.energy = 130.0
        l_key.color = (1.0, 0.98, 0.96)
        l_key.use_shadow = True

    l_fill = bpy.data.lights.get("Fill_Light")
    if l_fill:
        l_fill.energy = 40.0
        l_fill.use_shadow = False

    l_rim = bpy.data.lights.get("Rim_Light")
    if l_rim:
        l_rim.energy = 50.0
        l_rim.use_shadow = False
    print("[Step 5] Lighting and studio floor tuned for editorial contrast.")

    # -------------------------------------------------------------------------
    # 6. CONFIGURE TWO SEPARATE SCENES
    # -------------------------------------------------------------------------
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

    # Primary scene on open is Animation_Development!
    bpy.context.window.scene = sc_dev
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == 'VIEW_3D':
                for space in area.spaces:
                    if space.type == 'VIEW_3D':
                        space.shading.type = 'SOLID'
                        space.shading.light = 'STUDIO'
                        
    # -------------------------------------------------------------------------
    # 7. SAVE REBUILT .BLEND
    # -------------------------------------------------------------------------
    bpy.ops.wm.save_mainfile(filepath=dst_path)
    print(f"\n[Step 7] Rebuilt architecture saved to: {dst_path}")
    print("=" * 80)

if __name__ == '__main__':
    apply_clean_rebuild()
