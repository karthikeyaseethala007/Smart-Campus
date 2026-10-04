import bpy

bpy.ops.wm.open_mainfile(filepath="/Users/karthikeya.s/Documents/focus/Untitled(1).blend1")
mat = bpy.data.materials.get("M_Hero_Particle")
mix = mat.node_tree.nodes.get("Mix")
if mix:
    for inp in mix.inputs:
        if inp.type == 'RGBA':
            print(f"Mix input RGBA: {inp.name} = {list(inp.default_value)}")
