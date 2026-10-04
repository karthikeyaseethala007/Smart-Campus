import os
import sys
import glob
import cv2
import numpy as np
import subprocess

print("==========================================================")
print("HERO RENDER VERIFICATION & COMPARATIVE AUDIT PIPELINE")
print("==========================================================")

render_dir = "/Users/karthikeya.s/.gemini/antigravity-ide/brain/751a256d-a337-4c01-8c6b-427f3a5ae3a6/transparent_render_1080p"

# 1. Link frame_XXXX.png to frame_XXX.png if needed
for f in range(1, 241):
    f4 = os.path.join(render_dir, f"frame_{f:04d}.png")
    f3 = os.path.join(render_dir, f"frame_{f:03d}.png")
    if os.path.exists(f4) and not os.path.exists(f3):
        try:
            os.link(f4, f3)
        except Exception:
            pass

frames_available = [os.path.join(render_dir, f"frame_{f:03d}.png") for f in range(1, 241) if os.path.exists(os.path.join(render_dir, f"frame_{f:03d}.png"))]
print(f"Frames rendered so far: {len(frames_available)}/240")

if len(frames_available) < 240:
    print(f"Rendering still in progress ({len(frames_available)}/240 frames). Will exit for now.")
    sys.exit(2)

print("ALL 240 FRAMES CONFIRMED PRESENT!")

# 2. Update poster.png with transparent frame 1
poster_path = "/Users/karthikeya.s/Documents/focus/public/assets/hero/poster.png"
f1 = cv2.imread(frames_available[0], cv2.IMREAD_UNCHANGED)
cv2.imwrite(poster_path, f1)
print(f"Updated transparent poster at {poster_path}")

# 3. Encode Dual-Alpha Video
tmp_raw_mp4 = "/tmp/hero_dual_alpha_raw.mp4"
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
out_dual = cv2.VideoWriter(tmp_raw_mp4, fourcc, 24.0, (1280, 1440))

for idx, fpath in enumerate(frames_available):
    rgba = cv2.imread(fpath, cv2.IMREAD_UNCHANGED)
    resized = cv2.resize(rgba, (1280, 720), interpolation=cv2.INTER_AREA)
    b, g, r, a = cv2.split(resized)
    rgb = cv2.merge([b, g, r])
    alpha_rgb = cv2.merge([a, a, a])
    stacked = np.vstack([rgb, alpha_rgb])
    out_dual.write(stacked)

out_dual.release()
print("Raw dual-alpha video generated.")

# High-performance H.264 encode with fast seek keyframes for instant scrubbing
final_mp4 = "/Users/karthikeya.s/Documents/focus/public/assets/hero/hero_particle_master_1080p.mp4"
ffmpeg_cmd = f"ffmpeg -y -i {tmp_raw_mp4} -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.1 -g 4 -keyint_min 1 -crf 18 -movflags +faststart {final_mp4}"
subprocess.run(ffmpeg_cmd, shell=True)
print(f"Browser H.264 dual-alpha MP4 saved to {final_mp4}")

# Transparent WebM with native VP9 alpha channel
webm_path = "/Users/karthikeya.s/Documents/focus/public/assets/hero/hero_particle_transparent.webm"
webm_cmd = f"ffmpeg -y -framerate 24 -i {render_dir}/frame_%04d.png -vf scale=1280:720 -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 2M {webm_path}"
subprocess.run(webm_cmd, shell=True)
print(f"Transparent VP9 WebM saved to {webm_path}")

