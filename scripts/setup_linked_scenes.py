import bpy

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

sc_prod = bpy.data.scenes.get("Production_Render")
assert sc_prod is not None, "Production_Render not found!"

# Remove broken Animation_Development if it exists
sc_dev_old = bpy.data.scenes.get("Animation_Development")
if sc_dev_old and sc_dev_old != sc_prod:
    bpy.data.scenes.remove(sc_dev_old)

# Create a Linked Copy of Production_Render for Animation_Development
sc_dev = sc_prod.copy()
sc_dev.name = "Animation_Development"

# Configure Animation_Development for fast interactive scrubbing:
sc_dev.render.engine = 'BLENDER_EEVEE'
sc_dev.render.resolution_x = 960
sc_dev.render.resolution_y = 540
sc_dev.render.resolution_percentage = 100
sc_dev.view_settings.view_transform = 'Filmic'
sc_dev.view_settings.look = 'Medium High Contrast'
sc_dev.view_settings.exposure = 0.0

# Configure Production_Render for final Cycles production:
sc_prod.render.engine = 'CYCLES'
sc_prod.cycles.device = 'GPU'
sc_prod.render.resolution_x = 1920
sc_prod.render.resolution_y = 1080
sc_prod.render.resolution_percentage = 100
sc_prod.cycles.samples = 64
sc_prod.cycles.use_adaptive_sampling = True
sc_prod.cycles.adaptive_threshold = 0.04
sc_prod.cycles.use_denoising = True

prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'
prefs.get_devices()
for d in prefs.devices:
    d.use = True

sc_prod.view_settings.view_transform = 'Filmic'
sc_prod.view_settings.look = 'Medium High Contrast'
sc_prod.view_settings.exposure = 0.0

# Test evaluation in Animation_Development
print("\n--- Testing Animation_Development (Linked EEVEE Scene) ---")
bpy.context.window.scene = sc_dev
obj = bpy.data.objects['Hero_Particle_System']
sk = obj.data.shape_keys

for f in [1, 40, 86, 155, 225]:
    sc_dev.frame_set(f)
    dg = bpy.context.evaluated_depsgraph_get()
    rot_z = obj.rotation_euler.z * 180 / 3.14159
    active_sk = {kb.name: round(kb.value, 3) for kb in sk.key_blocks if kb.value > 0.01}
    print(f"  Frame {f:3d}: rot_z={rot_z:5.1f} deg, shape_keys={active_sk}")

# Set default scene on open to Animation_Development
bpy.context.window.scene = sc_dev

# Set 3D viewport shading to SOLID in all screens
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            for space in area.spaces:
                if space.type == 'VIEW_3D':
                    space.shading.type = 'SOLID'
                    space.shading.light = 'STUDIO'

# Save file
bpy.ops.wm.save_mainfile(filepath=blend_path)
print(f"\nSuccessfully configured linked scenes and saved to {blend_path}")
