import numpy as np
import cv2
import os

N = 3200
np.random.seed(42)

def generate_globe(scale=1.18):
    # Fibonacci sphere with subtle volumetric shell
    r_base = 2.0 * scale
    pts = np.zeros((N, 3))
    phi = (1 + np.sqrt(5)) / 2
    for i in range(N):
        y = 1 - (i / float(N - 1)) * 2
        radius = np.sqrt(max(0, 1 - y * y))
        theta = 2 * np.pi * i / phi
        x = np.cos(theta) * radius
        z = np.sin(theta) * radius
        # Slight radial jitter for realistic depth (shell thickness ~ 0.12)
        r = r_base * (1.0 + np.random.normal(0, 0.035))
        pts[i] = [x * r, y * r, z * r]
    return pts

def create_lightning_branch(start_pt, end_pt, count, roughness=0.28, num_kinks=4):
    """Generates a jagged lightning path with high-frequency dielectric kinks."""
    t = np.linspace(0, 1, count)
    dir_vec = end_pt - start_pt
    length = np.linalg.norm(dir_vec)
    d = dir_vec / (length if length > 1e-4 else 1.0)
    
    # Perpendicular basis
    ref = np.array([0, 0, 1]) if abs(d[2]) < 0.9 else np.array([1, 0, 0])
    p1 = np.cross(d, ref)
    p1 /= np.linalg.norm(p1)
    p2 = np.cross(d, p1)
    
    # Generate sharp kinks
    kink_t = np.sort(np.random.uniform(0.15, 0.85, num_kinks))
    kink_disp = np.random.normal(0, roughness * length, (num_kinks, 2))
    
    disp_xy = np.zeros((count, 2))
    for i in range(num_kinks):
        kt = kink_t[i]
        sigma = 0.18
        weight = np.exp(-((t - kt)**2) / (2 * sigma**2))
        disp_xy += weight[:, None] * kink_disp[i][None, :]
    
    # High frequency micro jitter
    jitter = np.random.normal(0, 0.04 * length, (count, 3))
    
    base_pts = np.outer(1 - t, start_pt) + np.outer(t, end_pt)
    final_pts = base_pts + disp_xy[:, 0:1] * p1 + disp_xy[:, 1:2] * p2 + jitter
    return final_pts

def generate_electricity(scale=1.18):
    s = scale
    pts = []
    
    # 1. Central Energy Core (~380 particles, 12%)
    n_core = 380
    core_pts = np.random.normal(0, 0.28 * s, (n_core, 3))
    # Keep core concentrated
    core_r = np.linalg.norm(core_pts, axis=1)
    core_pts = core_pts[core_r < 0.55 * s]
    while len(core_pts) < n_core:
        extra = np.random.normal(0, 0.28 * s, (n_core - len(core_pts), 3))
        core_pts = np.vstack([core_pts, extra])
    pts.append(core_pts)
    
    # 2. Main Vertical Trunk (2 segments: Center -> Top, Center -> Bottom)
    # Total trunk = 520 particles
    p_top = np.array([0.15 * s, -0.1 * s, 2.35 * s])
    p_bot = np.array([-0.2 * s, 0.15 * s, -2.35 * s])
    origin = np.array([0, 0, 0])
    
    trunk_up = create_lightning_branch(origin, p_top, 260, roughness=0.26, num_kinks=5)
    trunk_down = create_lightning_branch(origin, p_bot, 260, roughness=0.26, num_kinks=5)
    pts.append(trunk_up)
    pts.append(trunk_down)
    
    # 3. Primary Diagonal & Horizontal Branches (~1300 particles)
    # Radiating in 3D so it looks electrical from ALL angles!
    branches = [
        # (Start, End, count, roughness)
        # Upper Left major fork
        (origin, np.array([-1.9 * s, 0.3 * s, 1.4 * s]), 220, 0.30),
        # Upper Right major fork
        (origin, np.array([1.8 * s, -0.4 * s, 1.5 * s]), 220, 0.30),
        # Mid Left horizontal fork
        (origin, np.array([-2.1 * s, -0.3 * s, 0.2 * s]), 220, 0.28),
        # Mid Right horizontal fork
        (origin, np.array([2.0 * s, 0.4 * s, -0.1 * s]), 220, 0.28),
        # Lower Left fork
        (origin, np.array([-1.7 * s, -0.4 * s, -1.6 * s]), 210, 0.30),
        # Lower Right fork
        (origin, np.array([1.8 * s, 0.3 * s, -1.5 * s]), 210, 0.30),
    ]
    
    branch_pts_list = []
    for b_start, b_end, b_count, b_rough in branches:
        b_pts = create_lightning_branch(b_start, b_end, b_count, roughness=b_rough, num_kinks=4)
        pts.append(b_pts)
        branch_pts_list.append((b_pts, b_end))
        
    # 4. Secondary Sub-branches splitting off primary branches (~1000 particles)
    # Sub-branches split off at ~0.4 - 0.7 along the branch
    sec_branches = [
        # Off Upper Left
        (0.55, 0, np.array([-2.3 * s, 0.8 * s, 0.8 * s]), 110),
        (0.70, 0, np.array([-1.5 * s, -0.5 * s, 2.1 * s]), 110),
        # Off Upper Right
        (0.50, 1, np.array([2.2 * s, -0.9 * s, 0.9 * s]), 110),
        (0.75, 1, np.array([1.3 * s, 0.6 * s, 2.2 * s]), 110),
        # Off Mid Left
        (0.60, 2, np.array([-2.4 * s, 0.5 * s, -0.5 * s]), 110),
        # Off Mid Right
        (0.55, 3, np.array([2.3 * s, -0.6 * s, 0.5 * s]), 110),
        # Off Lower Left
        (0.60, 4, np.array([-1.2 * s, 0.6 * s, -2.2 * s]), 110),
        # Off Lower Right
        (0.60, 5, np.array([1.3 * s, -0.7 * s, -2.1 * s]), 110),
        # Off Vertical Trunk Top
        (trunk_up[int(len(trunk_up)*0.65)], np.array([0.9 * s, -0.6 * s, 2.0 * s]), 115),
        # Off Vertical Trunk Bottom
        (trunk_down[int(len(trunk_down)*0.65)], np.array([-0.8 * s, 0.7 * s, -1.9 * s]), 115),
    ]
    
    for item in sec_branches:
        if isinstance(item[0], float):
            frac, b_idx, end_p, count = item
            b_pts = branch_pts_list[b_idx][0]
            start_p = b_pts[int(len(b_pts) * frac)]
        else:
            start_p, end_p, count = item
        s_pts = create_lightning_branch(start_p, end_p, count, roughness=0.35, num_kinks=3)
        pts.append(s_pts)
        
    all_pts = np.vstack(pts)
    # Trim or pad to exactly N
    if len(all_pts) > N:
        all_pts = all_pts[:N]
    elif len(all_pts) < N:
        diff = N - len(all_pts)
        extra = all_pts[np.random.choice(len(all_pts), diff)] + np.random.normal(0, 0.03, (diff, 3))
        all_pts = np.vstack([all_pts, extra])
        
    assert len(all_pts) == N
    return all_pts

