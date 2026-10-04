import bpy

print("=== SETTING UP CHOREOGRAPHED INTERMEDIATE ANIMATION CURVES ===")

blend_file = "/Users/karthikeya.s/Documents/focus/hero_particle_animation.blend"
bpy.ops.wm.open_mainfile(filepath=blend_file)

obj = bpy.data.objects['Hero_Particle_System']
mesh = obj.data
sk = mesh.shape_keys
kb = sk.key_blocks

def get_action_fcurves(action):
    fcurves = []
    if not action:
        return fcurves
    if hasattr(action, 'fcurves'):
        return list(action.fcurves)
    if hasattr(action, 'layers'):
        for layer in action.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    for fc in cb.fcurves:
                        fcurves.append(fc)
    return fcurves

# 1. ROTATION: Continuous linear Z-rotation
if obj.animation_data:
    obj.animation_data_clear()
obj.animation_data_create()

obj.rotation_euler.z = 0.0
obj.keyframe_insert(data_path="rotation_euler", index=2, frame=1)
obj.rotation_euler.z = 6.283185307179586
obj.keyframe_insert(data_path="rotation_euler", index=2, frame=240)

for fc in get_action_fcurves(obj.animation_data.action):
    if fc.data_path == "rotation_euler" and fc.array_index == 2:
        for pt in fc.keyframe_points:
            pt.interpolation = 'LINEAR'
print("Configured continuous linear Z-rotation.")

# 2. SCALE: Subtle breathing anchored to physical deformation
scale_keys = [
    (1, 1.000),
    (55, 1.000),
    (68, 1.042),
    (80, 1.008),
    (95, 1.000),
    (104, 1.000),
    (118, 1.035),
    (131, 1.006),
    (148, 1.000),
    (160, 1.000),
    (174, 0.972),
    (187, 1.005),
    (197, 1.000),
    (220, 1.000),
    (240, 0.950),
]
for f, s in scale_keys:
    obj.scale = (s, s, s)
    obj.keyframe_insert(data_path="scale", frame=f)

# 3. SHAPE KEYS: Choreographed handoffs through intermediate states
if sk.animation_data:
    sk.animation_data_clear()
sk.animation_data_create()

def set_key_track(key_name, frames_values):
    if key_name not in kb:
        print(f"WARNING: {key_name} not found in key_blocks!")
        return
    block = kb[key_name]
    for f, val in frames_values:
        block.value = val
        block.keyframe_insert(data_path="value", frame=f)
    print(f"Keyframe track set for {key_name} ({len(frames_values)} points)")

# Reset all shape keys to 0 at frame 1
for block in kb:
    if block.name != 'State_Globe':
        block.value = 0.0
        block.keyframe_insert(data_path="value", frame=1)

# Transition 1: Globe -> Electricity (f55 - f80)
# f55: Sphere Hold end
# f61: 25% pre-distortion (Trans_Globe_Pre)
# f68: 50% energy expansion (Trans_Globe_Energy)
# f74: 75% intermediate hybrid (Trans_Globe_Mid)
# f80: Electricity resolved
set_key_track("Trans_Globe_Pre", [
    (1, 0.0), (55, 0.0), (61, 1.0), (68, 0.0), (240, 0.0)
])
set_key_track("Trans_Globe_Energy", [
    (1, 0.0), (61, 0.0), (68, 1.0), (74, 0.0), (240, 0.0)
])
set_key_track("Trans_Globe_Mid", [
    (1, 0.0), (68, 0.0), (74, 1.0), (80, 0.0), (240, 0.0)
])
set_key_track("State_Electricity", [
    (1, 0.0), (74, 0.0), (80, 1.0), (104, 1.0), (111, 0.0), (240, 0.0)
])

# Transition 2: Electricity -> Fire (f104 - f131)
# f104: Electricity Hold end
# f111: 25% pre-distortion (Trans_Elec_Pre)
# f118: 50% energy expansion (Trans_Elec_Energy)
# f124: 75% intermediate hybrid (Trans_Elec_Mid)
# f131: Fire resolved
set_key_track("Trans_Elec_Pre", [
    (1, 0.0), (104, 0.0), (111, 1.0), (118, 0.0), (240, 0.0)
])
set_key_track("Trans_Elec_Energy", [
    (1, 0.0), (111, 0.0), (118, 1.0), (124, 0.0), (240, 0.0)
])
set_key_track("Trans_Elec_Mid", [
    (1, 0.0), (118, 0.0), (124, 1.0), (131, 0.0), (240, 0.0)
])
set_key_track("State_Fire", [
    (1, 0.0), (124, 0.0), (131, 1.0), (160, 1.0), (167, 0.0), (240, 0.0)
])

# Transition 3: Fire -> Lock (f160 - f187)
# f160: Fire Hold end
# f167: 25% pre-distortion (Trans_Fire_Pre)
# f174: 50% energy expansion / arch loop closing (Trans_Fire_Energy)
# f180: 75% intermediate hybrid (Trans_Fire_Mid)
# f187: Lock resolved
set_key_track("Trans_Fire_Pre", [
    (1, 0.0), (160, 0.0), (167, 1.0), (174, 0.0), (240, 0.0)
])
set_key_track("Trans_Fire_Energy", [
    (1, 0.0), (167, 0.0), (174, 1.0), (180, 0.0), (240, 0.0)
])
set_key_track("Trans_Fire_Mid", [
    (1, 0.0), (174, 0.0), (180, 1.0), (187, 0.0), (240, 0.0)
])
set_key_track("State_Lock", [
    (1, 0.0), (180, 0.0), (187, 1.0), (240, 1.0)
])

# 4. Orange Core Energy illumination response on Core_Light
core_light = bpy.data.objects.get('Core_Light')
if core_light and core_light.data:
    light_data = core_light.data
    if light_data.animation_data:
        light_data.animation_data_clear()
    light_data.animation_data_create()
    energy_keys = [
        (1, 65.0), (55, 65.0), (68, 86.0), (80, 70.0), (95, 65.0),
        (104, 65.0), (118, 115.0), (131, 72.0), (148, 65.0),
        (160, 65.0), (174, 88.0), (187, 70.0), (197, 65.0), (240, 65.0)
    ]
    for f, val in energy_keys:
        light_data.energy = val
        light_data.keyframe_insert(data_path="energy", frame=f)

# 5. Floor Shadow response
shadow = bpy.data.objects.get('Floating_Ground_Shadow')
if shadow:
    if shadow.animation_data:
        shadow.animation_data_clear()
    shadow.animation_data_create()
    shadow_keys = [
        (1, 1.00), (55, 1.00), (68, 1.06), (80, 1.02), (95, 1.00),
        (104, 1.00), (118, 0.96), (131, 0.99), (148, 1.00),
        (160, 1.00), (174, 1.04), (187, 1.01), (197, 1.00), (240, 0.95)
    ]
    for f, s in shadow_keys:
        shadow.scale = (s, s, 1.0)
        shadow.keyframe_insert(data_path="scale", frame=f)

# Film transparent
bpy.context.scene.render.film_transparent = True
bpy.ops.wm.save_mainfile(filepath=blend_file)
print("=== SUCCESSFULLY SAVED CHOREOGRAPHED ANIMATION ===")
