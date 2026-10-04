import bpy

bpy.ops.wm.open_mainfile(filepath="/Users/karthikeya.s/Documents/focus/Untitled(1).blend1")
hero = bpy.data.objects.get("Hero_Particle_System")
ng = hero.modifiers["GN_Hero_Particles"].node_group
for l in ng.links:
    print(f"{l.from_node.name}.{l.from_socket.name} -> {l.to_node.name}.{l.to_socket.name}")
for n in ng.nodes:
    if n.type == 'MESH_PRIMITIVE_ICO_SPHERE':
        for inp in n.inputs:
            print(f"  Ico Sphere {inp.name} = {inp.default_value if hasattr(inp, 'default_value') else None}")
