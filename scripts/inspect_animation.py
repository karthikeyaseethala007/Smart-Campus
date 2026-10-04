import bpy

# Inspect action curves in Blender 5.2
blend_path = "/Users/karthikeya.s/Documents/focus/Untitled(1).blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

print("\n--- ALL ACTIONS & CURVES ---")
for act in bpy.data.actions:
    print(f"Action: {act.name}")
    # Check if act has curves or layers
    if hasattr(act, 'curves'):
        print(f"  Curves: {len(act.curves)}")
        for c in act.curves:
            print(f"    {c.data_path}")
    if hasattr(act, 'layers'):
        for l_idx, layer in enumerate(act.layers):
            print(f"  Layer {l_idx}: {layer.name if hasattr(layer, 'name') else 'Layer'}")
            for s_idx, strip in enumerate(layer.strips):
                print(f"    Strip {s_idx}: type={type(strip)}")
                if hasattr(strip, 'channel_bags'):
                    for cb in strip.channel_bags:
                        for fc in cb.fcurves:
                            print(f"      FCurve: {fc.data_path} [{fc.array_index}] ({len(fc.keyframe_points)} keys)")
                            for kp in fc.keyframe_points[:5]:
                                print(f"         f={kp.co[0]:.1f}, val={kp.co[1]:.3f}, interp={kp.interpolation}")
                            if len(fc.keyframe_points) > 5:
                                print(f"         ... and {len(fc.keyframe_points)-5} more keys")

# Also check object animations (Hero_Particle_System, Hero_Camera, etc.)
for obj in bpy.data.objects:
    if obj.animation_data:
        print(f"\nObject {obj.name} anim data: action={obj.animation_data.action}")
        if obj.animation_data.drivers:
            print(f"  Drivers: {len(obj.animation_data.drivers)}")
            for d in obj.animation_data.drivers:
                print(f"    Driver on {d.data_path} [{d.array_index}]")
