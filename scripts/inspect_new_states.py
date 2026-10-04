import cv2
import numpy as np

render_dir = "/Users/karthikeya.s/.gemini/antigravity-ide/brain/751a256d-a337-4c01-8c6b-427f3a5ae3a6/transparent_render_1080p"

for f, name in [(1, "Globe Hold"), (78, "Electricity Resolved"), (131, "Fire Resolved"), (198, "Lock Resolved")]:
    p = f"{render_dir}/frame_{f:04d}.png"
    img = cv2.imread(p, cv2.IMREAD_UNCHANGED)
    if img is not None:
        h, w, c = img.shape
        b, g, r, a = cv2.split(img)
        ys, xs = np.where(a > 15)
        bw = xs.max() - xs.min()
        bh = ys.max() - ys.min()
        cx = xs.mean()
        cy = ys.mean()
        print(f"Frame {f:3d} ({name:20s}): bbox={bw}x{bh}, aspect={bw/bh:.2f}, center=({cx:.1f}, {cy:.1f}), opaque_alpha={np.sum(a>100)}")
    else:
        print(f"Frame {f:3d} ({name:20s}): not available yet")
