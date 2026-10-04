import re

path = 'frontend/src/pages/UtilitiesPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix text encoding issues
replacements = {
    'Aqu tienes': 'Aquí tienes',
    'Qu te': 'Qué te',
    'disearte': 'diseñarte',
    'rpida': 'rápida',
    'Disear': 'Diseñar',
    'Sugireme': 'Sugiéreme',
    'protena': 'proteína',
    'Aadir': 'Añadir',
    'Aadido': 'Añadido',
    'opcin': 'opción',
    'Aadiendo': 'Añadiendo',
    '? TUS MACROS RESTANTES': 'TUS MACROS RESTANTES',
    'atn': 'atún'
}

for old, new in replacements.items():
    text = text.replace(old, new)

# Force button styles to be foolproof circles with white icons
text = text.replace(
    "background: 'var(--bg-primary)'",
    "background: '#1C1C1E'"
)
text = text.replace(
    "color: 'var(--text-primary)'",
    "color: '#FFFFFF'"
)

# For the mic button specifically
text = text.replace(
    "background: isListening ? 'rgba(239,68,68,0.2)' : 'var(--bg-primary)'",
    "background: isListening ? 'rgba(239,68,68,0.2)' : '#1C1C1E'"
)
text = text.replace(
    "color: isListening ? '#ef4444' : 'var(--text-primary)'",
    "color: isListening ? '#ef4444' : '#FFFFFF'"
)
text = text.replace(
    "color: isListening ? '#ef4444' : undefined",
    "color: isListening ? '#ef4444' : '#FFFFFF'"
)

# Ensure perfect circles
text = text.replace("width: '42px',", "minWidth: '42px', width: '42px',")
text = text.replace("height: '42px',", "minHeight: '42px', height: '42px',")


with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
