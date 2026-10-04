import bpy

scene = bpy.context.scene
floor = bpy.data.objects.get("Studio_Floor")
if floor:
    print(f"Studio_Floor: is_shadow_catcher={floor.is_shadow_catcher}, visible={floor.visible_get()}")
    mat = bpy.data.materials.get("M_Studio_Floor")
    if mat and mat.node_tree:
        for node in mat.node_tree.nodes:
            print(f"  Floor Node: {node.name} ({node.type})")
            for inp in node.inputs:
                if inp.is_linked:
                    for link in inp.links:
                        print(f"    {inp.name} <- {link.from_node.name}.{link.from_socket.name}")
                elif hasattr(inp, 'default_value'):
                    if node.type == 'BSDF_PRINCIPLED' and inp.name in ['Base Color', 'Alpha', 'Transmission Weight', 'Roughness']:
                        print(f"    {inp.name} = {inp.default_value}")

hero = bpy.data.objects.get("Hero_Particle_System")
print("\nHero particle system mesh info:")
print(f"Vertices: {len(hero.data.vertices)}")

print("\nEvaluating shape keys across frames 1 to 240:")
for f in range(1, 241, 10):
    scene.frame_set(f)
    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_hero = hero.evaluated_get(depsgraph)
    active_keys = []
    if eval_hero.data.shape_keys:
        for kb in eval_hero.data.shape_keys.key_blocks:
            if kb.value > 0.01:
                active_keys.append(f"{kb.name}: {kb.value:.2f}")
    print(f"Frame {f:3d}: keys=[{', '.join(active_keys)}], rot_z={eval_hero.rotation_euler.z:.2f}")

