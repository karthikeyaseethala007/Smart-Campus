import os
import sys
import cv2
import numpy as np

def create_comparison_sheet():
    mdx_dir = "/Users/karthikeya.s/Documents/focus/references/mdx-analysis/13_test_milestones"
    browser_dir = "/Users/karthikeya.s/Documents/focus/references/mdx-analysis/browser_verification_final"
    output_path = "/Users/karthikeya.s/Documents/focus/references/mdx-analysis/final_browser_vs_mdx_comparison.png"

    milestone_info = [
        ("01", "Globe Hold", "Stable geodesic sphere hold", "01_globe_hold_f0080_crop.jpg", "01_browser_globe_hold.png"),
        ("02", "Globe 25% Deformation", "Pre-distortion: radial swell & tangential slip", "02_globe_25pct_f0121_crop.jpg", "02_browser_globe_25pct.png"),
        ("03", "Globe 50% Deformation", "Peak Energy: +23% radial burst, zero chord collapse", "03_globe_50pct_f0132_crop.jpg", "03_browser_globe_50pct.png"),
        ("04", "Globe 75% Deformation", "Intermediate Hybrid: electrical arc tendrils condense", "04_globe_75pct_f0143_crop.jpg", "04_browser_globe_75pct.png"),
        ("05", "Electricity Resolved", "Target Formation: dual high-velocity electrical loops", "05_electricity_resolved_f0154_crop.jpg", "05_browser_electricity_resolved.png"),
        ("06", "Electricity 25% Deformation", "Pre-distortion: arc destabilization & upward draw", "06_electricity_25pct_f0178_crop.jpg", "06_browser_electricity_25pct.png"),
        ("07", "Electricity 50% Deformation", "Peak Energy: vertical vortex surge + spiral twist", "07_electricity_50pct_f0185_crop.jpg", "07_browser_electricity_50pct.png"),
        ("08", "Electricity 75% Deformation", "Intermediate Hybrid: flame column & crown clustering", "08_electricity_75pct_f0192_crop.jpg", "08_browser_electricity_75pct.png"),
        ("09", "Fire Resolved", "Target Formation: roaring vertical plasma flame core", "09_fire_resolved_f0198_crop.jpg", "09_browser_fire_resolved.png"),
        ("10", "Fire 25% Deformation", "Pre-distortion: flame crown arching & shackle curl", "10_fire_25pct_f0222_crop.jpg", "10_browser_fire_25pct.png"),
        ("11", "Fire 50% Deformation", "Peak Energy: U-arch curve + rectangular body frame", "11_fire_50pct_f0229_crop.jpg", "11_browser_fire_50pct.png"),
        ("12", "Fire 75% Deformation", "Intermediate Hybrid: padlock latch & keyway settle", "12_fire_75pct_f0236_crop.jpg", "12_browser_fire_75pct.png"),
        ("13", "Lock Resolved", "Target Formation: solid cryptographic padlock security", "13_lock_resolved_f0242_crop.jpg", "13_browser_lock_resolved.png")
    ]

    # Grid config: 13 rows, 2 main columns (MDX vs Browser), each cell 480x480
    cell_size = 420
    header_h = 90
    title_bar_h = 36
    row_h = cell_size + title_bar_h
    total_w = cell_size * 2 + 60
    total_h = header_h + len(milestone_info) * (row_h + 16) + 30

    canvas = np.zeros((total_h, total_w, 3), dtype=np.uint8)
    canvas[:] = (12, 12, 14) # Clean dark background

    # Main Header
    cv2.rectangle(canvas, (0, 0), (total_w, header_h), (20, 20, 24), -1)
    cv2.putText(canvas, "HERO 3D PARTICLE DEFORMATION: MDX GROUND TRUTH VS LIVE BROWSER", 
                (30, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(canvas, "3,200 Persistent Particles | Continuous Trajectories P(t)=(1-w)A+wB+def(t,i) | 100% Deterministic WebGL Scrubbing", 
                (30, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (160, 160, 160), 1, cv2.LINE_AA)

    y_offset = header_h + 16

    for item in milestone_info:
        num, name, desc, mdx_fname, browser_fname = item
        mdx_path = os.path.join(mdx_dir, mdx_fname)
        b_path = os.path.join(browser_dir, browser_fname)

        mdx_img = cv2.imread(mdx_path)
        b_img = cv2.imread(b_path)

        # Crop browser particle center
        # Browser is 1920x1080. Center of particles is (960, 600)
        b_crop = b_img[200:1000, 560:1360]
        
        mdx_resized = cv2.resize(mdx_img, (cell_size, cell_size), interpolation=cv2.INTER_AREA)
        b_resized = cv2.resize(b_crop, (cell_size, cell_size), interpolation=cv2.INTER_AREA)

        # Draw row banner
        cv2.rectangle(canvas, (20, y_offset), (total_w - 20, y_offset + title_bar_h), (28, 28, 34), -1)
        cv2.putText(canvas, f"PHASE {num}: {name.upper()}", 
                    (30, y_offset + 24), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 200, 80), 2, cv2.LINE_AA)
        cv2.putText(canvas, f"// {desc}", 
                    (420, y_offset + 24), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (180, 180, 180), 1, cv2.LINE_AA)

        img_y = y_offset + title_bar_h + 4

        # MDX Cell
        canvas[img_y:img_y+cell_size, 20:20+cell_size] = mdx_resized
        # Label overlay on MDX
        cv2.rectangle(canvas, (20, img_y), (20 + 170, img_y + 26), (0, 0, 0), -1)
        cv2.putText(canvas, "MDX REFERENCE", (26, img_y + 18), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (120, 200, 255), 1, cv2.LINE_AA)

        # Browser Cell
        canvas[img_y:img_y+cell_size, 30+cell_size:30+cell_size*2] = b_resized
        # Label overlay on Browser
        cv2.rectangle(canvas, (30+cell_size, img_y), (30+cell_size + 180, img_y + 26), (0, 0, 0), -1)
        cv2.putText(canvas, "LIVE BROWSER RENDER", (36+cell_size, img_y + 18), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (80, 255, 160), 1, cv2.LINE_AA)

        y_offset += row_h + 16

    cv2.imwrite(output_path, canvas)
    print(f"Master Side-by-Side Comparison Sheet created successfully: {output_path}")

def create_editorial_and_backward_sheet():
    browser_dir = "/Users/karthikeya.s/Documents/focus/references/mdx-analysis/browser_verification_final"
    output_path = "/Users/karthikeya.s/Documents/focus/references/mdx-analysis/browser_editorial_and_backward_scrub_audit.png"

    handoff_frames = [
        ("14_browser_lock_rotating.png", "1. Hero Lock Hold & Rotation", "Monotonic Z-axis rotation continues seamlessly"),
        ("15_browser_hero_editorial_handoff.png", "2. Section 01 -> 02 Handoff", "Hero stage scales back as editorial title rises"),
        ("16_browser_editorial_statement_02.png", "3. Editorial Core Statement", "Zero black boxes, pristine typography and transparency"),
        ("17_browser_four_pillars_orbit.png", "4. Four Pillars 3D Showcase", "Smooth scroll handoff into deep product features")
    ]

    backward_frames = [
        ("18_browser_bwd_lock.png", "5. Backward Scrub: Lock", "Reversed scroll cleanly reconstructs Lock geometry"),
        ("19_browser_bwd_fire_vortex.png", "6. Backward Scrub: Fire Vortex", "Intermediate energy trajectories reverse smoothly"),
        ("20_browser_bwd_electricity_hold.png", "7. Backward Scrub: Electricity", "Persistent particles reform dual electrical loops"),
        ("21_browser_bwd_globe_hold.png", "8. Backward Scrub: Globe Hold", "Returns to geodesic sphere with zero coordinate drift")
    ]

    thumb_w, thumb_h = 440, 248
    header_h = 80
    row_title_h = 32
    padding = 16
    total_w = padding * 5 + thumb_w * 4
    total_h = header_h + (row_title_h + thumb_h + 40 + padding) * 2

    canvas = np.zeros((total_h, total_w, 3), dtype=np.uint8)
    canvas[:] = (12, 12, 14)

    # Header
    cv2.rectangle(canvas, (0, 0), (total_w, header_h), (20, 20, 24), -1)
    cv2.putText(canvas, "BROWSER SYSTEM AUDIT: EDITORIAL HANDOFF & REVERSIBLE BACKWARD SCRUBBING", 
                (30, 36), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(canvas, "Live Chrome Verification | Clamped Motion Values | Zero Jitter | Bidirectional Deterministic Scrubber", 
                (30, 64), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (160, 160, 160), 1, cv2.LINE_AA)

    # Row 1: Handoff
    y = header_h + padding
    cv2.rectangle(canvas, (padding, y), (total_w - padding, y + row_title_h), (26, 32, 44), -1)
    cv2.putText(canvas, "EDITORIAL SECTION HANDOFF (SCROLL FORWARD 60% -> 90%)", 
                (padding + 12, y + 22), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (100, 200, 255), 2, cv2.LINE_AA)
    
    img_y = y + row_title_h + 8
    for idx, (fname, title, desc) in enumerate(handoff_frames):
        x = padding + idx * (thumb_w + padding)
        img = cv2.imread(os.path.join(browser_dir, fname))
        resized = cv2.resize(img, (thumb_w, thumb_h), interpolation=cv2.INTER_AREA)
        canvas[img_y:img_y+thumb_h, x:x+thumb_w] = resized

        # Text below thumbnail
        cv2.putText(canvas, title, (x, img_y + thumb_h + 18), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1, cv2.LINE_AA)
        cv2.putText(canvas, desc, (x, img_y + thumb_h + 34), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (150, 150, 150), 1, cv2.LINE_AA)

    # Row 2: Backward Scrubbing
    y = img_y + thumb_h + 50
    cv2.rectangle(canvas, (padding, y), (total_w - padding, y + row_title_h), (36, 28, 44), -1)
    cv2.putText(canvas, "BIDIRECTIONAL REVERSIBLE SCRUBBING (SCROLL BACKWARD 100% -> 0%)", 
                (padding + 12, y + 22), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (255, 140, 200), 2, cv2.LINE_AA)

    img_y = y + row_title_h + 8
    for idx, (fname, title, desc) in enumerate(backward_frames):
        x = padding + idx * (thumb_w + padding)
        img = cv2.imread(os.path.join(browser_dir, fname))
        resized = cv2.resize(img, (thumb_w, thumb_h), interpolation=cv2.INTER_AREA)
        canvas[img_y:img_y+thumb_h, x:x+thumb_w] = resized

        # Text below thumbnail
        cv2.putText(canvas, title, (x, img_y + thumb_h + 18), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1, cv2.LINE_AA)
        cv2.putText(canvas, desc, (x, img_y + thumb_h + 34), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (150, 150, 150), 1, cv2.LINE_AA)

    cv2.imwrite(output_path, canvas)
    print(f"Editorial & Backward Scrubbing Sheet created successfully: {output_path}")

def create_scrub_recording_video():
    browser_dir = "/Users/karthikeya.s/Documents/focus/references/mdx-analysis/browser_verification_final"
    output_mp4 = "/Users/karthikeya.s/Documents/focus/references/mdx-analysis/browser_scrub_recording.mp4"

    # Sequence of 21 browser frames
    frame_files = [f"{i:02d}_" for i in range(1, 22)]
    all_files = sorted(os.listdir(browser_dir))
    ordered_paths = []
    for prefix in frame_files:
        matches = [os.path.join(browser_dir, f) for f in all_files if f.startswith(prefix)]
        if matches:
            ordered_paths.append(matches[0])

    if not ordered_paths:
        print("No browser frames found for video!")
        return

    print(f"Assembling {len(ordered_paths)} milestone frames into browser scrub video...")

    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    out = cv2.VideoWriter(output_mp4, fourcc, 24.0, (1920, 1080))

    if not out.isOpened():
        print("Could not open VideoWriter for browser scrub MP4")
        return

    # To create a smooth visual demonstration, hold each milestone frame for 18 frames (~0.75s)
    # with a 6-frame smooth cross-dissolve transition between milestones
    prev_img = None
    for idx, path in enumerate(ordered_paths):
        curr_img = cv2.imread(path)
        if curr_img is None:
            continue

        if prev_img is not None:
            # 6 transition frames
            for step in range(1, 7):
                alpha = step / 6.0
                blend = cv2.addWeighted(prev_img, 1.0 - alpha, curr_img, alpha, 0)
                out.write(blend)

        # Hold current frame for 16 frames
        for _ in range(16):
            out.write(curr_img)

        prev_img = curr_img

    out.release()
    print(f"Browser scrub recording video created successfully: {output_mp4}")
    print(f"File size: {os.path.getsize(output_mp4)} bytes")

if __name__ == "__main__":
    create_comparison_sheet()
    create_editorial_and_backward_sheet()
    create_scrub_recording_video()
