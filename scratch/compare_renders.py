import bpy
import numpy as np

for f in [1, 80, 150, 220]:
    existing_path = f"/Users/karthikeya.s/Documents/focus/public/assets/hero/frames_alpha/frame_{f:04d}.png"
    new_path = f"/Users/karthikeya.s/Documents/focus/scratch/test_blend1_renders/blend1_frame_{f:04d}.png"
    
    img_old = bpy.data.images.load(existing_path)
    img_new = bpy.data.images.load(new_path)
    
    px_old = np.array(img_old.pixels[:])
    px_new = np.array(img_new.pixels[:])
    
    diff = np.abs(px_old - px_new)
    max_diff = np.max(diff)
    mean_diff = np.mean(diff)
    print(f"Frame {f:04d}: max diff = {max_diff:.4f}, mean diff = {mean_diff:.6f}")
    
    # Check alpha channel (every 4th element starting at 3)
    alpha_old = px_old[3::4]
    alpha_new = px_new[3::4]
    print(f"  Old alpha sum > 0.1: {np.sum(alpha_old > 0.1)}, New alpha sum > 0.1: {np.sum(alpha_new > 0.1)}")
    
    # Check bounds of non-zero alpha
    w, h = img_old.size[0], img_old.size[1]
    a_old_2d = alpha_old.reshape((h, w))
    a_new_2d = alpha_new.reshape((h, w))
    
    y_old, x_old = np.where(a_old_2d > 0.05)
    y_new, x_new = np.where(a_new_2d > 0.05)
    
    if len(x_old) > 0 and len(x_new) > 0:
        print(f"  Old bbox: X=[{x_old.min()},{x_old.max()}], Y=[{y_old.min()},{y_old.max()}]")
        print(f"  New bbox: X=[{x_new.min()},{x_new.max()}], Y=[{y_new.min()},{y_new.max()}]")
        
    bpy.data.images.remove(img_old)
    bpy.data.images.remove(img_new)
