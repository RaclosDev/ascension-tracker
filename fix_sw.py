import os
import codecs

path = 'frontend/src/sw.ts'
with codecs.open(path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

text = text.replace('Descanso', '¡Descanso')
text = text.replace('ǽ\'?o', '➡️')
text = text.replace('ǽ\'??', '➡️')

with codecs.open(path, 'w', encoding='utf-8') as f:
    f.write(text)
