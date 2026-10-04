import bpy
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
print(f"Loading {blend_path}")
bpy.ops.wm.open_mainfile(filepath=blend_path)

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'GPU'
scene.cycles.samples = 16
scene.cycles.use_denoising = True
scene.render.resolution_x = 960
scene.render.resolution_y = 540
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'

out_dir = "/Users/karthikeya.s/Documents/focus/diagnostic_frames"
os.makedirs(out_dir, exist_ok=True)

diagnostic_frames = [
    (1, "Frame 1: GLOBE (Hold)"),
    (30, "Frame 30: GLOBE (Hold)"),
    (40, "Frame 40: Globe Pre-Distort"),
    (50, "Frame 50: Energy Swirl/Expand"),
    (60, "Frame 60: Transition to Elec"),
    (70, "Frame 70: Settle into Elec"),
    (80, "Frame 80: ELECTRICITY (Hold)"),
    (105, "Frame 105: ELECTRICITY (Hold)"),
    (115, "Frame 115: Elec Pre-Fire Drift"),
    (125, "Frame 125: Fire Energy Bloom"),
    (135, "Frame 135: Transition to Fire"),
    (145, "Frame 145: Settle into Fire"),
    (160, "Frame 160: FIRE (Hold)"),
    (175, "Frame 175: FIRE (Hold)"),
    (185, "Frame 185: Fire Pre-Lock Cool"),
    (195, "Frame 195: Reorganize / Arch"),
    (205, "Frame 205: Transition to Lock"),
    (215, "Frame 215: Settle into Lock"),
    (230, "Frame 230: LOCK (Hold)"),
    (240, "Frame 240: LOCK (Hold)"),
]

print(f"Rendering {len(diagnostic_frames)} diagnostic frames...")
rendered_images = []

for frame_num, label in diagnostic_frames:
    scene.frame_set(frame_num)
    frame_path = os.path.join(out_dir, f"diag_frame_{frame_num:03d}.png")
    scene.render.filepath = frame_path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered: {label} -> {frame_path}")
    rendered_images.append((frame_path, label))

print("All diagnostic frames rendered. Generating contact sheet...")

# Build Contact Sheet: 4 columns x 5 rows
cols = 4
rows = 5
thumb_w = 480
thumb_h = 270
header_h = 40
cell_w = thumb_w
cell_h = thumb_h + header_h

sheet_w = cols * cell_w
sheet_h = rows * cell_h + 80 # Extra title bar at top

contact_sheet = Image.new("RGB", (sheet_w, sheet_h), color=(26, 26, 30))
draw = ImageDraw.Draw(contact_sheet)

# Title
try:
    title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
    label_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
except Exception:
    title_font = ImageFont.load_default()
    label_font = ImageFont.load_default()

draw.text((sheet_w // 2, 40), "HERO PARTICLE SYSTEM: 4-STATE TRANSITION AUDIT (20 DIAGNOSTIC FRAMES)", fill=(255, 255, 255), anchor="mm", font=title_font)

for idx, (img_path, label) in enumerate(rendered_images):
    c = idx % cols
    r = idx // cols
    x = c * cell_w
    y = 80 + r * cell_h
    
    # Load and resize thumbnail
    img = Image.open(img_path)
    img = img.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
    contact_sheet.paste(img, (x, y))
    
    # Draw label bar underneath
    draw.rectangle([x, y + thumb_h, x + cell_w, y + cell_h], fill=(18, 18, 22))
    draw.rectangle([x, y, x + cell_w, y + cell_h], outline=(50, 50, 60), width=1)
    
    # State color tag
    if "GLOBE" in label:
        tag_color = (100, 180, 255)
    elif "ELECTRICITY" in label:
        tag_color = (255, 215, 0)
    elif "FIRE" in label:
        tag_color = (255, 100, 50)
    elif "LOCK" in label:
        tag_color = (120, 230, 120)
    else:
        tag_color = (200, 200, 210)
        
    draw.text((x + cell_w // 2, y + thumb_h + header_h // 2), label, fill=tag_color, anchor="mm", font=label_font)

contact_sheet_path = "/Users/karthikeya.s/Documents/focus/diagnostic_contact_sheet.png"
contact_sheet.save(contact_sheet_path, quality=95)
print(f"SUCCESS: Contact sheet saved to {contact_sheet_path}")

