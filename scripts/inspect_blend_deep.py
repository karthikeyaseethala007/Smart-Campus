import bpy

scene = bpy.context.scene
print("=== RENDER SETTINGS ===")
print("Engine:", scene.render.engine)
print("film_transparent:", getattr(scene.render, "film_transparent", None))
print("Resolution:", scene.render.resolution_x, scene.render.resolution_y)

print("\n=== OBJECTS VISIBILITY ===")
for obj in scene.objects:
    print(f"{obj.name} ({obj.type}): hide_render={obj.hide_render}, hide_viewport={obj.hide_viewport}")

print("\n=== PARTICLES MATERIAL ===")
ps = bpy.data.objects.get("Hero_Particle_System")
if ps:
    for ms in ps.material_slots:
        print("Slot material:", ms.material.name if ms.material else "None")
        if ms.material and ms.material.node_tree:
            for node in ms.material.node_tree.nodes:
                print("  Node:", node.name, node.type)

print("\n=== ANIMATION TIMELINE ===")
print("Start:", scene.frame_start, "End:", scene.frame_end, "Current:", scene.frame_current)
