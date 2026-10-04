import re

path = 'backend/src/main/java/com/ascension/service/GeminiAiService.java'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    new_lines.append(line)
    if "DO NOT MATCH CONTRADICTING FLAVORS" in line:
        new_lines.append("                \"   - STRICT BRAND MATCHING: If the user explicitly mentions a brand (e.g. 'Alipende', 'Danone'), DO NOT match it with a saved food from a completely different brand (e.g. 'Lidl', 'Hacendado'). Estimate from general knowledge instead.\\n\" +\n")
        new_lines.append("                \"   - NO HALLUCINATIONS: Do not guess or substitute items. If they ask for 2 items, output exactly 2 items. Do not duplicate items to fill space.\\n\" +\n")

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
