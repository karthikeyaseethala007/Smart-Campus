import bpy

print("\n=== LIGHTS INSPECTION ===")
for l in bpy.data.lights:
    print(f"Light {l.name}: type={l.type}, color={l.color[:]}, energy={l.energy}")

print("\n=== MATERIALS INSPECTION ===")
for mat in ['M_Hero_Particle', 'M_Inner_Aura', 'M_Floating_Ground_Shadow']:
    if mat in bpy.data.materials:
        m = bpy.data.materials[mat]
        print(f"\nMaterial {m.name}: use_nodes={m.use_nodes}")
        if m.node_tree:
            for n in m.node_tree.nodes:
                print(f"  Node: {n.name} ({n.type})")
                if n.type == 'EMISSION':
                    print(f"    Emission color: {n.inputs['Color'].default_value[:]}, strength: {n.inputs['Strength'].default_value}")
                elif n.type == 'BSDF_PRINCIPLED':
                    print(f"    Base Color: {n.inputs['Base Color'].default_value[:]}, Roughness: {n.inputs['Roughness'].default_value}")

print("\n=== OBJECT ANIMATION CHECKS ===")
for name in ['Floating_Ground_Shadow', 'Globe_Inner_Aura', 'Core_Light', 'Hero_Camera']:
    obj = bpy.data.objects.get(name)
    if obj:
        print(f"Obj {name}: loc={obj.location}, rot={obj.rotation_euler}, scale={obj.scale}, has_anim={obj.animation_data is not None}")
