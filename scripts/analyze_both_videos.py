import cv2
import os
import numpy as np

def inspect_video(path, name):
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    dur = count / fps
    print(f"=== {name} ===")
    print(f"FPS: {fps:.2f}, Count: {count}, Duration: {dur:.2f}s")
    
    # Sample every 0.5s
    for sec in np.arange(0, min(dur, 8.5), 0.5):
        frame_idx = int(sec * fps)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if ret:
            # Crop center/hero area
            h, w, _ = frame.shape
            # Hero object is around center-right
            hero_crop = frame[int(0.2*h):int(0.7*h), int(0.4*w):int(0.85*w)]
            gray = cv2.cvtColor(hero_crop, cv2.COLOR_BGR2GRAY)
            # Find dark/contrasting features (particles/shadow)
            # Background is light
            diff = 255 - gray
            pts = np.sum(diff > 35)
            print(f"  t={sec:4.1f}s (f={frame_idx:4d}): pts={pts:6d}, mean_val={gray.mean():.1f}, min={gray.min():3d}")
    cap.release()

inspect_video("references/mdx-reference.mov", "MDX REFERENCE")
inspect_video("references/current_recording.mov", "CURRENT RECORDING")
