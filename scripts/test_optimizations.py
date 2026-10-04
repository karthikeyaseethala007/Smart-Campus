import bpy
import time
import os
import numpy as np

def benchmark_variant(name, setup_fn):
    blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
    bpy.ops.wm.open_mainfile(filepath=blend_path)
    
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'GPU'
    
    # Configure Metal GPU
    prefs = bpy.context.preferences
    cprefs = prefs.addons['cycles'].preferences
    cprefs.compute_device_type = 'METAL'
    cprefs.get_devices()
    for d in cprefs.devices:
        if d.type == 'METAL':
            d.use = True
        else:
            d.use = False # GPU only!
            
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100
    scene.cycles.samples = 64
    
    setup_fn(scene)
    
    # Warm up / first render
    os.makedirs("/Users/karthikeya.s/Documents/focus/opt_tests", exist_ok=True)
    out_path = f"/Users/karthikeya.s/Documents/focus/opt_tests/{name}.png"
    scene.render.filepath = out_path
    scene.frame_set(40)
    
    t0 = time.perf_counter()
    bpy.ops.render.render(write_still=True)
    render_time = time.perf_counter() - t0
    
    print(f"Variant [{name}]: Render time = {render_time:.2f} s")
    return render_time, out_path

def test_all():
    results = {}
    
    # 0. Baseline setup (1080p, Metal GPU only, original settings)
    def v0_baseline(scene):
        pass
    t0, p0 = benchmark_variant("v0_baseline", v0_baseline)
    results["Baseline"] = t0
    
    # 1. Bounces optimized (max=4, diff=2, gloss=2, trans=0, transparent=4, caustics=off)
    def v1_bounces(scene):
        c = scene.cycles
        c.max_bounces = 4
        c.diffuse_bounces = 2
        c.glossy_bounces = 2
        c.transmission_bounces = 0
        c.transparent_max_bounces = 4
        c.caustics_reflective = False
        c.caustics_refractive = False
    t1, p1 = benchmark_variant("v1_bounces", v1_bounces)
    results["Bounces"] = t1
    
    # 2. Denoising on GPU + Bounces
    def v2_gpu_denoise(scene):
        v1_bounces(scene)
        scene.cycles.denoising_use_gpu = True
    t2, p2 = benchmark_variant("v2_gpu_denoise", v2_gpu_denoise)
    results["GPU_Denoise"] = t2
    
    # 3. Core light shadow disabled + v2
    def v3_core_light_shadow(scene):
        v2_gpu_denoise(scene)
        cl = bpy.data.lights.get("Core_Light")
        if cl:
            cl.use_shadow = False
    t3, p3 = benchmark_variant("v3_core_light_shadow", v3_core_light_shadow)
    results["Core_Light_NoShadow"] = t3
    
    # 4. Volumetric optimization (M_Inner_Aura surface falloff or cheap volume)
    def v4_volumetric(scene):
        v3_core_light_shadow(scene)
        # Convert M_Inner_Aura to surface falloff emission
        mat = bpy.data.materials.get("M_Inner_Aura")
        if mat and mat.node_tree:
            nodes = mat.node_tree.nodes
            links = mat.node_tree.links
            out_node = nodes.get("Material Output")
            em_node = nodes.get("Emission")
            if out_node and em_node:
                # Link emission to surface instead of volume!
                # And use facing / layer weight for smooth inner glow
                for l in list(out_node.inputs['Volume'].links):
                    links.remove(l)
                # create transparent BSDF + Add Shader or Mix Shader
                # so the sphere itself has facing glow and soft edge
                lw = nodes.new(type='ShaderNodeLayerWeight')
                lw.inputs['Blend'].default_value = 0.2
                mix = nodes.new(type='ShaderNodeMixShader')
                trans = nodes.new(type='ShaderNodeBsdfTransparent')
                links.new(lw.outputs['Facing'], mix.inputs['Fac'])
                links.new(trans.outputs['BSDF'], mix.inputs[1])
                links.new(em_node.outputs['Emission'], mix.inputs[2])
                links.new(mix.outputs['Shader'], out_node.inputs['Surface'])
                
    t4, p4 = benchmark_variant("v4_volumetric_surface", v4_volumetric)
    results["Surface_Inner_Glow"] = t4
    
    # 5. Ico Sphere subdivision = 0 (low poly shared instance) + v4
    def v5_lowpoly_instance(scene):
        v4_volumetric(scene)
        tree = bpy.data.node_groups.get("GN_Hero_Particle_System")
        if tree:
            ico = tree.nodes.get("Ico Sphere")
            if ico:
                ico.inputs['Subdivisions'].default_value = 0
    t5, p5 = benchmark_variant("v5_lowpoly_instance", v5_lowpoly_instance)
    results["LowPoly_Instance"] = t5
    
    # 6. Combined with adaptive sampling tuning (adaptive threshold 0.03 instead of 0.01)
    def v6_combined(scene):
        v5_lowpoly_instance(scene)
        scene.cycles.adaptive_threshold = 0.03
    t6, p6 = benchmark_variant("v6_combined", v6_combined)
    results["Combined_Final"] = t6

    print("\n" + "="*50)
    print("OPTIMIZATION BENCHMARK SUMMARY (Frame 40, 1080p, 64 samples):")
    for k, v in results.items():
        print(f"  {k:25s}: {v:.2f} s")
    print("="*50)

if __name__ == '__main__':
    test_all()
