import bpy
import time

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

scene = bpy.context.scene

print("\n--- VIEWPORT EVALUATION SPEED TEST ---")
# Test viewport depsgraph evaluation
depsgraph_vp = bpy.context.evaluated_depsgraph_get()

t0 = time.perf_counter()
for f in range(1, 241):
    scene.frame_set(f)
    dg = bpy.context.evaluated_depsgraph_get()
    # evaluate all visible objects in depsgraph
    for obj in dg.object_instances:
        pass
t_vp = time.perf_counter() - t0
print(f"Viewport full traversal 240 frames: {t_vp:.4f} s ({240/t_vp:.1f} FPS)")

# Now test rendering a single frame breakdown (where does time go during Cycles render?)
import cProfile
import pstats

print("\n--- CYCLES RENDER BREAKDOWN FOR FRAME 40 ---")
scene.frame_set(40)
scene.render.resolution_x = 960
scene.render.resolution_y = 540
scene.render.resolution_percentage = 100
scene.cycles.samples = 64

t0 = time.perf_counter()
bpy.ops.render.render(write_still=False)
t_render = time.perf_counter() - t0
print(f"Cycles 540p 64 samples render time: {t_render:.3f} s")

# Now let's test without Globe_Inner_Aura (the volume object)
aura = bpy.data.objects.get("Globe_Inner_Aura")
if aura:
    aura.hide_render = True
    t0 = time.perf_counter()
    bpy.ops.render.render(write_still=False)
    t_no_aura = time.perf_counter() - t0
    print(f"Cycles render WITHOUT Globe_Inner_Aura: {t_no_aura:.3f} s (diff: {t_render - t_no_aura:.3f} s)")
    aura.hide_render = False

# Now let's test persistent data effect
scene.render.use_persistent_data = True
print("use_persistent_data:", scene.render.use_persistent_data)

# Test light shadows
for light_obj in bpy.data.objects:
    if light_obj.type == 'LIGHT':
        print(f"Light {light_obj.name}: shadow={light_obj.data.use_shadow}, energy={light_obj.data.energy}")

# Test geometry nodes settings
gn_obj = bpy.data.objects.get("Hero_Particle_System")
ico_node = bpy.data.node_groups['GN_Hero_Particle_System'].nodes.get('Ico Sphere')
print("Ico Sphere Subdivisions:", ico_node.inputs['Subdivisions'].default_value)

# What if Subdivisions = 0 (12 vertices instead of 42 vertices, 20 triangles instead of 80)?
ico_node.inputs['Subdivisions'].default_value = 0
t0 = time.perf_counter()
bpy.ops.render.render(write_still=False)
t_sub0 = time.perf_counter() - t0
print(f"Cycles render with Ico Sphere Subdivisions=0: {t_sub0:.3f} s")
ico_node.inputs['Subdivisions'].default_value = 1
