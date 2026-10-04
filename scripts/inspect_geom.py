import bpy

obj = bpy.data.objects['Hero_Particle_System']
print("Modifiers:", [m.name for m in obj.modifiers])
for m in obj.modifiers:
    print(f"Mod: {m.name}, type={m.type}")
    if m.type == 'NODES':
        print(" Node group:", m.node_group.name if m.node_group else "None")
        if m.node_group:
            for node in m.node_group.nodes:
                print(f"   Node: {node.name} ({node.type})")

print("\nMaterials on obj:")
for slot in obj.material_slots:
    print(f"  Slot: {slot.name}, mat={slot.material.name if slot.material else 'None'}")

# Check other objects in scene:
for o in bpy.data.objects:
    print(f"Object: {o.name}, type={o.type}, parent={o.parent.name if o.parent else 'None'}")
    if o.type == 'MESH':
        print(f"  Mats: {[s.material.name for s in o.material_slots if s.material]}")
