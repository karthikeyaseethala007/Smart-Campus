import os
from PIL import Image, ImageDraw, ImageFont

out_dir = "/Users/karthikeya.s/Documents/focus/diagnostic_frames"

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

cols = 4
rows = 5
thumb_w = 480
thumb_h = 270
header_h = 42
cell_w = thumb_w
cell_h = thumb_h + header_h

sheet_w = cols * cell_w
sheet_h = rows * cell_h + 80

contact_sheet = Image.new("RGB", (sheet_w, sheet_h), color=(22, 22, 26))
draw = ImageDraw.Draw(contact_sheet)

try:
    title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 26)
    label_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 17)
except Exception:
    title_font = ImageFont.load_default()
    label_font = ImageFont.load_default()

draw.text((sheet_w // 2, 40), "HERO PARTICLE SYSTEM: 4-STATE TRANSITION DIAGNOSTIC CONTACT SHEET", fill=(255, 255, 255), anchor="mm", font=title_font)

for idx, (frame_num, label) in enumerate(diagnostic_frames):
    img_path = os.path.join(out_dir, f"diag_frame_{frame_num:03d}.png")
    if not os.path.exists(img_path):
        print(f"Warning: {img_path} not found!")
        continue
    
    c = idx % cols
    r = idx // cols
    x = c * cell_w
    y = 80 + r * cell_h
    
    img = Image.open(img_path)
    img = img.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
    contact_sheet.paste(img, (x, y))
    
    # Label bar
    draw.rectangle([x, y + thumb_h, x + cell_w, y + cell_h], fill=(16, 16, 20))
    draw.rectangle([x, y, x + cell_w, y + cell_h], outline=(45, 45, 55), width=1)
    
    # Color badge based on state
    if "GLOBE" in label:
        tag_color = (120, 190, 255)
    elif "ELECTRICITY" in label or "Elec" in label:
        tag_color = (255, 215, 60)
    elif "FIRE" in label or "Fire" in label:
        tag_color = (255, 110, 60)
    elif "LOCK" in label or "Lock" in label:
        tag_color = (130, 235, 130)
    else:
        tag_color = (220, 220, 230)
        
    draw.text((x + cell_w // 2, y + thumb_h + header_h // 2), label, fill=tag_color, anchor="mm", font=label_font)

out_sheet_path = "/Users/karthikeya.s/Documents/focus/diagnostic_contact_sheet.png"
contact_sheet.save(out_sheet_path, quality=95)
print(f"Saved contact sheet to {out_sheet_path}")
