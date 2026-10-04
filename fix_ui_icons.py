import re

path = 'frontend/src/pages/UtilitiesPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the black stroke on the AI icon
text = text.replace('stroke="#000"', 'stroke="currentColor"')

# Fix the chevron in utilities
text = text.replace(">\n                ?\n              </span>", ">\n                ▼\n              </span>")

# Fix missing Mic/Square icons? Let's check `{isListening ? <Square size={20} /> : <Mic size={20} />}`
# Wait, it actually has `<Mic size={20} />` in UtilitiesPage. Let's make sure it imports Square and Mic.

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

path = 'frontend/src/components/my-foods/AiFoodModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add missing Lucide imports
text = text.replace("import { X } from 'lucide-react';", "import { X, Mic, Square, Sparkles } from 'lucide-react';")

# Fix garbled text
text = text.replace('calcularǭ', 'calculará')
text = text.replace('protena', 'proteína')

# Add AI sparkle icon to header
text = text.replace('<h3 style={{ margin: 0, fontSize: \'1.2rem\' }}> Crear con IA</h3>', '<h3 style={{ margin: 0, fontSize: \'1.2rem\', display: \'flex\', alignItems: \'center\', gap: \'0.5rem\' }}><Sparkles size={20} style={{ color: \'var(--accent-primary)\' }} /> Crear con IA</h3>')

# Fix missing mic icon in AiFoodModal
text = text.replace('{isListening ? \'\' : \'\'}', '{isListening ? <Square size={20} /> : <Mic size={20} />}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
