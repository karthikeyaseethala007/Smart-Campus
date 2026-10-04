import os
import sys
import time
import subprocess
import cv2
import numpy as np

chrome_bin = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
out_dir = "/Users/karthikeya.s/.gemini/antigravity-ide/brain/22ef5f52-84c8-42d0-93f2-3b0506e3f1da/verification"
os.makedirs(out_dir, exist_ok=True)
comp_dir = os.path.join(out_dir, "comparisons")
os.makedirs(comp_dir, exist_ok=True)

states = [
    {
        "id": "01_hero_beginning",
        "url": "http://localhost:5173/?skipIntro=true&scrollTo=0",
        "ref": "references/mdx-analysis/cropped_viewport_moments/vp_000pct_f0000_t0.00s.png",
        "desc": "Hero Beginning (Globe State, Uninterrupted Background)"
    },
    {
        "id": "02_hero_middle",
        "url": "http://localhost:5173/?skipIntro=true&scrollTo=750",
        "ref": "references/mdx-analysis/cropped_viewport_moments/vp_010pct_f0154_t3.13s.png",
        "desc": "Hero Middle (Electricity Morph, Centered Particle)"
    },
    {
        "id": "03_hero_end",
        "url": "http://localhost:5173/?skipIntro=true&scrollTo=1600",
        "ref": "references/mdx-analysis/cropped_viewport_moments/vp_020pct_f0307_t6.25s.png",
        "desc": "Hero End (Lock State, 25%+ Bottom Clearance)"
    },
    {
        "id": "04_editorial_scene",
        "url": "http://localhost:5173/?skipIntro=true&scrollTo=2700",
        "ref": "references/mdx-analysis/cropped_viewport_moments/vp_030pct_f0460_t9.36s.png",
        "desc": "Editorial Scene (One Campus. One Connected Response.)"
    },
    {
        "id": "05_cinematic_stage",
        "url": "http://localhost:5173/?skipIntro=true&scrollTo=4200",
        "ref": "references/mdx-analysis/cropped_viewport_moments/vp_050pct_f0768_t15.62s.png",
        "desc": "Cinematic Experience Stage (Large Dark Curved Box)"
    },
    {
        "id": "06_four_pillars_scene",
        "url": "http://localhost:5173/?skipIntro=true&scrollTo=5600",
        "ref": "references/mdx-analysis/cropped_viewport_moments/vp_060pct_f0921_t18.74s.png",
        "desc": "Four Pillars Scene (Center Particle + 4 Orbit Capsules)"
    },
    {
        "id": "07_dark_showcase",
        "url": "http://localhost:5173/?skipIntro=true&scrollTo=6800",
        "ref": "references/mdx-analysis/cropped_viewport_moments/vp_070pct_f1074_t21.85s.png",
        "desc": "Dark Showcase (Physical Sheet Takeover, 3D Asset Cards)"
    },
    {
        "id": "08_contact_scene",
        "url": "http://localhost:5173/?skipIntro=true&scrollTo=8000",
        "ref": "references/mdx-analysis/cropped_viewport_moments/vp_080pct_f1228_t24.98s.png",
        "desc": "Contact Entry Scene (Enter Campus Command Center)"
    },
    {
        "id": "09_footer",
        "url": "http://localhost:5173/?skipIntro=true&scrollTo=9500",
        "ref": "references/mdx-analysis/cropped_viewport_moments/vp_100pct_f1520_t30.92s.png",
        "desc": "Massive Editorial Footer (SMART CAMPUS Wordmark)"
    },
    {
        "id": "10_menu_closed",
        "url": "http://localhost:5173/?skipIntro=true&scrollTo=0",
        "ref": "references/mdx-analysis/cropped_viewport_moments/vp_000pct_f0000_t0.00s.png",
        "desc": "Menu Closed (Header with Signature 2-Line Trigger)"
    },
    {
        "id": "11_menu_opened",
        "url": "http://localhost:5173/?skipIntro=true&menu=open",
        "ref": "references/preview_menu_on_black.png",
        "desc": "Fullscreen Menu Opened (Dedicated Editorial Navigation Layer)"
    }
]

print("==================================================")
print("CAPTURING ALL 11 VERIFICATION STATES VIA CHROME")
print("==================================================")

results = []

for idx, state in enumerate(states):
    shot_path = os.path.join(out_dir, f"{state['id']}.png")
    cmd = [
        chrome_bin,
        "--headless",
        f"--screenshot={shot_path}",
        "--window-size=1440,900",
        state["url"]
    ]
    print(f"[{idx+1}/{len(states)}] Capturing {state['id']} ({state['desc']})...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(shot_path):
        size = os.path.getsize(shot_path)
        print(f"  -> Captured {size:,} bytes")
        results.append((state, shot_path))
    else:
        print(f"  -> Failed to capture {state['id']}!")

print(f"\nSuccessfully captured {len(results)}/{len(states)} states!")

print("\n==================================================")
print("BUILDING SIDE-BY-SIDE VISUAL COMPARISON SUITE")
print("==================================================")

for state, shot_path in results:
    shot = cv2.imread(shot_path)
    ref_path = state.get("ref")
    comp_path = os.path.join(comp_dir, f"compare_{state['id']}.png")
    
    if ref_path and os.path.exists(ref_path):
        ref = cv2.imread(ref_path)
        # Normalize heights for side-by-side
        target_h = 720
        target_w = int(shot.shape[1] * (target_h / shot.shape[0]))
        shot_resized = cv2.resize(shot, (target_w, target_h), interpolation=cv2.INTER_AREA)
        
        ref_w = int(ref.shape[1] * (target_h / ref.shape[0]))
        ref_resized = cv2.resize(ref, (ref_w, target_h), interpolation=cv2.INTER_AREA)
        
        # Add labels
        header_h = 50
        panel = np.zeros((target_h + header_h, ref_w + target_w + 20, 3), dtype=np.uint8)
        panel[:] = [20, 24, 30] # dark background
        
        # Put labels
        cv2.putText(panel, "MDX REFERENCE (Ground Truth)", (20, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 2)
        cv2.putText(panel, f"SMART CAMPUS IMPLEMENTATION: {state['desc']}", (ref_w + 30, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 180, 255), 2)
        
        # Place images
        panel[header_h:, :ref_w] = ref_resized
        panel[header_h:, ref_w + 20:] = shot_resized
        
        cv2.imwrite(comp_path, panel, [cv2.IMWRITE_PNG_COMPRESSION, 4])
        print(f"Saved side-by-side comparison: {os.path.basename(comp_path)}")
    else:
        print(f"Reference not available for {state['id']}, skipping side-by-side")

print("\nAll comparison assets generated in:", comp_dir)
