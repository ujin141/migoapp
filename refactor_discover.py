import re

with open("src/pages/DiscoverPage.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    # Remove TripGroup related imports & styles
    if "TripGroup" in line and "interface" in line:
        skip = True
    if skip and line.strip() == "}":
        if "TripGroup" not in lines[i-1]: # heuristically looking for end of interfaces
            skip = False
            continue

    if "TripGroup" in line and not skip:
        continue # skip lines with TripGroup type references

    if "JoinPopupState" in line or "CountdownAlert" in line:
        if "interface" in line:
            skip = True
            
    # Simple block skips manually
    new_lines.append(line)

with open("src/pages/DiscoverPage_mod.tsx", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
