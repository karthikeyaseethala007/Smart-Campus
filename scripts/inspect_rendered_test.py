import cv2
import numpy as np

for f in [1, 70, 120, 175, 210]:
    path = f"/tmp/test_transparent_render/frame_{f:04d}.png"
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is not None:
        h, w, c = img.shape
        b, g, r, a = cv2.split(img)
        # Check alpha
        opaque_pts = np.sum(a > 0)
        semi_pts = np.sum((a > 0) & (a < 255))
        # Find bounding box of alpha > 10
        ys, xs = np.where(a > 10)
        if len(xs) > 0:
            bw = xs.max() - xs.min()
            bh = ys.max() - ys.min()
            cx = xs.mean()
            cy = ys.mean()
            print(f"Frame {f:3d}: size={w}x{h}, channels={c}, alpha_opaque={opaque_pts}, alpha_semi={semi_pts}, bbox={bw}x{bh}, center=({cx:.1f}, {cy:.1f}), aspect={bw/bh:.2f}")
        else:
            print(f"Frame {f:3d}: no visible alpha content")
    else:
        print(f"Frame {f:3d}: not found yet")
