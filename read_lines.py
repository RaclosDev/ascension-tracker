with open('frontend/src/components/FoodSearchModal.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "bottom: '0.6rem'" in line:
        for j in range(i-2, i+40):
            print(lines[j], end='')
        break
