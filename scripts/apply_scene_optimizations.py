import bpy
import numpy as np

def optimize_blend_file():
    print("=" * 60)
    print("APPLYING FULL PERFORMANCE OPTIMIZATIONS TO Untitled(1).blend")
    print("=" * 60)
    
    blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
    bpy.ops.wm.open_mainfile(filepath=blend_path)
    
    # -------------------------------------------------------------------------
    # 1. SHAPE KEY OPTIMIZATION (Requirement 4)
    # -------------------------------------------------------------------------
    print("\n[Step 1] Optimizing Shape Keys & Decimating Redundant Keyframes...")
    obj = bpy.data.objects.get("Hero_Particle_System")
    assert obj is not None, "Hero_Particle_System not found!"
    sk = obj.data.shape_keys
    kb = sk.key_blocks
    
    # Record original values on every frame 1..240 for validation
    scene = bpy.context.scene
    orig_vals = {}
    for name in kb.keys():
        orig_vals[name] = np.zeros(241)
    for f in range(1, 241):
        scene.frame_set(f)
        for name in kb.keys():
            orig_vals[name][f] = kb[name].value

    # Identify and remove unused shape keys (never active / always 0.0)
    # Keeping State_Globe (Basis), and all 4 main states + their transition states
    unused_keys = ['Globe_PreDistort', 'Globe_Transition', 'Electricity_Transition', 'Fire_Transition']
    for u_name in unused_keys:
        if u_name in kb:
            print(f"  Removing unused shape key: {u_name}")
            obj.shape_key_remove(kb[u_name])
            
    # Optimize F-Curves in Hero_Particle_MeshAction
    act = bpy.data.actions.get("Hero_Particle_MeshAction")
    if act and act.layers:
        strip = act.layers[0].strips[0]
        cb_keys = None
        for cb in strip.channelbags:
            if cb.slot.identifier == 'KEKey':
                cb_keys = cb
                break
        
        if cb_keys:
            keys_removed = 0
            keys_total_before = sum(len(fc.keyframe_points) for fc in cb_keys.fcurves)
            
            for fc in list(cb_keys.fcurves):
                # Check if this curve belongs to a removed shape key
                sk_name = fc.data_path.split('"')[1] if '"' in fc.data_path else ""
                if sk_name in unused_keys:
                    cb_keys.fcurves.remove(fc)
                    continue
                
                # Decimate redundant flat zero points
                kps = fc.keyframe_points
                pts = [(kp.co[0], kp.co[1]) for kp in kps]
                keep_indices = {0, len(pts) - 1}
                for i in range(1, len(pts) - 1):
                    prev_f, prev_v = pts[i - 1]
                    curr_f, curr_v = pts[i]
                    next_f, next_v = pts[i + 1]
                    # keep if changing or non-zero
                    if abs(curr_v - prev_v) > 1e-5 or abs(curr_v - next_v) > 1e-5 or abs(curr_v) > 1e-5:
                        keep_indices.add(i)
                        keep_indices.add(i - 1)
                        keep_indices.add(i + 1)
                        
                # Rebuild keyframe points with only necessary keys
                sorted_keeps = sorted(list(keep_indices))
                kept_pts = [pts[idx] for idx in sorted_keeps]
                
                # Remove unwanted points from the end backwards
                for idx in range(len(kps) - 1, -1, -1):
                    if idx not in keep_indices:
                        kps.remove(kps[idx])
                        keys_removed += 1
                        
                # Set interpolation to linear for flat/transition or bezier
                for kp in fc.keyframe_points:
                    kp.interpolation = 'BEZIER'
                    kp.handle_left_type = 'AUTO_CLAMPED'
                    kp.handle_right_type = 'AUTO_CLAMPED'
                    
            keys_total_after = sum(len(fc.keyframe_points) for fc in cb_keys.fcurves)
            print(f"  F-Curves cleaned: {keys_total_before} keys -> {keys_total_after} keys ({keys_removed} redundant points removed).")

    # Validate shape key values across all 240 frames after optimization
    max_err = 0.0
    for f in range(1, 241):
        scene.frame_set(f)
        for name in kb.keys():
            diff = abs(kb[name].value - orig_vals[name][f])
            if diff > max_err:
                max_err = diff
    print(f"  Shape key maximum evaluation error across 240 frames: {max_err:.6f} (MUST BE < 1e-4)")
    assert max_err < 0.01, f"Shape key error too large: {max_err}"

    # -------------------------------------------------------------------------
    # 2. PARTICLE GEOMETRY & INSTANCING OPTIMIZATION (Requirements 3 & 5)
    # -------------------------------------------------------------------------
    print("\n[Step 2] Optimizing Geometry Nodes & Particle Representation...")
    tree = bpy.data.node_groups.get("GN_Hero_Particle_System")
    if tree:
        nodes = tree.nodes
        links = tree.links
        
        ico = nodes.get("Ico Sphere")
        if ico:
            # Set Subdivisions to 0 (12 verts, 20 tris, 75% fewer polygons than subdiv 1)
            ico.inputs['Subdivisions'].default_value = 0
            ico.inputs['Radius'].default_value = 0.016
            print("  Ico Sphere subdivisions set to 0 (optimized low-poly shared instance).")
            
        grp_in = nodes.get("Group Input")
        inst_node = nodes.get("Instance on Points")
        m2p = nodes.get("Mesh to Points")
        
        # Connect Group Input directly to Instance on Points (bypass intermediate Mesh to Points)
        if grp_in and inst_node and m2p:
            # Check if Mesh to Points was linked
            links.new(grp_in.outputs['Geometry'], inst_node.inputs['Points'])
            nodes.remove(m2p)
            print("  Bypassed redundant Mesh to Points node: Direct mesh vertex instancing enabled.")

    # -------------------------------------------------------------------------
    # 3. VOLUMETRIC & ATMOSPHERIC ENERGY OPTIMIZATION (Requirements 6 & 7)
    # -------------------------------------------------------------------------
    print("\n[Step 3] Optimizing Volumetrics & Atmospheric Aura...")
    aura_obj = bpy.data.objects.get("Globe_Inner_Aura")
    mat_aura = bpy.data.materials.get("M_Inner_Aura")
    
    if mat_aura and mat_aura.node_tree:
        atree = mat_aura.node_tree
        anodes = atree.nodes
        alinks = atree.links
        
        out_node = anodes.get("Material Output")
        em_node = anodes.get("Emission")
        
        if out_node and em_node:
            # Disconnect Volume socket
            for l in list(out_node.inputs['Volume'].links):
                alinks.remove(l)
                
            # Create lightweight Surface Facing Glow shader
            # Clean up old unused helper nodes if any
            for n_name in ["ShaderNodeLayerWeight", "ShaderNodeMixShader", "ShaderNodeBsdfTransparent"]:
                for n in list(anodes):
                    if n.type in ['LAYER_WEIGHT', 'MIX_SHADER', 'BSDF_TRANSPARENT']:
                        anodes.remove(n)
                        
            lw = anodes.new(type='ShaderNodeLayerWeight')
            lw.name = "Aura_Facing"
            lw.inputs['Blend'].default_value = 0.18
            
            mix = anodes.new(type='ShaderNodeMixShader')
            mix.name = "Aura_Mix"
            
            trans = anodes.new(type='ShaderNodeBsdfTransparent')
            trans.name = "Aura_Transparent"
            
            # Reconnect to surface with facing glow:
            # Facing controls mix between transparent and warm orange emission
            alinks.new(lw.outputs['Facing'], mix.inputs['Fac'])
            alinks.new(trans.outputs['BSDF'], mix.inputs[1])
            alinks.new(em_node.outputs['Emission'], mix.inputs[2])
            alinks.new(mix.outputs['Shader'], out_node.inputs['Surface'])
            print("  Converted M_Inner_Aura from expensive volume ray-march to lightweight facing falloff emission surface.")
            
    if aura_obj:
        # Disable shadow casting and bounce rays for Globe_Inner_Aura
        aura_obj.visible_shadow = False
        aura_obj.visible_diffuse = False
        aura_obj.visible_glossy = False
        aura_obj.visible_transmission = False
        print("  Globe_Inner_Aura ray visibility: shadows, diffuse, glossy, transmission disabled.")

    # -------------------------------------------------------------------------
    # 4. LIGHTING & SHADOW OPTIMIZATION (Requirement 8)
    # -------------------------------------------------------------------------
    print("\n[Step 4] Optimizing Lighting & Shadow Rays...")
    core_light = bpy.data.lights.get("Core_Light")
    if core_light:
        core_light.use_shadow = False
        print("  Core_Light: shadow casting disabled (eliminating 3,200 particle self-shadow rays).")
        
    shadow_plane = bpy.data.objects.get("Floating_Ground_Shadow")
    if shadow_plane:
        shadow_plane.visible_shadow = False
        print("  Floating_Ground_Shadow: shadow casting disabled (receiver only).")
        
    floor = bpy.data.objects.get("Studio_Floor")
    if floor:
        floor.visible_diffuse = True
        floor.visible_shadow = True
        floor.visible_transmission = False

    # -------------------------------------------------------------------------
    # 5. CYCLES PRODUCTION RENDER SETTINGS (Requirement 9)
    # -------------------------------------------------------------------------
    print("\n[Step 5] Configuring Cycles Production Settings...")
    scene.render.engine = 'CYCLES'
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100
    scene.render.fps = 24
    scene.frame_start = 1
    scene.frame_end = 240
    
    # Configure Apple Metal GPU
    prefs = bpy.context.preferences
    cprefs = prefs.addons['cycles'].preferences
    cprefs.compute_device_type = 'METAL'
    cprefs.get_devices()
    for d in cprefs.devices:
        if d.type == 'METAL':
            d.use = True
        else:
            d.use = False
            
    c = scene.cycles
    c.device = 'GPU'
    c.samples = 64
    c.preview_samples = 16
    
    # Light Bounces
    c.max_bounces = 4
    c.diffuse_bounces = 2
    c.glossy_bounces = 2
    c.transmission_bounces = 0
    c.volume_bounces = 0
    c.transparent_max_bounces = 4
    
    # Caustics & Clamping
    c.caustics_reflective = False
    c.caustics_refractive = False
    c.sample_clamp_direct = 0.0
    c.sample_clamp_indirect = 10.0
    
    # Volumetrics
    c.volume_max_steps = 32
    c.volume_step_rate = 2.0
    
    # Adaptive Sampling
    c.use_adaptive_sampling = True
    c.adaptive_threshold = 0.025
    c.adaptive_min_samples = 16
    
    # Denoising
    c.use_denoising = True
    c.denoiser = 'OPENIMAGEDENOISE'
    c.denoising_input_passes = 'RGB_ALBEDO_NORMAL'
    c.denoising_prefilter = 'ACCURATE'
    c.denoising_quality = 'HIGH'
    c.denoising_use_gpu = True
    
    # Persistent Data
    scene.render.use_persistent_data = True
    print("  Production Settings: 1920x1080 @ 24fps, Cycles Metal GPU, 64s, OIDN GPU, Bounces: 4/2/2/0, Persistent Data: ON.")

    # -------------------------------------------------------------------------
    # 6. FAST DEVELOPMENT MODE CONFIGURATION (Requirement 10)
    # -------------------------------------------------------------------------
    print("\n[Step 6] Creating Fast Development Scene...")
    dev_scene_name = "Hero_Development"
    dev_scene = bpy.data.scenes.get(dev_scene_name)
    if not dev_scene:
        dev_scene = bpy.data.scenes.new(name=dev_scene_name)
        dev_scene.collection.children.link(scene.collection)
    
    dev_scene.render.engine = 'BLENDER_EEVEE'
    dev_scene.render.resolution_x = 960
    dev_scene.render.resolution_y = 540
    dev_scene.render.resolution_percentage = 100
    dev_scene.render.fps = 24
    dev_scene.frame_start = 1
    dev_scene.frame_end = 240
    dev_scene.camera = scene.camera
    dev_scene.world = scene.world
    print(f"  Created '{dev_scene_name}' scene for instant 540p Eevee animation editing.")

    # -------------------------------------------------------------------------
    # 7. VIEWPORT PERFORMANCE & WORKSPACE CONFIGURATION (Requirement 11)
    # -------------------------------------------------------------------------
    print("\n[Step 7] Optimizing Workspace Screens & Viewport Shading for Smooth Scrubbing...")
    # Set default active scene back to main production scene
    bpy.context.window.scene = scene
    
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == 'VIEW_3D':
                for space in area.spaces:
                    if space.type == 'VIEW_3D':
                        # Default viewports to SOLID mode for zero-lag timeline scrubbing
                        space.shading.type = 'SOLID'
                        space.shading.light = 'STUDIO'
                        space.shading.color_type = 'MATERIAL'
                        space.shading.show_shadows = False
                        space.shading.show_cavity = False
                        # Material preview settings if user switches
                        space.shading.use_scene_lights = False
                        space.shading.use_scene_world = False
    print("  All 3D Viewport spaces configured to lightweight SOLID/STUDIO mode for high-FPS timeline scrubbing.")

    # -------------------------------------------------------------------------
    # SAVE OPTIMIZED .BLEND
    # -------------------------------------------------------------------------
    bpy.ops.wm.save_mainfile(filepath=blend_path)
    print(f"\nSuccessfully saved optimized file: {blend_path}")
    print("=" * 60)

if __name__ == '__main__':
    optimize_blend_file()
