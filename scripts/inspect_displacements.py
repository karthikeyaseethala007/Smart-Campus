import bpy
import numpy as np

mesh = bpy.data.objects['Hero_Particle_System'].data
kb = mesh.shape_keys.key_blocks

globe = np.array([v.co for v in kb['State_Globe'].data])
print("Globe vertices:", len(globe))
print(f"Globe X: [{globe[:,0].min():.3f}, {globe[:,0].max():.3f}]")
print(f"Globe Y: [{globe[:,1].min():.3f}, {globe[:,1].max():.3f}]")
print(f"Globe Z: [{globe[:,2].min():.3f}, {globe[:,2].max():.3f}]")

# Check existing electricity, fire, lock coordinates
for name in ['State_Electricity', 'State_Fire', 'State_Lock']:
    coords = np.array([v.co for v in kb[name].data])
    dist_from_globe = np.linalg.norm(coords - globe, axis=1)
    print(f"\n{name}: mean travel distance from Globe = {dist_from_globe.mean():.3f}, max = {dist_from_globe.max():.3f}")
