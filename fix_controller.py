import re

path = 'backend/src/main/java/com/ascension/controller/NutritionController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix for log
old_log = 'return ResponseEntity.ok().header("X-AI-Model", geminiAiService.getActiveModelName()).body(geminiAiService.processNaturalLanguageLog(jwt.getClaimAsString("email"), text, base64Image, mealIndex, date));'
new_log = """
            var result = geminiAiService.processNaturalLanguageLog(jwt.getClaimAsString("email"), text, base64Image, mealIndex, date);
            return ResponseEntity.ok().header("X-AI-Model", geminiAiService.getActiveModelName()).body(result);
""".strip()
text = text.replace(old_log, new_log)

# Fix for food
old_food = 'return ResponseEntity.ok().header("X-AI-Model", geminiAiService.getActiveModelName()).body(geminiAiService.processNaturalLanguageFood(jwt.getClaimAsString("email"), text));'
new_food = """
            var result = geminiAiService.processNaturalLanguageFood(jwt.getClaimAsString("email"), text);
            return ResponseEntity.ok().header("X-AI-Model", geminiAiService.getActiveModelName()).body(result);
""".strip()
text = text.replace(old_food, new_food)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
