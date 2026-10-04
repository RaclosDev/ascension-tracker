import re

path = 'frontend/src/components/FoodSearchModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the mojibake that I missed
text = text.replace('aÃ±adidos', 'añadidos')
text = text.replace('aÃ±adir', 'añadir')
text = text.replace('AÃ±adir', 'Añadir')

# Inject the AI model name into the AI text input handler
text = re.sub(
    r'(toast\.success\(`¡\$\{count\} alimento\(s\) añadidos por IA! ✨`\);)',
    r"const aiModel = res.headers['x-ai-model'] || 'desconocido';\n          toast.success(`¡${count} alimento(s) añadidos por IA (${aiModel})! ✨`);",
    text
)

text = re.sub(
    r'(toast\.success\(`¡\$\{count\} alimento\(s\) repartidos en tus comidas por IA! ✨`\);)',
    r"const aiModel = res.headers['x-ai-model'] || 'desconocido';\n          toast.success(`¡${count} alimento(s) repartidos en tus comidas por IA (${aiModel})! ✨`);",
    text
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
