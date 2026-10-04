import bpy

def get_action_fcurves(action):
    fcurves = []
    if hasattr(action, 'fcurves'):
        return list(action.fcurves)
    if hasattr(action, 'layers'):
        for layer in action.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    for fc in cb.fcurves:
                        fcurves.append(fc)
    return fcurves

obj = bpy.data.objects['Hero_Particle_System']
act = obj.animation_data.action if obj.animation_data else None
if act:
    fcs = get_action_fcurves(act)
    print(f"Found {len(fcs)} fcurves in {act.name}")
    for fc in fcs:
        print(f"  {fc.data_path}[{fc.array_index}]")
