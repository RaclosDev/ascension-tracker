import os

path_aifood = 'frontend/src/components/my-foods/AiFoodModal.tsx'
with open(path_aifood, 'r', encoding='utf-8') as f:
    text_aifood = f.read()

text_aifood = text_aifood.replace('<Square size={20} />', '<Square size={20} color="#FFFFFF" />')
text_aifood = text_aifood.replace('<Mic size={20} />', '<Mic size={20} color="#FFFFFF" />')

with open(path_aifood, 'w', encoding='utf-8') as f:
    f.write(text_aifood)
