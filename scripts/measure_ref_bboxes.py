import cv2
import numpy as np

def analyze_crop(name, img_path):
    img = cv2.imread(img_path)
    h, w, _ = img.shape
    # Hero object is around x in [450, 750], y in [120, 440]
    crop = img[100:460, 430:780]
    # In MDX, background is #EDECE7 (~235-240)
    bg = np.array([231, 236, 237], dtype=np.float32) # BGR
    diff = np.linalg.norm(crop.astype(np.float32) - bg, axis=2)
    mask = diff > 25
    ys, xs = np.where(mask)
    if len(xs) > 0:
        width = xs.max() - xs.min()
        height = ys.max() - ys.min()
        cx = xs.mean() + 430
        cy = ys.mean() + 100
        print(f"{name:20s}: mask_pts={len(xs):5d}, bbox={width:3d}x{height:3d}, center=({cx:.1f}, {cy:.1f}), aspect={width/height:.2f}")
    else:
        print(f"{name:20s}: no object detected")

frames = [
    ("f0000 (Globe)", "references/mdx-analysis/final-difference-audit/blender-hero-motion-analysis/reference_frames/ref_t00.0s_f0000.jpg"),
    ("f0073 (Globe rot)", "references/mdx-analysis/final-difference-audit/blender-hero-motion-analysis/reference_frames/ref_t01.5s_f0073.jpg"),
    ("f0132 (Elec morph)", "references/mdx-analysis/final-difference-audit/blender-hero-motion-analysis/reference_frames/ref_t02.7s_f0132.jpg"),
    ("f0162 (Elec res)", "references/mdx-analysis/final-difference-audit/blender-hero-motion-analysis/reference_frames/ref_t03.3s_f0162.jpg"),
    ("f0191 (Fire morph)", "references/mdx-analysis/final-difference-audit/blender-hero-motion-analysis/reference_frames/ref_t03.9s_f0191.jpg"),
    ("f0221 (Fire res)", "references/mdx-analysis/final-difference-audit/blender-hero-motion-analysis/reference_frames/ref_t04.5s_f0221.jpg"),
    ("f0250 (Lock res)", "references/mdx-analysis/final-difference-audit/blender-hero-motion-analysis/reference_frames/ref_t05.1s_f0250.jpg"),
    ("f0294 (Lock rot)", "references/mdx-analysis/final-difference-audit/blender-hero-motion-analysis/reference_frames/ref_t06.0s_f0294.jpg"),
    ("f0324 (Lock rot)", "references/mdx-analysis/final-difference-audit/blender-hero-motion-analysis/reference_frames/ref_t06.6s_f0324.jpg"),
    ("f0368 (Hero exit)", "references/mdx-analysis/final-difference-audit/blender-hero-motion-analysis/reference_frames/ref_t07.5s_f0368.jpg"),
]

for name, path in frames:
    analyze_crop(name, path)
