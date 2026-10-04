import bpy

bpy.ops.wm.open_mainfile(filepath="/Users/karthikeya.s/Documents/focus/Untitled(1).blend1")
hero = bpy.data.objects.get("Hero_Particle_System")

print("Hero Particle Modifiers:")
for m in hero.modifiers:
    print(f"Modifier: {m.name} ({m.type})")
    if m.type == 'NODES' and m.node_group:
        ng = m.node_group
        print(f"  Node group: {ng.name}")
        for n in ng.nodes:
            print(f"    Node: {n.name} ({n.type})")

print("\nHero Material M_Hero_Particle:")
mat = bpy.data.materials.get("M_Hero_Particle")
if mat and mat.node_tree:
    for n in mat.node_tree.nodes:
        print(f"  Mat Node: {n.name} ({n.type})")
        for inp in n.inputs:
            if inp.is_linked:
                for l in inp.links:
                    print(f"    {n.name}.{inp.name} <- {l.from_node.name}.{l.from_socket.name}")
            elif hasattr(inp, 'default_value'):
                if n.type in ['BSDF_PRINCIPLED', 'EMISSION']:
                    print(f"    {n.name}.{inp.name} = {inp.default_value}")

