import os
import re

def nuke_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    original = text
    # Remove literal emojis
    text = text.replace('✨', '')
    
    # In AiFoodModal.tsx
    text = re.sub(r'<Sparkles[^>]*/> ', '', text)
    text = re.sub(r'<Sparkles[^>]*/>', '', text)
    
    # In FoodSearchModal.tsx (handle whatever weird encoding they might have)
    text = re.sub(r'! ✨`', '!`', text)
    text = re.sub(r'\)!\s*✨`', ')!`', text)
    text = re.sub(r'¡\$\{count\} alimento\(s\) aadidos por IA \(\$\{aiModel\}\)! ✨', '¡${count} alimento(s) añadidos por IA (${aiModel})!', text)
    text = re.sub(r'✨ Procesando', 'Procesando', text)
    
    # Fallback to pure regex replace of the sparkling star emoji Unicode \u2728
    text = text.replace('\u2728', '')
    
    # Let's just be very aggressive with the exact strings
    text = text.replace(')! `', ')!`')

    if text != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Cleaned {path}")

for root, dirs, files in os.walk('.'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts') or f.endswith('.java'):
            nuke_file(os.path.join(root, f))
