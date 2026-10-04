import bpy

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
print("Initial scenes:", [s.name for s in bpy.data.scenes])

sc_prod = bpy.data.scenes.get("Production_Render")
if sc_prod:
    sc_dev = sc_prod.copy()
    sc_dev.name = "Animation_Development"
    sc_dev.use_fake_user = True
    sc_dev.render.engine = 'BLENDER_EEVEE'
    sc_dev.render.resolution_x = 960
    sc_dev.render.resolution_y = 540
    
    # Assign sc_dev to the active window
    bpy.context.window.scene = sc_dev
    
    bpy.ops.wm.save_mainfile()
    print("Saved with fake_user=True. Scenes in memory:", [s.name for s in bpy.data.scenes])

# Re-open and check
bpy.ops.wm.open_mainfile(filepath=blend_path)
print("After re-open, scenes:", [s.name for s in bpy.data.scenes])
print("Active scene:", bpy.context.scene.name)
