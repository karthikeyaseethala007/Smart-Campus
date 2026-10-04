import bpy

print("=== LOADED FILE ===", bpy.data.filepath)
obj = bpy.data.objects.get("Hero_Particle_System")
if not obj:
    print("Hero_Particle_System not found!")
else:
    print("Mesh:", obj.data.name, "Verts:", len(obj.data.vertices))
    print("\nModifiers:")
    for mod in obj.modifiers:
        print(f"  {mod.name} ({mod.type})")
        if mod.type == 'NODES':
            print(f"    NodeGroup: {mod.node_group.name if mod.node_group else 'None'}")
            if mod.node_group:
                for item in mod.node_group.nodes:
                    print(f"      Node: {item.name} ({item.type})")

    if obj.data.shape_keys:
        print("\nShape Keys:")
        for kb in obj.data.shape_keys.key_blocks:
            print(f"  {kb.name}: val={kb.value:.3f}, mute={kb.mute}")

    print("\nActions in bpy.data.actions:")
    for act in bpy.data.actions:
        print(f"  Action: {act.name}")

    if obj.animation_data:
        print("Obj animation_data action:", obj.animation_data.action.name if obj.animation_data.action else None)
    if obj.data.shape_keys and obj.data.shape_keys.animation_data:
        print("Shape keys animation_data action:", obj.data.shape_keys.animation_data.action.name if obj.data.shape_keys.animation_data.action else None)
