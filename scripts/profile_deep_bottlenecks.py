import bpy
import time
import numpy as np

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
print(f"Loading {blend_path} for deep architectural profiling...")
bpy.ops.wm.open_mainfile(filepath=blend_path)

print("\n" + "="*80)
print("1. SCENE OBJECTS & MODIFIERS AUDIT")
print("="*80)
for obj in bpy.data.objects:
    mods = [f"{m.name} ({m.type}, show_viewport={m.show_viewport}, show_render={m.show_render})" for m in obj.modifiers]
    print(f"Object: {obj.name:<25} | Type: {obj.type:<8} | Mods: {mods}")
    if obj.type == 'MESH':
        sk = obj.data.shape_keys
        sk_info = f"ShapeKeys: {len(sk.key_blocks)}" if sk else "No ShapeKeys"
        print(f"  -> Mesh: {obj.data.name}, Verts: {len(obj.data.vertices)}, {sk_info}")

print("\n" + "="*80)
print("2. HANDLERS, DRIVERS & SIMULATIONS AUDIT")
print("="*80)
print("Frame change pre handlers :", [getattr(h, '__name__', str(h)) for h in bpy.app.handlers.frame_change_pre])
print("Frame change post handlers:", [getattr(h, '__name__', str(h)) for h in bpy.app.handlers.frame_change_post])
print("Render pre handlers       :", [getattr(h, '__name__', str(h)) for h in bpy.app.handlers.render_pre])
print("Render post handlers      :", [getattr(h, '__name__', str(h)) for h in bpy.app.handlers.render_post])

drivers_found = []
for obj in bpy.data.objects:
    if obj.animation_data and obj.animation_data.drivers:
        for d in obj.animation_data.drivers:
            drivers_found.append(f"{obj.name} -> {d.data_path}")
    if obj.data and hasattr(obj.data, 'shape_keys') and obj.data.shape_keys:
        sk = obj.data.shape_keys
        if sk.animation_data and sk.animation_data.drivers:
            for d in sk.animation_data.drivers:
                drivers_found.append(f"{sk.name} -> {d.data_path}")
print(f"Drivers found ({len(drivers_found)}):", drivers_found)

print("\n" + "="*80)
print("3. GEOMETRY NODES AUDIT")
print("="*80)
for ng in bpy.data.node_groups:
    if ng.type == 'GEOMETRY':
        print(f"Geometry Node Group: {ng.name} ({len(ng.nodes)} nodes)")
        for n in ng.nodes:
            print(f"   Node: {n.name:<30} ({n.type})")

print("\n" + "="*80)
print("4. MATERIALS & SHADER AUDIT")
print("="*80)
for mat in bpy.data.materials:
    print(f"Material: {mat.name} (use_nodes={mat.use_nodes})")
    if mat.use_nodes:
        for n in mat.node_tree.nodes:
            if n.type in ['BSDF_PRINCIPLED', 'EMISSION', 'VOLUME_SCATTER', 'VOLUME_ABSORPTION', 'MIX_SHADER']:
                print(f"   Node: {n.name} ({n.type})")
                for inp in n.inputs:
                    if inp.is_linked:
                        from_node = inp.links[0].from_node.name
                        print(f"      {inp.name} <- {from_node}")
                    elif inp.default_value is not None:
                        val = inp.default_value
                        if hasattr(val, '__iter__'):
                            val = [round(x, 3) for x in val]
                        elif isinstance(val, float):
                            val = round(val, 3)
                        print(f"      {inp.name} = {val}")

print("\n" + "="*80)
print("5. LIGHTING, WORLD & COLOR MANAGEMENT AUDIT")
print("="*80)
for scene in bpy.data.scenes:
    print(f"Scene: {scene.name}")
    print(f"  Render Engine: {scene.render.engine}")
    print(f"  View Transform: {scene.view_settings.view_transform}, Look: {scene.view_settings.look}, Exposure: {scene.view_settings.exposure}")
    if scene.world:
        print(f"  World: {scene.world.name}")
        if scene.world.use_nodes:
            for n in scene.world.node_tree.nodes:
                if n.type == 'BACKGROUND':
                    print(f"    World Background: Color={list(round(x, 3) for x in n.inputs['Color'].default_value)}, Strength={n.inputs['Strength'].default_value:.3f}")

for l in bpy.data.lights:
    print(f"Light: {l.name} | Type: {l.type} | Energy: {l.energy} | Color: {[round(x, 3) for x in l.color]} | Cast Shadow: {l.use_shadow}")

print("\n" + "="*80)
print("6. FRAME EVALUATION TIME BENCHMARK (SCRUBBING 240 FRAMES)")
print("="*80)
scene = bpy.context.scene
t0 = time.perf_counter()
for f in range(1, 241):
    scene.frame_set(f)
    depsgraph = bpy.context.evaluated_depsgraph_get()
t1 = time.perf_counter()
total_eval_time = t1 - t0
eval_fps = 240.0 / total_eval_time
eval_ms = (total_eval_time / 240.0) * 1000.0
print(f"Total frame evaluation time across 240 frames: {total_eval_time:.3f} s")
print(f"Frame evaluation rate: {eval_fps:.1f} FPS ({eval_ms:.2f} ms/frame)")

print("\n" + "="*80)
print("7. DETAILED COMPONENT TIMING (100 ITERATIONS AT FRAME 120)")
print("="*80)
scene.frame_set(120)
# Measure depsgraph eval
t0 = time.perf_counter()
for _ in range(100):
    scene.frame_set(120)
    dg = bpy.context.evaluated_depsgraph_get()
t_dg = (time.perf_counter() - t0) / 100.0 * 1000.0
print(f"Average frame 120 depsgraph update: {t_dg:.2f} ms")

p_obj = bpy.data.objects.get('Hero_Particle_System')
if p_obj:
    gn_mod = [m for m in p_obj.modifiers if m.type == 'NODES']
    if gn_mod:
        m = gn_mod[0]
        # measure with GN enabled
        m.show_viewport = True
        t0 = time.perf_counter()
        for _ in range(50):
            scene.frame_set(120)
            dg = bpy.context.evaluated_depsgraph_get()
        t_with_gn = (time.perf_counter() - t0) / 50.0 * 1000.0
        
        # measure with GN disabled
        m.show_viewport = False
        t0 = time.perf_counter()
        for _ in range(50):
            scene.frame_set(120)
            dg = bpy.context.evaluated_depsgraph_get()
        t_without_gn = (time.perf_counter() - t0) / 50.0 * 1000.0
        m.show_viewport = True
        print(f"Time WITH Geometry Nodes:    {t_with_gn:.2f} ms")
        print(f"Time WITHOUT Geometry Nodes: {t_without_gn:.2f} ms")
        print(f"Geometry Nodes overhead:     {t_with_gn - t_without_gn:.2f} ms")
