import cv2
import numpy as np

cap = cv2.VideoCapture("references/mdx-reference.mov")
print("Total frames in MDX:", int(cap.get(cv2.CAP_PROP_FRAME_COUNT)))
print("Resolution:", int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), "x", int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)))

# Check frame 0 (Globe), frame 150 (Electricity), frame 200 (Fire), frame 240 (Lock)
for f_idx in [0, 50, 150, 200, 240]:
    cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
    ret, frame = cap.read()
    if ret:
        # Background is top-left corner
        bg_rgb = frame[20:60, 20:60].mean(axis=(0, 1))
        # Center region
        center = frame[frame.shape[0]//4: 3*frame.shape[0]//4, frame.shape[1]//4: 3*frame.shape[1]//4]
        
        # Particle pixels: find brightest pixels
        gray = cv2.cvtColor(center, cv2.COLOR_BGR2GRAY)
        bright_pts = center[gray > 180]
        p_mean = bright_pts.mean(axis=0) if len(bright_pts) > 0 else [0, 0, 0]
        
        # Orange core / glow pixels: high red, moderate green, low blue
        r, g, b = center[:, :, 2], center[:, :, 1], center[:, :, 0]
        orange_mask = (r > 160) & (g > 80) & (g < 180) & (b < 80)
        orange_pts = center[orange_mask]
        o_mean = orange_pts.mean(axis=0) if len(orange_pts) > 0 else np.array([0, 0, 0])
        
        print(f"\nFrame {f_idx}:")
        print(f"  Background BGR: {bg_rgb.round(1)} (RGB: [{bg_rgb[2]:.1f}, {bg_rgb[1]:.1f}, {bg_rgb[0]:.1f}])")
        print(f"  Particle BGR:   {p_mean.round(1)} (RGB: [{p_mean[2]:.1f}, {p_mean[1]:.1f}, {p_mean[0]:.1f}])")
        print(f"  Orange Glow BGR:{o_mean.round(1)} (count: {len(orange_pts)})")

cap.release()
