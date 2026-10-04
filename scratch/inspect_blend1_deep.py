import bpy

print("=" * 60)
print("DEEP INSPECTION OF Untitled(1).blend1")
print("=" * 60)

scene = bpy.context.scene

print("\n--- OBJECT VISIBILITY & RENDER STATUS ---")
for obj in bpy.data.objects:
    print(f"Object: '{obj.name}'")
    print(f"  hide_viewport: {obj.hide_viewport}, hide_render: {obj.hide_render}, hide_get(): {obj.hide_get()}")
    if obj.material_slots:
        for slot in obj.material_slots:
            print(f"  Material slot: {slot.name} -> {slot.material.name if slot.material else 'None'}")
    if obj.modifiers:
        for m in obj.modifiers:
            print(f"  Modifier: {m.name} ({m.type}), show_render={m.show_render}, show_viewport={m.show_viewport}")
            if m.type == 'NODES' and m.node_group:
                print(f"    Node Group: {m.node_group.name}")
                for inp in m.node_group.inputs if hasattr(m.node_group, 'inputs') else []:
                    print(f"      Input: {inp.name} (identifier: {inp.identifier})")

print("\n--- SHAPE KEYS ON HERO PARTICLE SYSTEM ---")
hero = bpy.data.objects.get("Hero_Particle_System")
if hero and hero.data and hero.data.shape_keys:
    kb = hero.data.shape_keys.key_blocks
    print(f"Shape key animation data: {hero.data.shape_keys.animation_data}")
    if hero.data.shape_keys.animation_data and hero.data.shape_keys.animation_data.action:
        act = hero.data.shape_keys.animation_data.action
        print(f"Shape keys action: {act.name}")

print("\n--- ACTION DETAILS ---")
for act in bpy.data.actions:
    print(f"Action: {act.name}, dir: {[a for a in dir(act) if not a.startswith('__')]}")
    # In Blender 5+, check curves / layers / fcurves / bindings
    if hasattr(act, 'fcurves'):
        for fc in act.fcurves:
            print(f"  fcurve: {fc.data_path}[{fc.array_index}]")
            # print first and last keyframe
            if len(fc.keyframe_points) > 0:
                print(f"    first: f{fc.keyframe_points[0].co[0]}={fc.keyframe_points[0].co[1]}, last: f{fc.keyframe_points[-1].co[0]}={fc.keyframe_points[-1].co[1]}")
    elif hasattr(act, 'layers'):
        for layer in act.layers:
            print(f"  Layer: {layer.name}")
            for strip in layer.strips:
                print(f"    Strip: {strip.name}")
                if hasattr(strip, 'channel_bags'):
                    for cb in strip.channel_bags:
                        for fc in cb.fcurves:
                            print(f"      fcurve: {fc.data_path}[{fc.array_index}], points={len(fc.keyframe_points)}")
                            if len(fc.keyframe_points) > 0:
                                print(f"        first: f{fc.keyframe_points[0].co[0]}={fc.keyframe_points[0].co[1]}, last: f{fc.keyframe_points[-1].co[0]}={fc.keyframe_points[-1].co[1]}")

print("\n--- EVALUATING KEYFRAMES AT SELECT FRAMES ---")
# Check frame 1, 60, 100, 150, 200, 240
for f in [1, 30, 60, 90, 120, 150, 180, 210, 240]:
    scene.frame_set(f)
    print(f"\nFrame {f}:")
    if hero and hero.data and hero.data.shape_keys:
        for kb in hero.data.shape_keys.key_blocks:
            if kb.value > 0.001:
                print(f"  ShapeKey {kb.name}: {kb.value:.3f}")
    if hero:
        print(f"  Hero rotation: {hero.rotation_euler}")

print("\n--- WORLD & RENDER SETTINGS ---")
print(f"World: {scene.world.name if scene.world else None}")
if scene.world and scene.world.node_tree:
    for node in scene.world.node_tree.nodes:
        print(f"  World node: {node.name} ({node.type})")
print(f"Render engine: {scene.render.engine}")
print(f"Film transparent: {scene.render.film_transparent}")
print(f"EEVEE settings:")
eevee = scene.eevee
for prop in dir(eevee):
    if not prop.startswith('_') and not callable(getattr(eevee, prop)):
        try:
            print(f"  {prop}: {getattr(eevee, prop)}")
        except:
            pass

print("=" * 60)
