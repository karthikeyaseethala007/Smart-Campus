import bpy
import numpy as np

mesh = bpy.data.objects['Hero_Particle_System'].data
kb = mesh.shape_keys.key_blocks

for key_name in ['State_Globe', 'State_Electricity', 'State_Fire', 'State_Lock']:
    coords = np.array([v.co for v in kb[key_name].data])
    r = np.sqrt(coords[:,0]**2 + coords[:,1]**2 + coords[:,2]**2)
    r_xy = np.sqrt(coords[:,0]**2 + coords[:,1]**2)
    span_x = np.ptp(coords[:,0])
    span_y = np.ptp(coords[:,1])
    span_z = np.ptp(coords[:,2])
    print(f"\n=== {key_name} ===")
    print(f"X min/max: {coords[:,0].min():.3f} / {coords[:,0].max():.3f} (span: {span_x:.3f})")
    print(f"Y min/max: {coords[:,1].min():.3f} / {coords[:,1].max():.3f} (span: {span_y:.3f})")
    print(f"Z min/max: {coords[:,2].min():.3f} / {coords[:,2].max():.3f} (span: {span_z:.3f})")
    print(f"Radial distance from origin: mean={r.mean():.3f}, min={r.min():.3f}, max={r.max():.3f}")
    print(f"XY radius: mean={r_xy.mean():.3f}, min={r_xy.min():.3f}, max={r_xy.max():.3f}")
    print(f"Y/X span ratio: {span_y / span_x:.3f}")
