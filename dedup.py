import glob
import re

locales_dir = "src/i18n/locales/*.ts"
files = glob.glob(locales_dir)

count = 0

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    new_lines = []
    seen_keys = set()
    changed = False
    
    for line in lines:
        match = re.search(r'[\'"]?(auto\.[^\'":\s]+)[\'"]?\s*:', line)
        if match:
            key = match.group(1)
            if key in seen_keys:
                changed = True
                continue
            seen_keys.add(key)
        new_lines.append(line)
        
    if changed:
        with open(file_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        count += 1

print(f"Fixed duplicates in {count} files.")
