import bpy

def inspect_details():
    obj = bpy.data.objects.get("Hero_Particle_System")
    if obj:
        print("\n=== HERO PARTICLE SYSTEM ===")
        for mod in obj.modifiers:
            print(f"Modifier: {mod.name}, type: {mod.type}")
            if mod.type == 'NODES':
                tree = mod.node_group
                if tree:
                    print(f"Node Tree: {tree.name}")
                    for node in tree.nodes:
                        print(f"  Node: {node.name} ({node.type})")
                        # print inputs/outputs
                        for inp in node.inputs:
                            if inp.links:
                                for l in inp.links:
                                    print(f"    input '{inp.name}' <- {l.from_node.name}.'{l.from_socket.name}'")
                        if node.type == 'OBJECT_INFO':
                            print(f"    Object: {node.inputs['Object'].default_value}")
                        if node.type == 'COLLECTION_INFO':
                            print(f"    Collection: {node.inputs['Collection'].default_value}")
                        if 'Mesh' in node.type or 'SPHERE' in node.type or 'CYLINDER' in node.type or 'CUBE' in node.type or 'INSTANCE' in node.type:
                            print(f"    Geometry/Mesh settings: {node.name}")
                            for prop in dir(node):
                                if not prop.startswith("_") and prop in ['segments', 'rings', 'radius', 'vertices']:
                                    try:
                                        print(f"      {prop}: {getattr(node, prop)}")
                                    except:
                                        pass
    
    # Check shape keys and animation
    mesh = obj.data if obj else None
    if mesh and mesh.shape_keys:
        sk = mesh.shape_keys
        print("\n=== SHAPE KEYS & ANIMATION ===")
        print(f"Shape key animation data: {sk.animation_data}")
        if sk.animation_data and sk.animation_data.action:
            act = sk.animation_data.action
            print(f"Action: {act.name}")
            # Blender 5.x / 4.4 slotted action inspection
            if hasattr(act, 'fcurves'):
                for fc in act.fcurves:
                    print(f"  FCurve: {fc.data_path} [{fc.array_index}], keys: {len(fc.keyframe_points)}")
            elif hasattr(act, 'layers'):
                for layer in act.layers:
                    print(f"  Layer: {layer.name}")
                    for strip in layer.strips:
                        print(f"    Strip: {strip.name}")
                        for channel_bag in strip.channel_bags:
                            for fc in channel_bag.fcurves:
                                print(f"      FCurve: {fc.data_path} [{fc.array_index}], keys: {len(fc.keyframe_points)}")

    if obj.animation_data and obj.animation_data.action:
        act = obj.animation_data.action
        print(f"\nObject Action: {act.name}")
        if hasattr(act, 'fcurves'):
            for fc in act.fcurves:
                print(f"  FCurve: {fc.data_path} [{fc.array_index}], keys: {len(fc.keyframe_points)}")
        elif hasattr(act, 'layers'):
            for layer in act.layers:
                for strip in layer.strips:
                    for channel_bag in strip.channel_bags:
                        for fc in channel_bag.fcurves:
                            print(f"      FCurve: {fc.data_path} [{fc.array_index}], keys: {len(fc.keyframe_points)}")

    # Check Globe_Inner_Aura and other objects
    aura = bpy.data.objects.get("Globe_Inner_Aura")
    if aura:
        print(f"\nGlobe_Inner_Aura: visible={aura.visible_get()}, anim={aura.animation_data is not None}")
        if aura.animation_data and aura.animation_data.action:
            print(f"Aura action: {aura.animation_data.action.name}")

if __name__ == '__main__':
    inspect_details()
