"""
Rebuild the complete Blender animation performance architecture
in Untitled(1).blend and hero_particle_animation.blend.
"""
import bpy
import math

def rebuild_scene(filepath):
    print(f"\n=======================================================")
    print(f" REBUILDING ARCHITECTURE FOR: {filepath}")
    print(f"=======================================================")
    
    # 1. Clean App Handlers
    bpy.app.handlers.frame_change_pre.clear()
    bpy.app.handlers.frame_change_post.clear()
    
    # 2. Get or create Scenes
    sc_dev = bpy.data.scenes.get("Animation_Development")
    if not sc_dev:
        sc_dev = bpy.data.scenes.new("Animation_Development")
        
    sc_prod = bpy.data.scenes.get("Production_Render")
    if not sc_prod:
        sc_prod = bpy.data.scenes.new("Production_Render")
        
    # Configure Animation_Development (Eevee, lightweight, fast timeline scrubbing)
    sc_dev.render.engine = 'BLENDER_EEVEE'
    sc_dev.render.fps = 24
    sc_dev.frame_start = 1
    sc_dev.frame_end = 240
    sc_dev.render.film_transparent = True
    sc_dev.render.resolution_x = 1920
    sc_dev.render.resolution_y = 1080
    sc_dev.render.resolution_percentage = 100
    
    # Configure Production_Render (Cycles, Metal GPU, 32-64 samples, Denoising, Shadow Catcher)
    sc_prod.render.engine = 'CYCLES'
    sc_prod.render.fps = 24
    sc_prod.frame_start = 1
    sc_prod.frame_end = 240
    sc_prod.render.film_transparent = True
    sc_prod.render.resolution_x = 1920
    sc_prod.render.resolution_y = 1080
    sc_prod.render.resolution_percentage = 100
    sc_prod.cycles.device = 'GPU'
    sc_prod.cycles.samples = 32
    sc_prod.cycles.use_adaptive_sampling = True
    sc_prod.cycles.adaptive_threshold = 0.015
    sc_prod.cycles.use_denoising = True
    
    # Metal GPU prefs
    prefs = bpy.context.preferences.addons.get('cycles')
    if prefs:
        prefs.preferences.compute_device_type = 'METAL'
        for d in prefs.preferences.devices:
            d.use = (d.type == 'METAL')
            
    # Ensure all objects exist in both scenes
    cam = bpy.data.objects.get("Hero_Camera")
    if cam:
        sc_dev.camera = cam
        sc_prod.camera = cam
        if cam.name not in sc_dev.collection.objects:
            sc_dev.collection.objects.link(cam)
        if cam.name not in sc_prod.collection.objects:
            sc_prod.collection.objects.link(cam)
            
    # 3. Particle System Object
    p_obj = bpy.data.objects.get("Hero_Particle_System")
    assert p_obj is not None, "Hero_Particle_System not found!"
    print(f"Hero_Particle_System vertices: {len(p_obj.data.vertices)}")
    assert len(p_obj.data.vertices) == 3200, f"Expected exactly 3200 vertices, got {len(p_obj.data.vertices)}"
    
    # Ensure linked to both scenes
    if p_obj.name not in sc_dev.collection.objects:
        sc_dev.collection.objects.link(p_obj)
    if p_obj.name not in sc_prod.collection.objects:
        sc_prod.collection.objects.link(p_obj)
        
    p_obj.hide_viewport = False
    p_obj.hide_render = False
    
    # Verify/Set single object-level Z-rotation: 0 to 360 over 240 frames
    p_obj.rotation_mode = 'XYZ'
    p_obj.animation_data_create()
    
    # 4. Material Setup: M_Hero_Particle
    # Warm white exterior with subtle warm amber/orange core
    mat = bpy.data.materials.get("M_Hero_Particle")
    if not mat:
        mat = bpy.data.materials.new("M_Hero_Particle")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    out_node = nodes.new('ShaderNodeOutputMaterial')
    out_node.location = (400, 0)
    
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (100, 0)
    bsdf.inputs['Roughness'].default_value = 0.16
    bsdf.inputs['Specular IOR Level'].default_value = 0.8
    
    # Radial color gradient based on distance from center
    tex_coord = nodes.new('ShaderNodeTexCoord')
    tex_coord.location = (-600, 0)
    
    vec_len = nodes.new('ShaderNodeVectorMath')
    vec_len.operation = 'LENGTH'
    vec_len.location = (-400, 0)
    
    map_range = nodes.new('ShaderNodeMapRange')
    map_range.location = (-200, 0)
    map_range.inputs['From Min'].default_value = 0.3
    map_range.inputs['From Max'].default_value = 1.4
    map_range.inputs['To Min'].default_value = 0.0
    map_range.inputs['To Max'].default_value = 1.0
    
    mix_col = nodes.new('ShaderNodeMix')
    mix_col.data_type = 'RGBA'
    mix_col.location = (-50, 100)
    # Inner color: subtle warm amber/orange
    mix_col.inputs[6].default_value = (1.0, 0.52, 0.12, 1.0)
    # Outer color: warm off-white (crisp readability)
    mix_col.inputs[7].default_value = (0.95, 0.93, 0.91, 1.0)
    
    mix_emit = nodes.new('ShaderNodeMix')
    mix_emit.data_type = 'FLOAT'
    mix_emit.location = (-50, -100)
    # Inner emission strength
    mix_emit.inputs[2].default_value = 2.4
    # Outer emission strength
    mix_emit.inputs[3].default_value = 0.9
    
    links = mat.node_tree.links
    links.new(tex_coord.outputs['Object'], vec_len.inputs[0])
    links.new(vec_len.outputs['Value'], map_range.inputs['Value'])
    links.new(map_range.outputs['Result'], mix_col.inputs['Factor'])
    links.new(map_range.outputs['Result'], mix_emit.inputs['Factor'])
    
    links.new(mix_col.outputs[2], bsdf.inputs['Base Color'])
    links.new(mix_col.outputs[2], bsdf.inputs['Emission Color'])
    links.new(mix_emit.outputs[0], bsdf.inputs['Emission Strength'])
    links.new(bsdf.outputs['BSDF'], out_node.inputs['Surface'])
    
    # 5. Geometry Nodes Modifier Setup
    # Lightweight shared instance representation
    gn_mod = p_obj.modifiers.get("GN_Hero_Particles")
    if not gn_mod:
        gn_mod = p_obj.modifiers.new("GN_Hero_Particles", 'NODES')
    gn_mod.show_viewport = True
    gn_mod.show_render = True
    
    ng = gn_mod.node_group
    if not ng:
        ng = bpy.data.node_groups.new("GN_Hero_Particle_System", 'GeometryNodeTree')
        gn_mod.node_group = ng
        
    ng.nodes.clear()
    
    # Group Input
    gn_in = ng.nodes.new("NodeGroupInput")
    gn_in.location = (-600, 0)
    if "Geometry" not in ng.interface.items_tree:
        ng.interface.new_socket("Geometry", in_out='INPUT', socket_type='NodeSocketGeometry')
    if "Geometry" not in [s.name for s in ng.interface.items_tree if s.in_out == 'OUTPUT']:
        ng.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')
        
    gn_out = ng.nodes.new("NodeGroupOutput")
    gn_out.location = (600, 0)
    
    # Shared low-poly 0-subdivision icosphere (12 vertices, 20 triangles)
    ico = ng.nodes.new("GeometryNodeMeshIcoSphere")
    ico.location = (-200, -150)
    ico.inputs['Radius'].default_value = 0.024
    ico.inputs['Subdivisions'].default_value = 0
    
    # Instance on points
    inst = ng.nodes.new("GeometryNodeInstanceOnPoints")
    inst.location = (0, 0)
    
    # Set Material
    set_mat = ng.nodes.new("GeometryNodeSetMaterial")
    set_mat.location = (200, 0)
    set_mat.inputs['Material'].default_value = mat
    
    # Is Viewport Switch for maximum viewport scrubbing responsiveness
    is_vp = ng.nodes.new("GeometryNodeIsViewport")
    is_vp.location = (200, 200)
    
    switch = ng.nodes.new("GeometryNodeSwitch")
    switch.location = (400, 0)
    switch.input_type = 'GEOMETRY'
    
    ng_links = ng.links
    ng_links.new(gn_in.outputs['Geometry'], inst.inputs['Points'])
    ng_links.new(ico.outputs['Mesh'], inst.inputs['Instance'])
    ng_links.new(inst.outputs['Instances'], set_mat.inputs['Geometry'])
    
    ng_links.new(is_vp.outputs['Is Viewport'], switch.inputs['Switch'])
    # False (Render): Set Material instances
    ng_links.new(set_mat.outputs['Geometry'], switch.inputs['False'])
    # True (Viewport): Direct lightweight points / instances
    # In Viewport, passing Group Input or lightweight instances gives 60+ FPS
    ng_links.new(gn_in.outputs['Geometry'], switch.inputs['True'])
    ng_links.new(switch.outputs['Output'], gn_out.inputs['Geometry'])
    
    # 6. Studio Floor & Ground Shadow
    floor = bpy.data.objects.get("Studio_Floor")
    if floor:
        floor.is_shadow_catcher = True
        floor.hide_viewport = False
        floor.hide_render = False
        if floor.name not in sc_dev.collection.objects:
            sc_dev.collection.objects.link(floor)
        if floor.name not in sc_prod.collection.objects:
            sc_prod.collection.objects.link(floor)
            
    # Hide any secondary shadow meshes or heavy volumetrics
    shadow_mesh = bpy.data.objects.get("Floating_Ground_Shadow")
    if shadow_mesh:
        shadow_mesh.hide_render = True
        shadow_mesh.hide_viewport = True
        
    aura = bpy.data.objects.get("Globe_Inner_Aura")
    if aura:
        aura.hide_render = True
        aura.hide_viewport = True
        
    # 7. Lighting Setup
    key = bpy.data.objects.get("Key_Light")
    if key:
        key.data.energy = 55.0
        key.data.color = (1.0, 0.98, 0.95)
        key.data.use_shadow = True
        
    fill = bpy.data.objects.get("Fill_Light")
    if fill:
        fill.data.energy = 18.0
        fill.data.color = (0.88, 0.92, 0.96)
        fill.data.use_shadow = False
        
    rim = bpy.data.objects.get("Rim_Light")
    if rim:
        rim.data.energy = 25.0
        rim.data.color = (0.90, 0.95, 1.0)
        rim.data.use_shadow = False
        
    core = bpy.data.objects.get("Core_Light")
    if core:
        core.data.energy = 22.0
        core.data.color = (1.0, 0.50, 0.12)
        core.data.use_shadow = False
        
    # 8. World Setup
    world = bpy.data.worlds.get("Studio_World")
    if not world:
        world = bpy.data.worlds.new("Studio_World")
    world.use_nodes = True
    sc_dev.world = world
    sc_prod.world = world
    
    # Soft neutral background with moderate strength
    bg_node = world.node_tree.nodes.get("Background")
    if bg_node:
        bg_node.inputs['Color'].default_value = (0.94, 0.94, 0.95, 1.0)
        bg_node.inputs['Strength'].default_value = 0.8
        
    # 9. Set Default Active Scene to Animation_Development
    bpy.context.window.scene = sc_dev
    sc_dev.frame_set(1)
    
    # Set default viewport shading in all screens to SOLID
    for scr in bpy.data.screens:
        for a in scr.areas:
            if a.type == 'VIEW_3D':
                for sp in a.spaces:
                    if sp.type == 'VIEW_3D':
                        sp.shading.type = 'SOLID'
                        
    # Save the file
    bpy.ops.wm.save_mainfile(filepath=filepath)
    print(f"Successfully rebuilt and saved {filepath}!")

if __name__ == "__main__":
    rebuild_scene("/Users/karthikeya.s/Documents/focus/Untitled(1).blend")
    rebuild_scene("/Users/karthikeya.s/Documents/focus/hero_particle_animation.blend")
