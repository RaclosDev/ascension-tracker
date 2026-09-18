import re

with open('frontend/src/utils/colorHelper.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "root.style.setProperty('--accent-glow', `rgba(${rgb}, 0.15)`);",
    "root.style.setProperty('--accent-glow', `rgba(${rgb}, 0.15)`);\n  root.style.setProperty('--accent-shadow', `rgba(${rgb}, 0.4)`);"
)

with open('frontend/src/utils/colorHelper.ts', 'w', encoding='utf-8') as f:
    f.write(content)

# Now fix MyFoodsPage.tsx
with open('frontend/src/pages/MyFoodsPage.tsx', 'r', encoding='utf-8') as f:
    my_foods = f.read()

my_foods = re.sub(r'color:\s*[\'"]white[\'"]', "color: 'var(--accent-text, white)'", my_foods)
my_foods = my_foods.replace("boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'", "boxShadow: '0 4px 12px var(--accent-shadow)'")

with open('frontend/src/pages/MyFoodsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(my_foods)

# Now fix NutritionPage.tsx
with open('frontend/src/pages/NutritionPage.tsx', 'r', encoding='utf-8') as f:
    nutr = f.read()

nutr = re.sub(r'color:\s*[\'"]white[\'"]', "color: 'var(--accent-text, white)'", nutr)
nutr = nutr.replace("boxShadow: '0 8px 24px rgba(0, 133, 255, 0.4), inset 0 1px 2px rgba(255,255,255,0.2)'", "boxShadow: '0 8px 24px var(--accent-shadow), inset 0 1px 2px rgba(255,255,255,0.2)'")

with open('frontend/src/pages/NutritionPage.tsx', 'w', encoding='utf-8') as f:
    f.write(nutr)
