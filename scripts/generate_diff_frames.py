import cv2
import os
import glob
import numpy as np

ref_dir = "references/mdx-analysis/final-difference-audit/blender-hero-motion-analysis/reference_frames"
cur_dir = "references/mdx-analysis/final-difference-audit/blender-hero-motion-analysis/current_frames"
diff_dir = "references/mdx-analysis/final-difference-audit/blender-hero-motion-analysis/diff_frames"
os.makedirs(diff_dir, exist_ok=True)

timestamps = np.arange(0.0, 8.6, 0.25)
print(f"Generating {len(timestamps)} diff comparison frames...")

for t in timestamps:
    ref_files = glob.glob(f"{ref_dir}/ref_t{t:04.2f}s_*.jpg")
    cur_files = glob.glob(f"{cur_dir}/cur_t{t:04.2f}s_*.jpg")
    if not ref_files or not cur_files:
        continue
    ref_img = cv2.imread(ref_files[0])
    cur_img = cv2.imread(cur_files[0])
    
    # Compute absolute difference and heatmap
    diff = cv2.absdiff(ref_img, cur_img)
    diff_gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
    heatmap = cv2.applyColorMap(cv2.equalizeHist(diff_gray), cv2.COLORMAP_JET)
    
    # Resize panels for triptych: 640 x 416 each -> total 1920 x 416
    pw, ph = 640, 416
    p_ref = cv2.resize(ref_img, (pw, ph), interpolation=cv2.INTER_AREA)
    p_cur = cv2.resize(cur_img, (pw, ph), interpolation=cv2.INTER_AREA)
    p_diff = cv2.resize(heatmap, (pw, ph), interpolation=cv2.INTER_AREA)
    
    # Add labels
    font = cv2.FONT_HERSHEY_SIMPLEX
    banner = np.zeros((44, pw * 3, 3), dtype=np.uint8)
    banner[:] = (16, 20, 24)
    
    cv2.putText(banner, f"MDX GROUND TRUTH (t={t:.2f}s)", (20, 30), font, 0.65, (255, 255, 255), 2)
    cv2.putText(banner, f"CURRENT RECORDING (t={t:.2f}s)", (pw + 20, 30), font, 0.65, (255, 200, 100), 2)
    cv2.putText(banner, f"ABSOLUTE DIFFERENCE HEATMAP", (pw * 2 + 20, 30), font, 0.65, (100, 180, 255), 2)
    
    triptych = np.hstack([p_ref, p_cur, p_diff])
    combined = np.vstack([banner, triptych])
    
    out_path = os.path.join(diff_dir, f"diff_t{t:04.2f}s.jpg")
    cv2.imwrite(out_path, combined, [cv2.IMWRITE_JPEG_QUALITY, 90])

print(f"Generated diff frames in {diff_dir}")
