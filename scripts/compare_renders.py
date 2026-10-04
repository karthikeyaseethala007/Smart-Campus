import bpy
import numpy as np

# Compare v0_baseline.png and v6_combined.png
img0 = bpy.data.images.load("/Users/karthikeya.s/Documents/focus/opt_tests/v0_baseline.png")
img6 = bpy.data.images.load("/Users/karthikeya.s/Documents/focus/opt_tests/v6_combined.png")

w, h = img0.size
px0 = np.array(img0.pixels[:]).reshape((h, w, 4))
px6 = np.array(img6.pixels[:]).reshape((h, w, 4))

diff = np.abs(px0[:, :, :3] - px6[:, :, :3])
mean_diff = np.mean(diff)
max_diff = np.max(diff)
print(f"Comparison: Mean pixel difference = {mean_diff:.5f}, Max pixel diff = {max_diff:.5f}")

# Check PSNR
mse = np.mean((px0[:, :, :3] - px6[:, :, :3]) ** 2)
if mse > 0:
    psnr = 10 * np.log10(1.0 / mse)
    print(f"PSNR = {psnr:.2f} dB (very high fidelity > 35dB)")
else:
    print("Identical images!")
