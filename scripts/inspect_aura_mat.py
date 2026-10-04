import bpy

mat = bpy.data.materials.get("M_Inner_Aura")
if mat and mat.node_tree:
    print("=== M_Inner_Aura NODES ===")
    for n in mat.node_tree.nodes:
        print(f"Node: {n.name} ({n.type})")
        for i in n.inputs:
            if i.is_linked:
                for l in i.links:
                    print(f"  {i.name} <- {l.from_node.name}.{l.from_socket.name}")
            else:
                try:
                    print(f"  {i.name} = {i.default_value}")
                except:
                    pass
        for o in n.outputs:
            if o.is_linked:
                for l in o.links:
                    print(f"  -> {l.to_node.name}.{l.to_socket.name}")
