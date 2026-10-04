import bpy

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

aura = bpy.data.objects.get("Globe_Inner_Aura")
print("Globe_Inner_Aura:")
print("  anim_data:", aura.animation_data)
if aura.animation_data and aura.animation_data.action:
    print("  action:", aura.animation_data.action.name)
print("  location:", aura.location)
print("  scale:", aura.scale)
print("  rotation:", aura.rotation_euler)
print("  hide_viewport:", aura.hide_viewport)
print("  hide_render:", aura.hide_render)
print("  material:", [m.name for m in aura.data.materials])

# Check emission node color in M_Inner_Aura
mat = bpy.data.materials.get("M_Inner_Aura")
em = mat.node_tree.nodes.get("Emission")
print("M_Inner_Aura Emission Color:", list(em.inputs['Color'].default_value))

# Check M_Hero_Particle Principled BSDF
mat_p = bpy.data.materials.get("M_Hero_Particle")
p_node = mat_p.node_tree.nodes.get("Principled BSDF")
print("M_Hero_Particle Base Color:", list(p_node.inputs['Base Color'].default_value))
print("M_Hero_Particle Emission Color:", list(p_node.inputs['Emission Color'].default_value))
print("M_Hero_Particle Emission Strength:", p_node.inputs['Emission Strength'].default_value)
print("M_Hero_Particle Roughness:", p_node.inputs['Roughness'].default_value)
