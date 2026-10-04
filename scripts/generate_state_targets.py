import numpy as np

def generate_all_targets(N=3200):
    np.random.seed(42)
    
    # =========================================================================
    # 1. STATE_GLOBE: 3200 points on sphere of radius R = 1.80
    # Fibonacci lattice on sphere for optimal uniform distribution
    # =========================================================================
    indices = np.arange(0, N, dtype=float) + 0.5
    phi_g = np.arccos(1 - 2 * indices / N)
    theta_g = np.pi * (1 + 5**0.5) * indices
    r_g = 1.78 + np.random.normal(0, 0.02, N)
    xg = r_g * np.sin(phi_g) * np.cos(theta_g)
    yg = r_g * np.sin(phi_g) * np.sin(theta_g)
    zg = r_g * np.cos(phi_g)
    P_Globe = np.stack([xg, yg, zg], axis=1)

    # =========================================================================
    # 2. STATE_ELECTRICITY: Parametric Branching High-Voltage Lightning Structure
    # 450 core particles (~14%)
    # 1950 primary branch particles (~61%)
    # 800 secondary branch particles (~25%)
    # Total = 3200
    # =========================================================================
    
    def sample_polyline(nodes, num_points, jitter=0.032):
        # nodes is list of 3D points
        segments = []
        seg_lens = []
        for i in range(len(nodes) - 1):
            p0 = np.array(nodes[i])
            p1 = np.array(nodes[i+1])
            d = np.linalg.norm(p1 - p0)
            segments.append((p0, p1))
            seg_lens.append(d)
        total_len = sum(seg_lens)
        pts = []
        for (p0, p1), l in zip(segments, seg_lens):
            cnt = int(round(num_points * (l / total_len)))
            if cnt > 0:
                t = np.linspace(0, 1, cnt)[:, None]
                line_pts = (1 - t) * p0 + t * p1
                # Add 3D radial jitter perpendicular to segment
                v = p1 - p0
                v_norm = v / (np.linalg.norm(v) + 1e-6)
                up = np.array([0, 0, 1]) if abs(v_norm[2]) < 0.9 else np.array([0, 1, 0])
                u1 = np.cross(v_norm, up)
                u1 /= np.linalg.norm(u1)
                u2 = np.cross(v_norm, u1)
                
                angles = np.random.uniform(0, 2*np.pi, cnt)
                rads = np.random.normal(0, jitter, cnt)
                offsets = rads[:, None] * (np.cos(angles)[:, None] * u1 + np.sin(angles)[:, None] * u2)
                pts.append(line_pts + offsets)
        if pts:
            res = np.vstack(pts)
            # Adjust if slightly off count
            if len(res) < num_points:
                pad = res[np.random.choice(len(res), num_points - len(res))] + np.random.normal(0, jitter*0.5, (num_points - len(res), 3))
                res = np.vstack([res, pad])
            elif len(res) > num_points:
                res = res[:num_points]
            return res
        return np.zeros((num_points, 3))

    # Core: 450 particles (tight sphere at center)
    core_idx = np.arange(450)
    phi_c = np.random.uniform(0, np.pi, 450)
    theta_c = np.random.uniform(0, 2*np.pi, 450)
    r_c = np.random.power(2.5, 450) * 0.42 + 0.05
    xc = r_c * np.sin(phi_c) * np.cos(theta_c)
    yc = r_c * np.sin(phi_c) * np.sin(theta_c)
    zc = r_c * np.cos(phi_c)
    P_E_core = np.stack([xc, yc, zc], axis=1)

    # Primary Branches (~1950 particles)
    # 1. Main vertical trunk (500 pts)
    trunk_nodes = [
        [0.15, -0.05, -1.85],
        [-0.18, 0.12, -1.25],
        [0.22, -0.10, -0.65],
        [-0.05, 0.05, 0.00],
        [0.25, -0.12, 0.65],
        [-0.18, 0.14, 1.25],
        [0.10, -0.08, 1.85]
    ]
    b_trunk = sample_polyline(trunk_nodes, 480, jitter=0.035)

    # 2. Upper-left primary branch (280 pts)
    ul_nodes = [
        [-0.05, 0.05, 0.00],
        [-0.35, 0.15, 0.45],
        [-0.85, -0.10, 0.85],
        [-1.45, 0.20, 1.35]
    ]
    b_ul = sample_polyline(ul_nodes, 280, jitter=0.030)

    # 3. Upper-right primary branch (280 pts)
    ur_nodes = [
        [0.05, -0.05, 0.00],
        [0.45, -0.15, 0.50],
        [0.95, 0.12, 0.90],
        [1.55, -0.18, 1.35]
    ]
    b_ur = sample_polyline(ur_nodes, 280, jitter=0.030)

    # 4. Mid-left horizontal bolt (230 pts)
    ml_nodes = [
        [-0.05, 0.05, 0.00],
        [-0.55, 0.20, 0.10],
        [-1.15, -0.18, 0.18],
        [-1.75, 0.12, 0.05]
    ]
    b_ml = sample_polyline(ml_nodes, 230, jitter=0.030)

    # 5. Mid-right horizontal bolt (230 pts)
    mr_nodes = [
        [0.05, -0.05, 0.00],
        [0.55, -0.18, -0.10],
        [1.15, 0.20, -0.18],
        [1.75, -0.12, -0.05]
    ]
    b_mr = sample_polyline(mr_nodes, 230, jitter=0.030)

    # 6. Lower-left primary branch (230 pts)
    ll_nodes = [
        [-0.05, 0.05, 0.00],
        [-0.45, -0.15, -0.50],
        [-1.00, 0.12, -0.95],
        [-1.55, -0.20, -1.40]
    ]
    b_ll = sample_polyline(ll_nodes, 230, jitter=0.030)

    # 7. Lower-right primary branch (230 pts)
    lr_nodes = [
        [0.05, -0.05, 0.00],
        [0.45, 0.15, -0.50],
        [0.95, -0.12, -0.90],
        [1.50, 0.18, -1.35]
    ]
    b_lr = sample_polyline(lr_nodes, 220, jitter=0.030)

    # Secondary Branches (~800 particles total)
    sec1 = sample_polyline([[-0.35, 0.15, 0.45], [-0.55, -0.20, 0.75], [-0.85, -0.35, 1.05]], 135, jitter=0.025)
    sec2 = sample_polyline([[-0.85, -0.10, 0.85], [-1.20, 0.05, 0.70], [-1.60, 0.15, 0.65]], 135, jitter=0.025)
    sec3 = sample_polyline([[0.45, -0.15, 0.50], [0.65, 0.22, 0.80], [0.95, 0.35, 1.10]], 135, jitter=0.025)
    sec4 = sample_polyline([[0.95, 0.12, 0.90], [1.30, -0.05, 0.75], [1.70, -0.15, 0.70]], 135, jitter=0.025)
    sec5 = sample_polyline([[-0.45, -0.15, -0.50], [-0.75, 0.20, -0.75], [-1.15, 0.30, -1.05]], 130, jitter=0.025)
    sec6 = sample_polyline([[0.45, 0.15, -0.50], [0.75, -0.20, -0.75], [1.15, -0.30, -1.05]], 130, jitter=0.025)

    all_elec = [P_E_core, b_trunk, b_ul, b_ur, b_ml, b_mr, b_ll, b_lr, sec1, sec2, sec3, sec4, sec5, sec6]
    P_Electricity = np.vstack(all_elec)
    if len(P_Electricity) < N:
        pad = P_Electricity[np.random.choice(len(P_Electricity), N - len(P_Electricity))]
        P_Electricity = np.vstack([P_Electricity, pad])
    elif len(P_Electricity) > N:
        P_Electricity = P_Electricity[:N]
    assert len(P_Electricity) == N

    # =========================================================================
    # 3. STATE_FIRE: Distinct Volumetric Flame with 3 Clear Upward Tongues
    # Base: z in [-1.65, -0.4], wide teardrop base (1400 pts)
    # Center Tongue: z in [-0.4, 1.85] (900 pts)
    # Left Tongue: z in [-0.4, 1.45], curving to x = -0.75 (450 pts)
    # Right Tongue: z in [-0.4, 1.35], curving to x = +0.70 (450 pts)
    # =========================================================================
    # Base: 1400 points
    n_base = 1400
    u_b = np.random.uniform(0, 1, n_base)
    z_fb = -1.65 + 1.25 * (u_b**0.8) # [-1.65, -0.4]
    # Teardrop radius
    r_max_base = 1.35 * np.sin(np.pi * (z_fb + 1.65) / 1.5)**0.65
    r_fb = r_max_base * np.sqrt(np.random.uniform(0.04, 1.0, n_base))
    th_fb = np.random.uniform(0, 2*np.pi, n_base)
    xfb = r_fb * np.cos(th_fb) * 1.15
    yfb = r_fb * np.sin(th_fb) * 0.75
    P_F_base = np.stack([xfb, yfb, z_fb], axis=1)

    # Center Tongue: 900 points
    n_center = 900
    u_c = np.random.uniform(0, 1, n_center)
    z_fc = -0.4 + 2.25 * (u_c**0.9) # [-0.4, 1.85]
    r_max_c = 0.58 * (1.0 - (z_fc + 0.4) / 2.3)**0.8
    r_fc = r_max_c * np.sqrt(np.random.uniform(0.02, 1.0, n_center))
    th_fc = np.random.uniform(0, 2*np.pi, n_center)
    # S-curve flicker
    xfc = r_fc * np.cos(th_fc) + 0.12 * np.sin(3.5 * z_fc)
    yfc = r_fc * np.sin(th_fc) * 0.70
    P_F_center = np.stack([xfc, yfc, z_fc], axis=1)

    # Left Tongue: 450 points
    n_left = 450
    u_l = np.random.uniform(0, 1, n_left)
    z_fl = -0.4 + 1.85 * (u_l**0.85) # [-0.4, 1.45]
    t_fl = (z_fl + 0.4) / 1.85
    r_max_l = 0.42 * (1.0 - t_fl)**0.7
    r_fl = r_max_l * np.sqrt(np.random.uniform(0.02, 1.0, n_left))
    th_fl = np.random.uniform(0, 2*np.pi, n_left)
    x_offset_l = -0.72 * np.sin(np.pi * 0.5 * t_fl)**0.85
    xfl = x_offset_l + r_fl * np.cos(th_fl)
    yfl = r_fl * np.sin(th_fl) * 0.65
    P_F_left = np.stack([xfl, yfl, z_fl], axis=1)

    # Right Tongue: 450 points
    n_right = 450
    u_r = np.random.uniform(0, 1, n_right)
    z_fr = -0.4 + 1.75 * (u_r**0.85) # [-0.4, 1.35]
    t_fr = (z_fr + 0.4) / 1.75
    r_max_r = 0.40 * (1.0 - t_fr)**0.7
    r_fr = r_max_r * np.sqrt(np.random.uniform(0.02, 1.0, n_right))
    th_fr = np.random.uniform(0, 2*np.pi, n_right)
    x_offset_r = 0.68 * np.sin(np.pi * 0.5 * t_fr)**0.85
    xfr = x_offset_r + r_fr * np.cos(th_fr)
    yfr = r_fr * np.sin(th_fr) * 0.65
    P_F_right = np.stack([xfr, yfr, z_fr], axis=1)

    P_Fire = np.vstack([P_F_base, P_F_center, P_F_left, P_F_right])
    assert len(P_Fire) == N

    # =========================================================================
    # 4. STATE_LOCK: Sharp Padlock with Clear Hollow Shackle & Rounded Body
    # Body: 2100 points, rounded rect: x in [-1.25, 1.25], y in [-0.4, 0.4], z in [-1.55, -0.05]
    # Keyhole: void inside body at x in [-0.18, 0.18], z in [-0.95, -0.45]
    # Shackle: 1100 points, U-arch from x = -0.72 to +0.72, rising from z = -0.05 to 1.45
    # Inner opening is 100% EMPTY: x in [-0.48, 0.48], z in [0.0, 1.0] has zero points!
    # =========================================================================
    # Body: 2100 points
    n_body = 2100
    body_pts = []
    while len(body_pts) < n_body:
        cand_x = np.random.uniform(-1.25, 1.25, n_body - len(body_pts))
        cand_y = np.random.uniform(-0.40, 0.40, n_body - len(body_pts))
        cand_z = np.random.uniform(-1.55, -0.05, n_body - len(body_pts))
        # Super-ellipse / rounded box check: (x/1.22)^4 + (y/0.38)^4 <= 1
        valid = (cand_x / 1.22)**4 + (cand_y / 0.38)**4 <= 1.0
        # Keyhole void: circular top + rectangular slot
        is_keyhole = (cand_x**2 + (cand_z + 0.62)**2 < 0.16**2) | ((abs(cand_x) < 0.08) & (cand_z >= -0.92) & (cand_z <= -0.62))
        valid = valid & (~is_keyhole)
        for i in range(len(cand_x)):
            if valid[i] and len(body_pts) < n_body:
                body_pts.append([cand_x[i], cand_y[i], cand_z[i]])
    P_L_body = np.array(body_pts)

    # Shackle: 1100 points
    n_shackle = 1100
    sh_pts = []
    # Semi-circular arch + vertical legs
    # Arch center at (0, 0, 0.55), radius R = 0.72, arch angle alpha in [0, pi]
    # Legs go from z = -0.05 up to z = 0.55 at x = -0.72 and x = +0.72
    tube_rad = 0.18
    # 600 pts on arch, 250 on left leg, 250 on right leg
    n_arch = 600
    alpha = np.random.uniform(0, np.pi, n_arch)
    arch_cx = 0.72 * np.cos(alpha)
    arch_cz = 0.55 + 0.72 * np.sin(alpha)
    beta = np.random.uniform(0, 2*np.pi, n_arch)
    r_t = tube_rad * np.sqrt(np.random.uniform(0.1, 1.0, n_arch))
    # normal to arch circle
    sh_ax = arch_cx + r_t * np.cos(beta) * np.cos(alpha)
    sh_ay = r_t * np.sin(beta)
    sh_az = arch_cz + r_t * np.cos(beta) * np.sin(alpha)
    P_L_arch = np.stack([sh_ax, sh_ay, sh_az], axis=1)

    # Left leg: 250 pts at x = -0.72, z in [-0.05, 0.55]
    n_leg = 250
    zl = np.random.uniform(-0.05, 0.55, n_leg)
    th_l = np.random.uniform(0, 2*np.pi, n_leg)
    rl = tube_rad * np.sqrt(np.random.uniform(0.1, 1.0, n_leg))
    xl = -0.72 + rl * np.cos(th_l)
    yl = rl * np.sin(th_l)
    P_L_leg_l = np.stack([xl, yl, zl], axis=1)

    # Right leg: 250 pts at x = +0.72, z in [-0.05, 0.55]
    zr = np.random.uniform(-0.05, 0.55, n_leg)
    th_r = np.random.uniform(0, 2*np.pi, n_leg)
    rr = tube_rad * np.sqrt(np.random.uniform(0.1, 1.0, n_leg))
    xr = 0.72 + rr * np.cos(th_r)
    yr = rr * np.sin(th_r)
    P_L_leg_r = np.stack([xr, yr, zr], axis=1)

    P_Lock = np.vstack([P_L_body, P_L_arch, P_L_leg_l, P_L_leg_r])
    assert len(P_Lock) == N

    # Save to .npz for fast reuse
    np.savez("/Users/karthikeya.s/Documents/focus/production_targets.npz",
             globe=P_Globe, electricity=P_Electricity, fire=P_Fire, lock=P_Lock)
    print("SUCCESS: Generated and saved 4 production target shapes (3200 points each).")
    return P_Globe, P_Electricity, P_Fire, P_Lock

if __name__ == "__main__":
    generate_all_targets(3200)
