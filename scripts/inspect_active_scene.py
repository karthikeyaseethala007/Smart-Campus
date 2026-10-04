import bpy

print('Active scene on file open:', bpy.context.scene.name)
for sc in bpy.data.scenes:
    print('Scene:', sc.name, 'engine:', sc.render.engine)
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            for space in area.spaces:
                if space.type == 'VIEW_3D':
                    print(f'Screen {screen.name} 3D View Shading: {space.shading.type}, light: {space.shading.light}')