def generate_fire(scale=1.18):
    s = scale
    pts = []
    
    # Fire structure:
    # 1. Base / Ember bowl (denser lower body) ~1200 particles
    n_base = 1200
    for _ in range(n_base):
        u = np.random.uniform(0, 1)
        z = -1.8 * s + u * 1.4 * s  # z: -1.8 to -0.4
        # Radius expands then contracts
        r_max = 1.35 * s * np.sin(np.pi * u * 0.75)
        r = r_max * np.sqrt(np.random.uniform(0.1, 1.0))
        theta = np.random.uniform(0, 2*np.pi)
        x = r * np.cos(theta)
        y = r * np.sin(theta) * 0.75 # slightly flattened depth
        # add upward draft bias
        x += np.sin(z * 2.0) * 0.15 * s
        pts.append([x, y, z])
        
    # 2. Main Central Flame Tongue ~900 particles
    n_center = 900
    for i in range(n_center):
        t = i / float(n_center)
        z = -0.4 * s + t * 2.7 * s  # up to z = +2.3s
        # S-curve oscillation
        curl = np.sin(t * 3.5) * 0.35 * s
        twist = np.cos(t * 2.8) * 0.25 * s
        # Width tapers with height
        w = 0.75 * s * (1 - t)**0.65
        r = w * np.sqrt(np.random.uniform(0, 1))
        theta = np.random.uniform(0, 2*np.pi)
        x = curl + r * np.cos(theta)
        y = twist + r * np.sin(theta) * 0.7
        pts.append([x, y, z])
        
    # 3. Left Flame Tongue ~500 particles
    n_left = 500
    for i in range(n_left):
        t = i / float(n_left)
        z = -0.6 * s + t * 2.1 * s
        x_curve = -0.6 * s - np.sin(t * 2.5) * 0.55 * s
        y_curve = np.cos(t * 3.0) * 0.2 * s
        w = 0.5 * s * (1 - t)**0.5
        r = w * np.sqrt(np.random.uniform(0, 1))
        theta = np.random.uniform(0, 2*np.pi)
        pts.append([x_curve + r * np.cos(theta), y_curve + r * np.sin(theta), z])
        
    # 4. Right Flame Tongue ~450 particles
    n_right = 450
    for i in range(n_right):
        t = i / float(n_right)
        z = -0.5 * s + t * 2.2 * s
        x_curve = 0.6 * s + np.sin(t * 2.6) * 0.5 * s
        y_curve = -np.cos(t * 2.5) * 0.2 * s
        w = 0.48 * s * (1 - t)**0.5
        r = w * np.sqrt(np.random.uniform(0, 1))
        theta = np.random.uniform(0, 2*np.pi)
        pts.append([x_curve + r * np.cos(theta), y_curve + r * np.sin(theta), z])
        
    # 5. Rising Spark Tendrils ~150 particles
    n_sparks = 150
    for _ in range(n_sparks):
        z = np.random.uniform(1.8 * s, 2.7 * s)
        x = np.random.normal(0, 0.45 * s)
        y = np.random.normal(0, 0.3 * s)
        pts.append([x, y, z])
        
    all_pts = np.array(pts)
    if len(all_pts) > N: all_pts = all_pts[:N]
    elif len(all_pts) < N:
        diff = N - len(all_pts)
        extra = all_pts[np.random.choice(len(all_pts), diff)]
        all_pts = np.vstack([all_pts, extra])
    return all_pts

