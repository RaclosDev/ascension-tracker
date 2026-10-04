import re

path = 'backend/src/main/java/com/ascension/controller/NutritionController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

old_ocr = 'return ResponseEntity.ok(geminiAiService.processNutritionalLabel(jwt.getClaimAsString("email"), image));'
new_ocr = """
            var result = geminiAiService.processNutritionalLabel(jwt.getClaimAsString("email"), image);
            return ResponseEntity.ok().header("X-AI-Model", geminiAiService.getActiveModelName()).body(result);
""".strip()
text = text.replace(old_ocr, new_ocr)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
