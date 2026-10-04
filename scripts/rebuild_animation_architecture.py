import bpy
import numpy as np
import math

def rebuild_architecture():
    print("=" * 80)
    print("REBUILDING BLENDER ANIMATION PERFORMANCE ARCHITECTURE")
    print("=" * 80)
    
    blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
    bpy.ops.wm.open_mainfile(filepath=blend_path)
    
    # -------------------------------------------------------------------------
    # 1. VERIFY BASE MESH AND 3,200 PERSISTENT VERTICES
    # -------------------------------------------------------------------------
    p_obj = bpy.data.objects.get("Hero_Particle_System")
    assert p_obj is not None, "Hero_Particle_System not found!"
    mesh = p_obj.data
    assert len(mesh.vertices) == 3200, f"Expected 3200 vertices, got {len(mesh.vertices)}"
    print(f"[Step 1] Verified exactly 3,200 persistent vertices in {p_obj.name}.")
    
    sk = mesh.shape_keys
    assert sk is not None, "Shape keys missing on Hero_Particle_System!"
    kb = sk.key_blocks
    
    # Ensure all 4 primary base states exist
    for required_state in ['State_Globe', 'State_Electricity', 'State_Fire', 'State_Lock']:
        assert required_state in kb, f"Missing base state: {required_state}"
    print("[Step 1] Verified 4 primary base shapes: Globe, Electricity, Fire, Lock.")

    # -------------------------------------------------------------------------
    # 2. PRECOMPUTE PARTICLE TRAJECTORIES (Intermediate Shape Keys)
    # -------------------------------------------------------------------------
    print("\n[Step 2] Computing deterministic intermediate transition shapes...")
    P_G = np.array([tuple(v.co) for v in kb['State_Globe'].data])
    P_E = np.array([tuple(v.co) for v in kb['State_Electricity'].data])
    P_F = np.array([tuple(v.co) for v in kb['State_Fire'].data])
    P_L = np.array([tuple(v.co) for v in kb['State_Lock'].data])
    
    # A. Globe -> Electricity
    r_G = np.linalg.norm(P_G, axis=1, keepdims=True)
    theta_G = np.arctan2(P_G[:, 1:2], P_G[:, 0:1])
    phi_G = np.arcsin(np.clip(P_G[:, 2:3] / np.maximum(r_G, 1e-6), -1.0, 1.0))
    n_G = P_G / np.maximum(r_G, 1e-6)
    
    # Globe_Pre: Surface harmonic ripple
    delta_r = 0.08 * np.sin(3 * phi_G) * np.cos(2 * theta_G) + 0.04 * np.cos(4 * theta_G)
    P_G_pre = (1 - 0.15) * P_G + 0.15 * P_E + delta_r * n_G
    
    # Globe_Energy: Swirling azimuthal expansion along electromagnetic field lines
    P_base_ge = (1 - 0.45) * P_G + 0.45 * P_E
    z_ge = P_base_ge[:, 2]
    dth_ge = 0.50 * (1.0 - np.clip((z_ge / 2.2)**2, 0, 1))
    boost_ge = 1.0 + 0.22 * np.cos(np.clip(np.pi * z_ge / 4.0, -np.pi/2, np.pi/2))**2
    x_ge = boost_ge * (P_base_ge[:, 0] * np.cos(dth_ge) - P_base_ge[:, 1] * np.sin(dth_ge))
    y_ge = boost_ge * (P_base_ge[:, 0] * np.sin(dth_ge) + P_base_ge[:, 1] * np.cos(dth_ge))
    z_ge = z_ge + 0.08 * np.sin(3 * theta_G[:, 0])
    P_G_energy = np.stack([x_ge, y_ge, z_ge], axis=1)
    
    # Globe_To_Electricity: Arc convergence into lightning
    P_base_gt = (1 - 0.78) * P_G + 0.78 * P_E
    z_gt = P_base_gt[:, 2]
    dth_gt = 0.22 * (1.0 - np.clip((z_gt / 2.2)**2, 0, 1))
    x_gt = P_base_gt[:, 0] * np.cos(dth_gt) - P_base_gt[:, 1] * np.sin(dth_gt)
    y_gt = P_base_gt[:, 0] * np.sin(dth_gt) + P_base_gt[:, 1] * np.cos(dth_gt)
    P_G_to_elec = np.stack([x_gt, y_gt, z_gt], axis=1)
    
    # B. Electricity -> Fire
    # Electricity_PreFire: Thermal softening and upward drift
    P_base_ep = (1 - 0.20) * P_E + 0.20 * P_F
    dz_ep = 0.08 * (1.0 + P_base_ep[:, 2] / 2.0)
    dx_ep = 0.06 * np.sin(3.5 * P_base_ep[:, 2])
    dy_ep = 0.04 * np.cos(2.5 * P_base_ep[:, 2])
    P_E_pre = np.stack([P_base_ep[:, 0] + dx_ep, P_base_ep[:, 1] + dy_ep, P_base_ep[:, 2] + dz_ep], axis=1)
    
    # Electricity_Energy: Buoyant thermal blooming
    P_base_ee = (1 - 0.50) * P_E + 0.50 * P_F
    factor_ee = 1.0 + 0.18 * np.sin(np.clip(np.pi * (P_base_ee[:, 2] + 1.8) / 3.6, 0, np.pi))
    x_ee = P_base_ee[:, 0] * factor_ee + 0.10 * np.sin(2.5 * P_base_ee[:, 2] + 0.5)
    y_ee = P_base_ee[:, 1] * factor_ee
    z_ee = P_base_ee[:, 2] + 0.12 * (1.0 + P_base_ee[:, 2] / 2.0)
    P_E_energy = np.stack([x_ee, y_ee, z_ee], axis=1)
    
    # Electricity_ToFire: Twin flame tongues convergence
    P_base_et = (1 - 0.80) * P_E + 0.80 * P_F
    x_et = P_base_et[:, 0] + 0.04 * np.sin(3.0 * P_base_et[:, 2])
    y_et = P_base_et[:, 1]
    z_et = P_base_et[:, 2] + 0.04
    P_E_to_fire = np.stack([x_et, y_et, z_et], axis=1)
    
    # C. Fire -> Lock
    # Fire_PreLock: Thermal cooling and vertical stabilization
    P_base_fp = (1 - 0.20) * P_F + 0.20 * P_L
    z_damp = P_base_fp[:, 2] - 0.06 * np.maximum(0.0, P_base_fp[:, 2] - 0.8)
    P_F_pre = np.stack([P_base_fp[:, 0], P_base_fp[:, 1], z_damp], axis=1)
    
    # Fire_Energy: Crystallization into tumbler body + arched shackle
    P_base_fe = (1 - 0.52) * P_F + 0.52 * P_L
    is_sh = P_base_fe[:, 2] > 0.1
    x_fe = P_base_fe[:, 0].copy()
    y_fe = P_base_fe[:, 1].copy()
    z_fe = P_base_fe[:, 2].copy()
    z_fe[is_sh] += 0.10 * np.cos(np.clip(np.pi * P_base_fe[is_sh, 0] / 2.0, -np.pi/2, np.pi/2))
    x_fe[~is_sh] *= 0.96
    y_fe[~is_sh] *= 0.96
    P_F_energy = np.stack([x_fe, y_fe, z_fe], axis=1)
    
    # Fire_ToLock: Padlock structure mechanical snap
    P_F_to_lock = (1 - 0.82) * P_F + 0.82 * P_L

    # Assign/Update the shape keys
    target_shapes = [
        ('Globe_Pre', P_G_pre),
        ('Globe_Energy', P_G_energy),
        ('Globe_To_Electricity', P_G_to_elec),
        ('Electricity_PreFire', P_E_pre),
        ('Electricity_Energy', P_E_energy),
        ('Electricity_ToFire', P_E_to_fire),
        ('Fire_PreLock', P_F_pre),
        ('Fire_Energy', P_F_energy),
        ('Fire_ToLock', P_F_to_lock)
    ]
    
    for name, coords in target_shapes:
        if name not in kb:
            sk_new = p_obj.shape_key_add(name=name, from_mix=False)
        else:
            sk_new = kb[name]
        for i in range(3200):
            sk_new.data[i].co = coords[i]
        sk_new.value = 0.0
    print(f"[Step 2] Stored {len(target_shapes)} precomputed intermediate trajectories into shape keys.")

    # -------------------------------------------------------------------------
    # 3. ROTATION & SHAPE KEY ANIMATION ACTIONS
    # -------------------------------------------------------------------------
    print("\n[Step 3] Setting up single object-level Z-rotation & clean F-Curves...")
    # Rotate Hero_Particle_System: 0 -> 2*pi over 240 frames
    p_obj.animation_data_create()
    act_obj = bpy.data.actions.new(name="Hero_Object_RotationAction")
    p_obj.animation_data.action = act_obj
    
    # F-Curve for Z rotation
    fc_rot = act_obj.fcurves.new(data_path="rotation_euler", index=2)
    kp0 = fc_rot.keyframe_points.insert(frame=1.0, value=0.0)
    kp0.interpolation = 'LINEAR'
    kp1 = fc_rot.keyframe_points.insert(frame=240.0, value=2.0 * math.pi)
    kp1.interpolation = 'LINEAR'
    
    # Shape Key F-Curves on Hero_Particle_MeshAction
    sk.animation_data_create()
    act_sk = bpy.data.actions.new(name="Hero_Particle_ShapeKeyAction")
    sk.animation_data.action = act_sk
    
    # Define timing schedule (smooth smoothstep curves)
    # Globe hold: 1..32
    # Globe -> Electricity: 32..80
    # Electricity hold: 80..100
    # Electricity -> Fire: 100..140
    # Fire hold: 140..170
    # Fire -> Lock: 170..210
    # Lock hold: 210..240
    
    schedule = {
        # Base states
        'State_Globe': [(1.0, 1.0), (32.0, 1.0), (45.0, 0.0), (240.0, 0.0)],
        'Globe_Pre': [(1.0, 0.0), (32.0, 0.0), (40.0, 1.0), (48.0, 0.0), (240.0, 0.0)],
        'Globe_Energy': [(1.0, 0.0), (42.0, 0.0), (52.0, 1.0), (62.0, 0.0), (240.0, 0.0)],
        'Globe_To_Electricity': [(1.0, 0.0), (56.0, 0.0), (66.0, 1.0), (76.0, 0.0), (240.0, 0.0)],
        'State_Electricity': [(1.0, 0.0), (68.0, 0.0), (80.0, 1.0), (100.0, 1.0), (112.0, 0.0), (240.0, 0.0)],
        'Electricity_PreFire': [(1.0, 0.0), (100.0, 0.0), (108.0, 1.0), (116.0, 0.0), (240.0, 0.0)],
        'Electricity_Energy': [(1.0, 0.0), (110.0, 0.0), (120.0, 1.0), (128.0, 0.0), (240.0, 0.0)],
        'Electricity_ToFire': [(1.0, 0.0), (122.0, 0.0), (130.0, 1.0), (138.0, 0.0), (240.0, 0.0)],
        'State_Fire': [(1.0, 0.0), (132.0, 0.0), (140.0, 1.0), (170.0, 1.0), (180.0, 0.0), (240.0, 0.0)],
        'Fire_PreLock': [(1.0, 0.0), (170.0, 0.0), (178.0, 1.0), (186.0, 0.0), (240.0, 0.0)],
        'Fire_Energy': [(1.0, 0.0), (180.0, 0.0), (190.0, 1.0), (198.0, 0.0), (240.0, 0.0)],
        'Fire_ToLock': [(1.0, 0.0), (192.0, 0.0), (200.0, 1.0), (208.0, 0.0), (240.0, 0.0)],
        'State_Lock': [(1.0, 0.0), (202.0, 0.0), (210.0, 1.0), (240.0, 1.0)]
    }
    
    # State_Globe is relative Basis, so values represent target weights
    # For Blender shape keys: Basis is index 0. All other keys are relative to Basis.
    # To have smooth blending:
    for sk_name, keyframes in schedule.items():
        if sk_name in kb:
            # In Blender, Basis is always 0 value
            if sk_name == kb[0].name:
                continue
            data_path = f'key_blocks["{sk_name}"].value'
            fc = act_sk.fcurves.new(data_path=data_path, index=0)
            for f, v in keyframes:
                kp = fc.keyframe_points.insert(frame=f, value=v)
                kp.interpolation = 'BEZIER'
                kp.handle_left_type = 'AUTO_CLAMPED'
                kp.handle_right_type = 'AUTO_CLAMPED'

    print("[Step 3] Configured clean, smooth Bezier interpolation curves for all states.")

    # -------------------------------------------------------------------------
    # 4. GEOMETRY NODES: DUAL-MODE (FAST VIEWPORT VS PRODUCTION RENDER)
    # -------------------------------------------------------------------------
    print("\n[Step 4] Configuring Geometry Nodes Dual-Mode Architecture...")
    tree = bpy.data.node_groups.get("GN_Hero_Particle_System")
    if not tree:
        tree = bpy.data.node_groups.new(name="GN_Hero_Particle_System", type='GeometryNodeTree')
    
    # Clear and rebuild clean GN tree
    tree.nodes.clear()
    
    # Node 1: Group Input
    n_in = tree.nodes.new(type='NodeGroupInput')
    n_in.location = (-400, 0)
    
    # Node 2: Group Output
    n_out = tree.nodes.new(type='NodeGroupOutput')
    n_out.location = (600, 0)
    
    # Node 3: Is Viewport
    n_is_vp = tree.nodes.new(type='GeometryNodeIsViewport')
    n_is_vp.location = (-200, 200)
    
    # Node 4: Switch Node
    n_switch = tree.nodes.new(type='GeometryNodeSwitch')
    n_switch.input_type = 'GEOMETRY'
    n_switch.location = (400, 0)
    
    # Branch A: Viewport Branch (Raw Points / Instant Display)
    # Output the deformed points directly - Zero instancing overhead in Viewport!
    
    # Branch B: Render Branch (Crisp Icospheres with Radius 0.024)
    n_ico = tree.nodes.new(type='GeometryNodeMeshIcoSphere')
    n_ico.inputs['Radius'].default_value = 0.024 # Crisp, readable particle size
    n_ico.inputs['Subdivisions'].default_value = 0 # 12 verts, 20 tris per particle (fast & smooth)
    n_ico.location = (-100, -200)
    
    n_inst = tree.nodes.new(type='GeometryNodeInstanceOnPoints')
    n_inst.location = (150, -100)
    
    tree.links.new(n_in.outputs[0], n_inst.inputs['Points'])
    tree.links.new(n_ico.outputs['Mesh'], n_inst.inputs['Instance'])
    
    # Set Material on instances
    n_mat = tree.nodes.new(type='GeometryNodeSetMaterial')
    n_mat.location = (300, -100)
    p_mat = bpy.data.materials.get("M_Hero_Particle")
    n_mat.inputs['Material'].default_value = p_mat
    tree.links.new(n_inst.outputs['Instances'], n_mat.inputs['Geometry'])
    
    # Wire switch: True -> Viewport (Group Input raw points), False -> Render (Set Material)
    tree.links.new(n_is_vp.outputs['Is Viewport'], n_switch.inputs['Switch'])
    tree.links.new(n_in.outputs[0], n_switch.inputs['True'])
    tree.links.new(n_mat.outputs['Geometry'], n_switch.inputs['False'])
    
    tree.links.new(n_switch.outputs['Output'], n_out.inputs[0])
    print("[Step 4] Geometry Nodes dual-mode configured: Viewport uses zero-instancing raw points, Render uses 0.024-radius instanced particles.")

    # -------------------------------------------------------------------------
    # 5. MATERIAL & LIGHTING VISUAL FIX (HIGH CONTRAST & READABILITY)
    # -------------------------------------------------------------------------
    print("\n[Step 5] Upgrading Materials, Shaders, Lighting & Contrast...")
    # Particle Material: Warm White, Crisp Core Emission + Light Surface
    if p_mat:
        p_mat.use_nodes = True
        nodes = p_mat.node_tree.nodes
        nodes.clear()
        
        n_out = nodes.new(type='ShaderNodeOutputMaterial')
        n_out.location = (400, 0)
        
        # Principled BSDF with crisp warm white emission & high specular pop
        n_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
        n_bsdf.location = (100, 0)
        n_bsdf.inputs['Base Color'].default_value = (1.0, 0.98, 0.95, 1.0)
        n_bsdf.inputs['Roughness'].default_value = 0.1
        n_bsdf.inputs['Emission Color'].default_value = (1.0, 0.96, 0.90, 1.0) # Warm white
        n_bsdf.inputs['Emission Strength'].default_value = 8.5 # High readable luminosity
        
        p_mat.node_tree.links.new(n_bsdf.outputs['BSDF'], n_out.inputs['Surface'])
    
    # Inner Aura Material: Soft Amber/Peach Energy Core
    aura_mat = bpy.data.materials.get("M_Inner_Aura")
    if aura_mat:
        aura_mat.use_nodes = True
        nodes = aura_mat.node_tree.nodes
        nodes.clear()
        
        n_out = nodes.new(type='ShaderNodeOutputMaterial')
        n_out.location = (400, 0)
        
        n_fresnel = nodes.new(type='ShaderNodeFresnel')
        n_fresnel.location = (-200, 100)
        n_fresnel.inputs['IOR'].default_value = 1.2
        
        n_emit = nodes.new(type='ShaderNodeEmission')
        n_emit.location = (0, 100)
        n_emit.inputs['Color'].default_value = (1.0, 0.45, 0.12, 1.0) # Radiant amber/orange
        n_emit.inputs['Strength'].default_value = 2.8
        
        n_trans = nodes.new(type='ShaderNodeBsdfTransparent')
        n_trans.location = (0, -100)
        
        n_mix = nodes.new(type='ShaderNodeMixShader')
        n_mix.location = (200, 0)
        
        aura_mat.node_tree.links.new(n_fresnel.outputs['Fac'], n_mix.inputs['Fac'])
        aura_mat.node_tree.links.new(n_emit.outputs['Emission'], n_mix.inputs[1])
        aura_mat.node_tree.links.new(n_trans.outputs['BSDF'], n_mix.inputs[2])
        aura_mat.node_tree.links.new(n_mix.outputs['Shader'], n_out.inputs['Surface'])

    # Floor & Ground Shadow
    floor_mat = bpy.data.materials.get("M_Studio_Floor")
    if floor_mat:
        floor_mat.use_nodes = True
        nodes = floor_mat.node_tree.nodes
        bsdf = [n for n in nodes if n.type == 'BSDF_PRINCIPLED']
        if bsdf:
            bsdf[0].inputs['Base Color'].default_value = (0.94, 0.94, 0.95, 1.0)
            bsdf[0].inputs['Roughness'].default_value = 0.8
            
    # Soft Ground Shadow: Crisp, realistic contact shadow
    shadow_obj = bpy.data.objects.get("Floating_Ground_Shadow")
    if shadow_obj:
        shadow_obj.location = (0.0, 0.0, -3.18)
        shadow_obj.scale = (2.2, 2.2, 1.0)
        
    shadow_mat = bpy.data.materials.get("M_Floating_Ground_Shadow")
    if shadow_mat:
        shadow_mat.use_nodes = True
        nodes = shadow_mat.node_tree.nodes
        bsdf = [n for n in nodes if n.type == 'BSDF_PRINCIPLED']
        if bsdf:
            bsdf[0].inputs['Base Color'].default_value = (0.25, 0.25, 0.28, 1.0)
            bsdf[0].inputs['Roughness'].default_value = 1.0
            
    # Lighting Optimization: Minimal, balanced lighting that preserves particle contrast
    l_key = bpy.data.lights.get("Key_Light")
    if l_key:
        l_key.energy = 160.0 # Down from 400W so particles pop
        l_key.color = (1.0, 0.98, 0.95)
        l_key.use_shadow = True
        
    l_fill = bpy.data.lights.get("Fill_Light")
    if l_fill:
        l_fill.energy = 50.0 # Down from 120W
        l_fill.use_shadow = False
        
    l_rim = bpy.data.lights.get("Rim_Light")
    if l_rim:
        l_rim.energy = 80.0 # Down from 350W
        l_rim.use_shadow = False
        
    l_core = bpy.data.lights.get("Core_Light")
    if l_core:
        l_core.energy = 45.0
        l_core.color = (1.0, 0.50, 0.15)
        l_core.use_shadow = False

    # -------------------------------------------------------------------------
    # 6. CONFIGURE TWO SEPARATE SCENES
    # -------------------------------------------------------------------------
    print("\n[Step 6] Configuring Animation Development & Production Render Scenes...")
    
    # Scene A: Animation_Development (Eevee / Workbench, High Performance)
    sc_dev = bpy.data.scenes.get("Animation_Development") or bpy.data.scenes.get("Hero_Development")
    if not sc_dev:
        sc_dev = bpy.data.scenes.new("Animation_Development")
    sc_dev.name = "Animation_Development"
    sc_dev.render.engine = 'BLENDER_EEVEE'
    sc_dev.eevee.taa_render_samples = 16
    sc_dev.render.resolution_x = 960
    sc_dev.render.resolution_y = 540
    sc_dev.render.resolution_percentage = 100
    sc_dev.render.fps = 24
    sc_dev.frame_start = 1
    sc_dev.frame_end = 240
    
    # Color Management: Filmic / Medium High Contrast for crisp punchy whites
    sc_dev.view_settings.view_transform = 'Filmic'
    sc_dev.view_settings.look = 'Medium High Contrast'
    sc_dev.view_settings.exposure = 0.0
    
    # Scene B: Production_Render (Cycles, Apple Metal GPU, 1080p)
    sc_prod = bpy.data.scenes.get("Production_Render") or bpy.data.scenes.get("Scene")
    if not sc_prod:
        sc_prod = bpy.data.scenes.new("Production_Render")
    sc_prod.name = "Production_Render"
    sc_prod.render.engine = 'CYCLES'
    sc_prod.cycles.device = 'GPU'
    sc_prod.render.resolution_x = 1920
    sc_prod.render.resolution_y = 1080
    sc_prod.render.resolution_percentage = 100
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
    
    # Set default scene on file open to Animation_Development!
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
    bpy.ops.wm.save_mainfile(filepath=blend_path)
    print(f"\n[Step 7] Rebuilt architecture saved to: {blend_path}")
    print("=" * 80)

if __name__ == '__main__':
    rebuild_architecture()
