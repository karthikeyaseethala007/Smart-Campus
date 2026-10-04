import cv2
import numpy as np

img = cv2.imread("/tmp/test_transparent_render/frame_0001.png", cv2.IMREAD_UNCHANGED)
b, g, r, a = cv2.split(img)

# Bottom half is shadow region
shadow_region_a = a[700:1000, 600:1320]
print(f"Shadow region max alpha: {shadow_region_a.max()}, mean alpha: {shadow_region_a.mean():.2f}")
# Non-zero alpha pixels in shadow region
shadow_pts = np.sum(shadow_region_a > 5)
print(f"Shadow region non-zero pixels: {shadow_pts}")
