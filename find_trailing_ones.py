import os
import re

dir_path = "/Users/song-ujin/.gemini/antigravity/scratch/migoapp/src"
# Regex to match Korean characters followed by exactly '1' and then a quote or bracket
pattern = re.compile(r'([가-힣]+)1(["\'<}])')

for root, dirs, files in os.walk(dir_path):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                matches = pattern.findall(content)
                if matches:
                    lines = content.split('\n')
                    for i, line in enumerate(lines):
                        if re.search(r'[가-힣]+1', line):
                            print(f"{file}:{i+1}: {line.strip()}")
