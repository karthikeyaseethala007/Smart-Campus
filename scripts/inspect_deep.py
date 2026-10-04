import bpy

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

act = bpy.data.actions['Hero_Particle_MeshAction']
print("Action dir:", dir(act))
strip = act.layers[0].strips[0]
print("Strip dir:", dir(strip))

# check channelbags
if hasattr(strip, 'channel_bags'):
    print("Channel bags:", len(strip.channel_bags))
    for cb in strip.channel_bags:
        print("  cb dir:", dir(cb))
        if hasattr(cb, 'fcurves'):
            print("  cb.fcurves:", len(cb.fcurves))
            for fc in cb.fcurves:
                print(f"    fc: {fc.data_path}[{fc.array_index}], keys={len(fc.keyframe_points)}")
                for k in fc.keyframe_points:
                    print(f"       frame={k.co[0]}, val={k.co[1]}")

# Also check screens and viewport settings!
print("\n--- SCREENS & SPACES ---")
for screen in bpy.data.screens:
    print(f"Screen: {screen.name}")
    for area in screen.areas:
        print(f"  Area: {area.type}")
        if area.type == 'VIEW_3D':
            for space in area.spaces:
                if space.type == 'VIEW_3D':
                    shading = space.shading
                    print(f"    Space3D Shading type: {shading.type}, render_pass: {shading.render_pass}")
                    print(f"    use_scene_lights: {shading.use_scene_lights}, use_scene_world: {shading.use_scene_world}")

# Check scene cycles settings
scene = bpy.context.scene
print("\n--- CYCLES SETTINGS ---")
print("cycles.preview_samples:", scene.cycles.preview_samples)
print("cycles.samples:", scene.cycles.samples)
print("cycles.use_denoising:", scene.cycles.use_denoising)
print("cycles.denoiser:", scene.cycles.denoiser)
print("cycles.preview_denoising:", scene.cycles.use_preview_denoising)
print("cycles.preview_denoiser:", scene.cycles.preview_denoiser)
print("cycles.use_persistent_data:", scene.render.use_persistent_data)
print("cycles.film_transparent:", scene.render.film_transparent)

# Check all objects ray visibility & shadow casting
print("\n--- RAY VISIBILITY ---")
for obj in bpy.data.objects:
    print(f"Object: {obj.name} (type: {obj.type})")
    print(f"  visible_camera: {obj.visible_camera}, diffuse: {obj.visible_diffuse}, glossy: {obj.visible_glossy}, transmission: {obj.visible_transmission}, volume_scatter: {obj.visible_volume_scatter}, shadow: {obj.visible_shadow}")
