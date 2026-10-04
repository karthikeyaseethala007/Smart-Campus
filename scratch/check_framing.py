import bpy

bpy.ops.wm.open_mainfile(filepath="/Users/karthikeya.s/Documents/focus/Untitled(1).blend1")
scene = bpy.context.scene
hero = bpy.data.objects.get("Hero_Particle_System")

print(f"Total vertices: {len(hero.data.vertices)}")
print(f"Camera: {scene.camera.name}, lens={scene.camera.data.lens}mm, loc={scene.camera.location}")

# Check bounding boxes in camera view
# In Blender, bpy_extras.object_utils.world_to_camera_view converts world coordinates to camera [0, 1]
import bpy_extras

cam = scene.camera

min_x_all, max_x_all = 1.0, 0.0
min_y_all, max_y_all = 1.0, 0.0

for f in range(1, 241, 15):
    scene.frame_set(f)
    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_hero = hero.evaluated_get(depsgraph)
    mesh = eval_hero.to_mesh(preserve_all_data_layers=True, depsgraph=depsgraph)
    
    matrix = eval_hero.matrix_world
    xs, ys = [], []
    for v in mesh.vertices:
        co = matrix @ v.co
        co_cam = bpy_extras.object_utils.world_to_camera_view(scene, cam, co)
        xs.append(co_cam.x)
        ys.append(co_cam.y)
    
    eval_hero.to_mesh_clear()
    
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    min_x_all = min(min_x_all, min_x)
    max_x_all = max(max_x_all, max_x)
    min_y_all = min(min_y_all, min_y)
    max_y_all = max(max_y_all, max_y)
    print(f"Frame {f:3d}: X=[{min_x:.3f}, {max_x:.3f}], Y=[{min_y:.3f}, {max_y:.3f}]")

print(f"\nOverall bounds across timeline: X=[{min_x_all:.3f}, {max_x_all:.3f}], Y=[{min_y_all:.3f}, {max_y_all:.3f}]")
if min_x_all >= 0 and max_x_all <= 1 and min_y_all >= 0 and max_y_all <= 1:
    print("ALL PARTICLES FIT PERFECTLY WITHIN CAMERA VIEW (No clipping)!")
else:
    print("Warning: some particles exceed camera view!")
