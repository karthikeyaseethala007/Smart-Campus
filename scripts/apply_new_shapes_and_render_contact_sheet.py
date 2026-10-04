import bpy
import numpy as np
import os
import time

filepath = "/Users/karthikeya.s/Documents/focus/hero_particle_animation.blend"
bpy.ops.wm.open_mainfile(filepath=filepath)

targets = np.load("/Users/karthikeya.s/Documents/focus/production_targets.npz")
P_Globe = targets['globe']
P_Elec = targets['electricity']
P_Fire = targets['fire']
P_Lock = targets['lock']

p_obj = bpy.data.objects['Hero_Particle_System']
mesh = p_obj.data
N = len(mesh.vertices)
assert N == 3200, f"Expected 3200 vertices, found {N}"

# Update basis mesh vertices to Globe
for i in range(N):
    mesh.vertices[i].co = P_Globe[i]

sk = mesh.shape_keys
if not sk:
    p_obj.shape_key_add(name="Basis", from_mix=False)
    sk = mesh.shape_keys

kb = sk.key_blocks

# Ensure State_Globe is basis
if 'State_Globe' in kb:
    for i in range(N):
        kb['State_Globe'].data[i].co = P_Globe[i]
else:
    kb[0].name = 'State_Globe'
    for i in range(N):
        kb['State_Globe'].data[i].co = P_Globe[i]

# Ensure primary keys exist
for name, data in [('State_Electricity', P_Elec), ('State_Fire', P_Fire), ('State_Lock', P_Lock)]:
    if name not in kb:
        k = p_obj.shape_key_add(name=name, from_mix=False)
        k.relative_key = kb['State_Globe']
    else:
        k = kb[name]
    k.slider_min = 0.0
    k.slider_max = 1.0
    for i in range(N):
        k.data[i].co = data[i]

# Remove messy intermediate keys if present
for k_name in list(kb.keys()):
    if k_name not in ['State_Globe', 'State_Electricity', 'State_Fire', 'State_Lock', 'Basis']:
        p_obj.shape_key_remove(kb[k_name])

print("Updated shape keys:", list(kb.keys()))

# --- Optimize Scene & Cycles Settings ---
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'GPU'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'
prefs.get_devices()
for d in prefs.devices:
    d.use = (d.type == 'METAL')

scene.cycles.samples = 32
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.02
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 3
scene.cycles.diffuse_bounces = 1
scene.cycles.glossy_bounces = 1
scene.cycles.transmission_bounces = 0
scene.cycles.volume_bounces = 0
scene.cycles.transparent_max_bounces = 4

scene.render.film_transparent = True
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100

# Hide floor during alpha particle render so background is 100% clean transparent
floor = bpy.data.objects.get("Studio_Floor")
if floor:
    floor.hide_render = True

shadow = bpy.data.objects.get("Floating_Ground_Shadow")
if shadow:
    shadow.hide_render = True

aura = bpy.data.objects.get("Globe_Inner_Aura")
if aura:
    aura.hide_render = True

# Ensure Particle instance size is crisp
gn_mod = p_obj.modifiers.get("GN_Hero_Particles")
if gn_mod and gn_mod.node_group:
    for node in gn_mod.node_group.nodes:
        if node.type == 'MESH_PRIMITIVE_ICO_SPHERE':
            node.inputs['Radius'].default_value = 0.025

# Save updated blend file
bpy.ops.wm.save_mainfile(filepath=filepath)
print("Saved blend file.")

# --- Render 4 State Test Frames ---
out_dir = "/Users/karthikeya.s/Documents/focus/test_renders_4states"
os.makedirs(out_dir, exist_ok=True)

# Clear any animation data on shape keys for isolated renders
if sk.animation_data:
    sk.animation_data_clear()

states = [
    ('State_Globe', {'State_Electricity': 0.0, 'State_Fire': 0.0, 'State_Lock': 0.0}),
    ('State_Electricity', {'State_Electricity': 1.0, 'State_Fire': 0.0, 'State_Lock': 0.0}),
    ('State_Fire', {'State_Electricity': 0.0, 'State_Fire': 1.0, 'State_Lock': 0.0}),
    ('State_Lock', {'State_Electricity': 0.0, 'State_Fire': 0.0, 'State_Lock': 1.0}),
]

p_obj.rotation_euler = (0, 0, 0)

for sname, vals in states:
    for k, v in vals.items():
        if k in kb:
            kb[k].value = v
    scene.frame_set(1)
    dg = bpy.context.evaluated_depsgraph_get()
    
    out_img = os.path.join(out_dir, f"{sname}.png")
    scene.render.filepath = out_img
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    print(f"Rendered {sname} in {(time.time() - t0)*1000.0:.1f} ms -> {out_img}")

print("All 4 states rendered successfully!")
