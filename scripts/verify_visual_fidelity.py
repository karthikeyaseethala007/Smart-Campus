import bpy
import numpy as np
import os

test_frames = [1, 40, 80, 120, 160, 200, 240]
print("=" * 60)
print("VISUAL FIDELITY VERIFICATION ACROSS TEST FRAMES")
print("=" * 60)

for f in test_frames:
    p_before = f"/Users/karthikeya.s/Documents/focus/baseline_renders/frame_{f:03d}.png"
    p_after = f"/Users/karthikeya.s/Documents/focus/optimized_renders/frame_{f:03d}.png"
    
    img_b = bpy.data.images.load(p_before)
    img_a = bpy.data.images.load(p_after)
    
    w, h = img_b.size
    px_b = np.array(img_b.pixels[:]).reshape((h, w, 4))[:, :, :3]
    px_a = np.array(img_a.pixels[:]).reshape((h, w, 4))[:, :, :3]
    
    diff = np.abs(px_b - px_a)
    mean_diff = np.mean(diff)
    max_diff = np.max(diff)
    mse = np.mean((px_b - px_a) ** 2)
    psnr = 10 * np.log10(1.0 / mse) if mse > 0 else 99.0
    
    print(f"Frame {f:3d} | Mean Diff: {mean_diff:.5f} | Max Diff: {max_diff:.4f} | PSNR: {psnr:.2f} dB")
    
    # cleanup image data blocks to save memory
    bpy.data.images.remove(img_b)
    bpy.data.images.remove(img_a)

print("=" * 60)
