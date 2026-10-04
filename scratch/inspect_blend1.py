import bpy
import sys

print("=" * 60)
print("INSPECTING BLENDER FILE: Untitled(1).blend1")
print("=" * 60)

scene = bpy.context.scene
print(f"Scene name: {scene.name}")
print(f"Frame start: {scene.frame_start}, Frame end: {scene.frame_end}, FPS: {scene.render.fps}")
print(f"Render engine: {scene.render.engine}")
print(f"Resolution: {scene.render.resolution_x}x{scene.render.resolution_y} @ {scene.render.resolution_percentage}%")
print(f"Film transparent: {scene.render.film_transparent}")

if scene.camera:
    print(f"Active camera: {scene.camera.name}, Location: {scene.camera.location}, Rotation: {scene.camera.rotation_euler}")
    if hasattr(scene.camera.data, 'lens'):
        print(f"Camera focal length: {scene.camera.data.lens}mm")
else:
    print("No active camera!")

print("\n--- OBJECTS ---")
for obj in bpy.data.objects:
    print(f"Object: {obj.name} (type: {obj.type}), Parent: {obj.parent.name if obj.parent else None}, Visible: {obj.visible_get()}")
    print(f"  Location: {obj.location}, Rotation: {obj.rotation_euler}, Scale: {obj.scale}")
    if obj.modifiers:
        print(f"  Modifiers: {[m.name + ' (' + m.type + ')' for m in obj.modifiers]}")
    if obj.particle_systems:
        print(f"  Particle systems: {[ps.name for ps in obj.particle_systems]}")
    if obj.data and hasattr(obj.data, 'shape_keys') and obj.data.shape_keys:
        kb = obj.data.shape_keys.key_blocks
        print(f"  Shape keys: {[k.name for k in kb]}")
    if obj.animation_data and obj.animation_data.action:
        print(f"  Action: {obj.animation_data.action.name}, range: {obj.animation_data.action.frame_range}")

print("\n--- MATERIALS ---")
for mat in bpy.data.materials:
    print(f"Material: {mat.name}, use_nodes: {mat.use_nodes}")

print("\n--- ANIMATION ACTIONS ---")
for act in bpy.data.actions:
    print(f"Action: {act.name}, frame range: {act.frame_range}")
    for fc in act.fcurves:
        print(f"  fcurve: data_path={fc.data_path}, array_index={fc.array_index}, keyframes={len(fc.keyframe_points)}")
        for kp in fc.keyframe_points:
            print(f"    frame {kp.co[0]}: value {kp.co[1]}")

print("\n--- COLLECTIONS ---")
for col in bpy.data.collections:
    print(f"Collection: {col.name}, objects: {[o.name for o in col.objects]}")

print("=" * 60)
