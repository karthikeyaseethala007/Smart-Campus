import bpy
import time
import sys

def inspect_scene():
    print("="*60)
    print("SCENE INSPECTION FOR:", bpy.data.filepath)
    print("="*60)
    
    scene = bpy.context.scene
    print(f"Render Engine: {scene.render.engine}")
    print(f"Resolution: {scene.render.resolution_x} x {scene.render.resolution_y} @ {scene.render.resolution_percentage}%")
    print(f"Frame Range: {scene.frame_start} to {scene.frame_end} (FPS: {scene.render.fps})")
    
    if scene.render.engine == 'CYCLES':
        c = scene.cycles
        print(f"Cycles Device: {c.device}")
        print(f"Cycles Samples: {c.samples}, Preview: {c.preview_samples}")
        print(f"Cycles Adaptive Sampling: {c.use_adaptive_sampling}")
        print(f"Cycles Denoising: {c.use_denoising}, Denoise engine: {c.denoiser}")
        print(f"Cycles Max Bounces: {c.max_bounces}, Diffuse: {c.diffuse_bounces}, Glossy: {c.glossy_bounces}, Transmission: {c.transmission_bounces}, Volume: {c.volume_bounces}, Transparent: {c.transparent_max_bounces}")
    
    print("\nOBJECTS COUNT:", len(bpy.data.objects))
    print("MESHES COUNT:", len(bpy.data.meshes))
    print("MATERIALS COUNT:", len(bpy.data.materials))
    print("LIGHTS COUNT:", len(bpy.data.lights))
    
    print("\n--- OBJECT DETAILS ---")
    for obj in bpy.data.objects:
        mod_names = [f"{m.name} ({m.type})" for m in obj.modifiers]
        print(f"Object: {obj.name} | Type: {obj.type} | Visible: {obj.visible_get()} | Children: {len(obj.children)} | Modifiers: {mod_names}")
        if obj.type == 'MESH':
            mesh = obj.data
            sk = mesh.shape_keys
            sk_info = f"Shape Keys: {len(sk.key_blocks)}" if sk else "No Shape Keys"
            print(f"   Mesh: {mesh.name} | Verts: {len(mesh.vertices)} | Edges: {len(mesh.edges)} | Polys: {len(mesh.polygons)} | {sk_info}")
            if sk:
                for kb in sk.key_blocks:
                    print(f"     KeyBlock: {kb.name} (val: {kb.value})")
        elif obj.type == 'LIGHT':
            light = obj.data
            print(f"   Light: {light.name} | Type: {light.type} | Energy: {light.energy} | Color: {light.color[:]} | Shadows: {light.use_shadow}")
        elif obj.type == 'VOLUME':
            print(f"   Volume: {obj.name}")

    print("\n--- MATERIALS & SHADERS ---")
    for mat in bpy.data.materials:
        print(f"Material: {mat.name} (use_nodes={mat.use_nodes})")
        if mat.use_nodes:
            for node in mat.node_tree.nodes:
                print(f"   Node: {node.name} ({node.type})")

    print("\n--- WORLD SETTINGS ---")
    if scene.world:
        print(f"World: {scene.world.name}")
        if scene.world.use_nodes:
            for node in scene.world.node_tree.nodes:
                print(f"   World Node: {node.name} ({node.type})")

    print("\n--- ANIMATION & KEYFRAMES ---")
    for action in bpy.data.actions:
        print(f"Action: {action.name} | Fcurves: {len(action.fcurves)}")
        for fc in action.fcurves[:10]:
            print(f"   FCurve: {fc.data_path} [{fc.array_index}], keyframes: {len(fc.keyframe_points)}")
        if len(action.fcurves) > 10:
            print(f"   ... and {len(action.fcurves)-10} more fcurves")

if __name__ == '__main__':
    inspect_scene()
