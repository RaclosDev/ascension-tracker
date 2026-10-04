import re

path = 'backend/src/main/java/com/ascension/service/ai/GeminiApiClient.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

old_list = """
        candidates.add("gemini-3.8-flash");
        candidates.add("gemini-3.7-flash");
        candidates.add("gemini-3.5-flash-lite");
        candidates.add("gemini-3.1-flash-lite");
""".strip()

new_list = """
        candidates.add("gemini-3.8-flash");
        candidates.add("gemini-3.7-flash");
        candidates.add("gemini-3.6-flash");
        candidates.add("gemini-3.5-flash");
        candidates.add("gemini-3-flash");
        candidates.add("gemini-3.5-flash-lite");
""".strip()

text = text.replace(old_list, new_list)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
