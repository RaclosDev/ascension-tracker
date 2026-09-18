import re
import glob

for file in glob.glob('frontend/src/**/*.tsx', recursive=True):
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'color: \'white\'' in content or 'color: "white"' in content:
        # Check if the context contains var(--accent or var(--gradient
        if 'var(--accent' in content or 'var(--gradient' in content:
            content = re.sub(r'color:\s*[\'"]white[\'"]', 'color: \'var(--accent-text, white)\'', content)
            with open(file, 'w', encoding='utf-8') as f:
                f.write(content)
