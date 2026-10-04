import bpy

bpy.ops.wm.open_mainfile(filepath="/Users/karthikeya.s/Documents/focus/Untitled(1).blend1")
scene = bpy.context.scene

print("--- LIGHTS ---")
for obj in bpy.data.objects:
    if obj.type == 'LIGHT':
        light = obj.data
        print(f"Light: {obj.name} ({light.type})")
        print(f"  color: {list(light.color)}, energy: {light.energy}")
        if hasattr(light, 'size'):
            print(f"  size: {light.size}")

print("\n--- WORLD ---")
if scene.world:
    print(f"World: {scene.world.name}")
    if scene.world.node_tree:
        for node in scene.world.node_tree.nodes:
            print(f"  World node: {node.name} ({node.type})")
            if node.type == 'BACKGROUND':
                print(f"    Color: {list(node.inputs['Color'].default_value)}, Strength: {node.inputs['Strength'].default_value}")

print("\n--- HERO MATERIAL MIX NODES ---")
mat = bpy.data.materials.get("M_Hero_Particle")
if mat and mat.node_tree:
    for n in mat.node_tree.nodes:
        if n.type == 'MIX':
            print(f"Mix Node: {n.name}")
            for inp in n.inputs:
                print(f"  inp: {inp.name} = {inp.default_value if hasattr(inp, 'default_value') else 'linked'}")
        if n.type == 'MAP_RANGE':
            print(f"Map Range Node: {n.name}")
            for inp in n.inputs:
                print(f"  inp: {inp.name} = {inp.default_value if hasattr(inp, 'default_value') else 'linked'}")

