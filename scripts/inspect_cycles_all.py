import bpy

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

c = bpy.context.scene.cycles
print("--- DETAILED CYCLES SETTINGS ---")
for attr in dir(c):
    if not attr.startswith("_") and not callable(getattr(c, attr)):
        try:
            print(f"{attr}: {getattr(c, attr)}")
        except:
            pass
