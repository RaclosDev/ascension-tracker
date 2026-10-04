import re
import os

path = 'frontend/src/pages/UtilitiesPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('className="btn btn-secondary"\n                      onClick={() => fileInputRef.current', 'onClick={() => fileInputRef.current')
text = text.replace('className={`btn btn-secondary ${isListening ? \'recording-pulse-btn\' : \'\'}`}', 'className={isListening ? \'recording-pulse-btn\' : \'\'}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

path = 'frontend/src/components/my-foods/AiFoodModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('className={`btn btn-secondary ${isListening ? \'recording-pulse-btn\' : \'\'}`}', 'className={isListening ? \'recording-pulse-btn\' : \'\'}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Removed btn-secondary class")
