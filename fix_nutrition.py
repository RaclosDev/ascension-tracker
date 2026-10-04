import os
import re

path = 'frontend/src/pages/NutritionPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Specifically find the line that has this nonsense
text = re.sub(r'\{\'[^\']*\'\}\s*(\{Math.round\(Number\(log.kcal\) \|\| 0\)\} kcal \| P:)', r"{' • '}\n                                          \1", text)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
