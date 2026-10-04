import bpy

tree = bpy.data.node_groups.get("GN_Hero_Particle_System")
if tree:
    for node in tree.nodes:
        print(f"--- Node: {node.name} ({node.bl_idname}) ---")
        for inp_idx, inp in enumerate(node.inputs):
            val = None
            try:
                val = inp.default_value
                if hasattr(val, '__iter__'):
                    val = list(val)
            except:
                pass
            print(f"  In[{inp_idx}] '{inp.name}' ({inp.bl_idname}): default={val}, linked={inp.is_linked}")
            if inp.links:
                for l in inp.links:
                    print(f"    <- {l.from_node.name}['{l.from_socket.name}']")

# Inspect Materials
for m in bpy.data.materials:
    print(f"\n=== Material: {m.name} ===")
    if m.node_tree:
        for n in m.node_tree.nodes:
            print(f"  Node: {n.name} ({n.bl_idname})")
            for inp in n.inputs:
                if inp.is_linked:
                    for l in inp.links:
                        print(f"    input '{inp.name}' <- {l.from_node.name}['{l.from_socket.name}']")
                else:
                    try:
                        v = inp.default_value
                        if hasattr(v, '__iter__'):
                            v = [round(x, 4) for x in v]
                        elif isinstance(v, float):
                            v = round(v, 4)
                        # only print notable ones
                        if inp.name in ['Base Color', 'Emission Color', 'Emission Strength', 'Roughness', 'Metallic', 'Alpha', 'Transmission Weight', 'IOR']:
                            print(f"    input '{inp.name}' = {v}")
                    except:
                        pass
