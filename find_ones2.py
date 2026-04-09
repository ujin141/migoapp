import os
import re

dir_path = "/Users/song-ujin/.gemini/antigravity/scratch/migoapp/src"
# Just find any Korean text ending in 1
pattern = re.compile(r'[가-힣]+1')

for root, dirs, files in os.walk(dir_path):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            # only process tsx files primarily to avoid huge matches in i18n
            if 'i18n/locales' in root:
                continue
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    if pattern.search(line):
                        print(f"{file}:{i+1}: {line.strip()}")
