import bpy
import numpy as np

# Load Untitled(1).blend
blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

obj = bpy.data.objects['Hero_Particle_System']
sk = obj.data.shape_keys
kb = sk.key_blocks

P_G = np.array([v.co for v in kb['State_Globe'].data])
P_E_orig = np.array([v.co for v in kb['State_Electricity'].data])
P_F_orig = np.array([v.co for v in kb['State_Fire'].data])
P_L = np.array([v.co for v in kb['State_Lock'].data])

N = 3200

# Let's inspect the original P_E_orig coordinates
print("P_E_orig shape:", P_E_orig.shape)