def generate_lock(scale=1.18):
    s = scale
    pts = []
    
    # 1. Shackle Arch (~1150 particles)
    # Inverted U-shape arch: top circle segment + 2 vertical legs
    n_arch = 700
    # Outer radius 0.95s, tube thickness 0.18s
    # Arch spans from theta = 0 to pi (top half)
    theta = np.linspace(0, np.pi, n_arch)
    arch_r = 0.92 * s
    arch_z_base = 0.3 * s
    for i in range(n_arch):
        th = theta[i]
        # Main torus center
        cx = arch_r * np.cos(th)
        cz = arch_z_base + arch_r * np.sin(th)
        # Tube jitter
        tube_r = 0.16 * s * np.sqrt(np.random.uniform(0.1, 1.0))
        phi = np.random.uniform(0, 2*np.pi)
        x = cx + tube_r * np.cos(phi) * np.sin(th)
        z = cz + tube_r * np.sin(phi)
        y = tube_r * np.cos(phi) * np.cos(th)
        pts.append([x, y, z])
        
    # Shackle vertical legs into body
    n_legs = 450
    for i in range(n_legs // 2):
        # Left leg (x ~ -arch_r)
        z = np.random.uniform(-0.1 * s, arch_z_base)
        x = -arch_r + np.random.normal(0, 0.12 * s)
        y = np.random.normal(0, 0.12 * s)
        pts.append([x, y, z])
    for i in range(n_legs // 2):
        # Right leg (x ~ +arch_r)
        z = np.random.uniform(-0.1 * s, arch_z_base)
        x = arch_r + np.random.normal(0, 0.12 * s)
        y = np.random.normal(0, 0.12 * s)
        pts.append([x, y, z])
        
    # 2. Lock Body (~1800 particles)
    # Rounded rectangular block: x in [-1.5s, 1.5s], z in [-1.8s, 0.2s], y in [-0.4s, 0.4s]
    # With keyhole cutout!
    n_body = 1800
    body_pts = []
    while len(body_pts) < n_body:
        x = np.random.uniform(-1.5 * s, 1.5 * s)
        z = np.random.uniform(-1.8 * s, 0.2 * s)
        y = np.random.uniform(-0.38 * s, 0.38 * s)
        
        # Round the corners of the box
        # distance from corner centers
        corner_r = 0.3 * s
        dx = max(0, abs(x) - (1.5 * s - corner_r))
        dz = max(0, abs(z - (-0.8 * s)) - (1.0 * s - corner_r))
        if dx**2 + dz**2 > corner_r**2:
            continue
            
        # Keyhole exclusion / negative space:
        # circle at (0, -0.6s) radius 0.25s + wedge down to -1.2s
        dist_key_circ = np.sqrt(x**2 + (z - (-0.6 * s))**2)
        in_keyhole_circle = dist_key_circ < 0.24 * s
        in_keyhole_slot = (abs(x) < 0.14 * s) and (-1.2 * s < z < -0.6 * s)
        if in_keyhole_circle or in_keyhole_slot:
            # Skip points inside keyhole cutout to make it visible!
            continue
            
        body_pts.append([x, y, z])
    pts.extend(body_pts)
    
    # 3. Keyhole Outline Rim (~250 particles) to give crisp keyhole definition!
    n_rim = 250
    rim_th = np.linspace(0, 2*np.pi, 150)
    for th in rim_th:
        x = 0.26 * s * np.cos(th)
        z = -0.6 * s + 0.26 * s * np.sin(th)
        y = np.random.uniform(-0.4 * s, 0.4 * s)
        pts.append([x, y, z])
    for z in np.linspace(-1.2 * s, -0.6 * s, 50):
        pts.append([-0.15 * s, np.random.uniform(-0.4*s, 0.4*s), z])
        pts.append([0.15 * s, np.random.uniform(-0.4*s, 0.4*s), z])
        
    all_pts = np.array(pts)
    if len(all_pts) > N: all_pts = all_pts[:N]
    elif len(all_pts) < N:
        diff = N - len(all_pts)
        extra = all_pts[np.random.choice(len(all_pts), diff)]
        all_pts = np.vstack([all_pts, extra])
    return all_pts

print("Generating target states...")
P_globe = generate_globe(1.18)
P_elec = generate_electricity(1.18)
P_fire = generate_fire(1.18)
P_lock = generate_lock(1.18)

np.save("/Users/karthikeya.s/Documents/focus/target_globe.npy", P_globe)
np.save("/Users/karthikeya.s/Documents/focus/target_electricity.npy", P_elec)
np.save("/Users/karthikeya.s/Documents/focus/target_fire.npy", P_fire)
np.save("/Users/karthikeya.s/Documents/focus/target_lock.npy", P_lock)
print("Saved all 4 target states to .npy files!")
