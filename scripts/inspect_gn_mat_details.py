import bpy

tree = bpy.data.node_groups.get("GN_Hero_Particle_System")
if tree:
    for n in tree.nodes:
        print(f"Node: {n.name} ({n.type})")
        for inp in n.inputs:
            if inp.is_linked:
                print(f"  {inp.name} <- {inp.links[0].from_node.name}.{inp.links[0].from_socket.name}")
            elif hasattr(inp, 'default_value') and inp.default_value is not None:
                val = inp.default_value
                if hasattr(val, '__iter__'):
                    val = [round(x, 4) for x in val]
                elif isinstance(val, float):
                    val = round(val, 4)
                print(f"  {inp.name} = {val}")

p_mat = bpy.data.materials.get("M_Hero_Particle")
if p_mat and p_mat.use_nodes:
    print("\nParticle Material Nodes:")
    for n in p_mat.node_tree.nodes:
        print(f"  Node: {n.name} ({n.type})")
        for inp in n.inputs:
            if inp.is_linked:
                print(f"    {inp.name} <- {inp.links[0].from_node.name}")
            elif hasattr(inp, 'default_value') and inp.default_value is not None:
                val = inp.default_value
                if hasattr(val, '__iter__'):
                    val = [round(x, 4) for x in val]
                elif isinstance(val, float):
                    val = round(val, 4)
                print(f"    {inp.name} = {val}")

aura_obj = bpy.data.objects.get("Globe_Inner_Aura")
if aura_obj:
    print(f"\nGlobe_Inner_Aura: visible={aura_obj.visible_get()}, hide_render={aura_obj.hide_render}, hide_viewport={aura_obj.hide_viewport}")
    print(f"Scale: {aura_obj.scale}, Location: {aura_obj.location}")