# 4. Generate Frame-by-Frame Comparison against MDX Reference
# Test points: 0% to 100% at 5% intervals plus all morph landmarks
test_points = [
    # (pct, mdx_frame, blender_frame, label)
    (0.00, 0, 1, "00pct_Hero_Start_Globe_Hold"),
    (0.05, 19, 13, "05pct_Globe_Hold"),
    (0.10, 38, 25, "10pct_Globe_Hold"),
    (0.15, 57, 37, "15pct_Globe_Steady_Rotation"),
    (0.20, 76, 49, "20pct_Globe_Steady_Rotation"),
    (0.25, 96, 55, "25pct_Globe_Hold_End"),
    (0.287, 110, 58, "28.7pct_Morph_01_Start_Relaxing_Sphere"),
    (0.30, 115, 61, "30pct_Morph_01_Wave_Harmonics"),
    (0.345, 132, 68, "34.5pct_Morph_01_Peak_Deformation_Wave_Swell"),
    (0.35, 134, 69, "35pct_Morph_01_Consolidation"),
    (0.402, 154, 80, "40.2pct_Morph_01_Electricity_Resolve"),
    (0.431, 165, 95, "43.1pct_State_02_Electricity_Settle"),
    (0.449, 172, 104, "44.9pct_Morph_02_Start_Ring_Decoupling"),
    (0.45, 173, 105, "45pct_Morph_02_Vertical_Streaming"),
    (0.486, 186, 118, "48.6pct_Morph_02_Peak_Deformation_Flame_Surge"),
    (0.50, 192, 124, "50pct_Morph_02_Flame_Consolidation"),
    (0.517, 198, 131, "51.7pct_State_03_Fire_Resolve"),
    (0.546, 209, 148, "54.6pct_State_03_Fire_Settle"),
    (0.55, 211, 150, "55pct_State_03_Fire_Hold"),
    (0.564, 216, 160, "56.4pct_Morph_03_Start_Inward_Arch_Curl"),
    (0.60, 230, 174, "60pct_Morph_03_Peak_Deformation_Lock_Hybrid"),
    (0.601, 230, 174, "60.1pct_Morph_03_Peak_Lock_Hybrid"),
    (0.632, 242, 187, "63.2pct_State_04_Lock_Resolve"),
    (0.65, 249, 192, "65pct_State_04_Lock_Settle_Motion"),
    (0.674, 258, 197, "67.4pct_State_04_Lock_Settle_Equilibrium"),
    (0.70, 268, 204, "70pct_State_04_Lock_Steady_Rotation"),
    (0.744, 285, 215, "74.4pct_State_04_Lock_Steady_Rotation"),
    (0.75, 287, 216, "75pct_State_04_Lock_Steady_Rotation"),
    (0.80, 306, 222, "80pct_State_04_Lock_Pre_Handoff"),
    (0.809, 310, 224, "80.9pct_Hero_Exit_Editorial_01_Overlap_Start"),
    (0.85, 326, 228, "85pct_Hero_Receding_Editorial_01_Entering"),
    (0.90, 345, 232, "90pct_Hero_Receding_Editorial_01_Mid_Cross"),
    (0.95, 364, 236, "95pct_Editorial_01_Dominant"),
    (1.00, 383, 240, "100pct_Editorial_01_Fully_Locked")
]

cap_ref = cv2.VideoCapture("references/mdx-reference.mov")
out_comparisons = "references/mdx-analysis/final-difference-audit/blender_comparisons"
os.makedirs(out_comparisons, exist_ok=True)

pw, ph = 640, 416
print(f"Generating {len(test_points)} precision comparison triptychs...")

for pct, mdx_f, blend_f, label in test_points:
    # 1. Read MDX frame
    cap_ref.set(cv2.CAP_PROP_POS_FRAMES, mdx_f)
    ret, ref_img = cap_ref.read()
    if not ret:
        continue
    ref_panel = cv2.resize(ref_img, (pw, ph), interpolation=cv2.INTER_AREA)

    # 2. Read new transparent Blender render frame
    blend_path = os.path.join(render_dir, f"frame_{blend_f:03d}.png")
    blend_rgba = cv2.imread(blend_path, cv2.IMREAD_UNCHANGED)
    
    # Composite over web stage background (#EDEDF0 to #F8F8FA)
    bg_color = np.array([238, 237, 237], dtype=np.uint8) # BGR
    canvas_bg = np.full((1080, 1920, 3), bg_color, dtype=np.uint8)
    
    b, g, r, a = cv2.split(blend_rgba)
    alpha = (a.astype(np.float32) / 255.0)[:, :, np.newaxis]
    rgb = cv2.merge([b, g, r])
    composited = (rgb.astype(np.float32) * alpha + canvas_bg.astype(np.float32) * (1.0 - alpha)).astype(np.uint8)
    cur_panel = cv2.resize(composited, (pw, ph), interpolation=cv2.INTER_AREA)

    # 3. Compute difference heatmap
    diff = cv2.absdiff(ref_panel, cur_panel)
    diff_gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
    heatmap = cv2.applyColorMap(cv2.equalizeHist(diff_gray), cv2.COLORMAP_JET)

    # 4. Construct labeled triptych
    banner = np.zeros((46, pw * 3, 3), dtype=np.uint8)
    banner[:] = (16, 20, 24)
    font = cv2.FONT_HERSHEY_SIMPLEX
    
    cv2.putText(banner, f"MDX GROUND TRUTH (f={mdx_f})", (16, 30), font, 0.60, (255, 255, 255), 2)
    cv2.putText(banner, f"NEW BLENDER RENDER (f={blend_f}) - {pct*100:.1f}%", (pw + 16, 30), font, 0.60, (100, 220, 255), 2)
    cv2.putText(banner, f"HEATMAP: {label}", (pw * 2 + 16, 30), font, 0.52, (120, 180, 255), 1)

    triptych = np.vstack([banner, np.hstack([ref_panel, cur_panel, heatmap])])
    out_file = os.path.join(out_comparisons, f"comparison_{label}.jpg")
    cv2.imwrite(out_file, triptych, [cv2.IMWRITE_JPEG_QUALITY, 90])

cap_ref.release()
print(f"Generated all comparison triptychs in {out_comparisons}!")
print("=== VERIFICATION & COMPARISON SUITE COMPLETE ===")
