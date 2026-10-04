import bpy

print("=== CHECKING hero_particle_animation.blend ===")
bpy.ops.wm.open_mainfile(filepath="/Users/karthikeya.s/Documents/focus/hero_particle_animation.blend")
scene = bpy.context.scene
hero = bpy.data.objects.get("Hero_Particle_System")
print("Engine in hero_particle_animation:", scene.render.engine)
print("Modifiers:", [m.name for m in hero.modifiers] if hero else None)
print("Shape keys:", [k.name for k in hero.data.shape_keys.key_blocks] if hero and hero.data.shape_keys else None)
if hero and hero.material_slots:
    print("Materials:", [s.material.name for s in hero.material_slots if s.material])

print("\n=== CHECKING Untitled(1).blend1 ===")
bpy.ops.wm.open_mainfile(filepath="/Users/karthikeya.s/Documents/focus/Untitled(1).blend1")
scene1 = bpy.context.scene
hero1 = bpy.data.objects.get("Hero_Particle_System")
print("Engine in Untitled(1).blend1:", scene1.render.engine)
print("Modifiers:", [m.name for m in hero1.modifiers] if hero1 else None)
print("Shape keys:", [k.name for k in hero1.data.shape_keys.key_blocks] if hero1 and hero1.data.shape_keys else None)
if hero1 and hero1.material_slots:
    print("Materials:", [s.material.name for s in hero1.material_slots if s.material])
