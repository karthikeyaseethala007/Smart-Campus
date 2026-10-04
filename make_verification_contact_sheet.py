import cv2
import os
import numpy as np

img_dir = '/Users/karthikeya.s/Documents/focus/test_new_shapes'
states = [
    ('STATE_GLOBE', 'STATE_GLOBE'),
    ('STATE_ELECTRICITY', 'STATE_ELECTRICITY'),
    ('STATE_FIRE', 'STATE_FIRE'),
    ('STATE_LOCK', 'STATE_LOCK')
]

panels = []
crop_size = 480
header_h = 60

for file_id, label in states:
    p = os.path.join(img_dir, f'{file_id}.png')
    im = cv2.imread(p, cv2.IMREAD_UNCHANGED)
    if im is None:
        raise FileNotFoundError(f'Missing {p}')
        
    alpha = im[:, :, 3] / 255.0
    rgb = im[:, :, :3]
    bg = np.full_like(rgb, 18) # Dark aesthetic slate
    comp = (rgb * alpha[:, :, None] + bg * (1.0 - alpha[:, :, None])).astype(np.uint8)
    
    # Center crop around 480x480
    h, w, _ = comp.shape
    cy, cx = h // 2, w // 2
    y1 = max(0, cy - crop_size // 2)
    y2 = min(h, y1 + crop_size)
    x1 = max(0, cx - crop_size // 2)
    x2 = min(w, x1 + crop_size)
    
    crop = comp[y1:y2, x1:x2].copy()
    
    # Create panel with header
    panel = np.zeros((crop_size + header_h, crop_size, 3), dtype=np.uint8)
    panel[:] = [14, 18, 24] # Dark frame
    
    # Label
    cv2.putText(panel, label, (20, 38), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 210, 255), 2, cv2.LINE_AA)
    
    # Border line
    cv2.line(panel, (0, header_h - 1), (crop_size, header_h - 1), (40, 50, 65), 1)
    
    panel[header_h:, :] = crop
    panels.append(panel)

sheet = np.hstack(panels)
out_path = '/Users/karthikeya.s/.gemini/antigravity-ide/brain/22ef5f52-84c8-42d0-93f2-3b0506e3f1da/state_readability_contact_sheet.png'
cv2.imwrite(out_path, sheet)
print(f'Contact sheet successfully written to: {out_path} ({sheet.shape[1]}x{sheet.shape[0]})')
