import os
import re

directories = ['src/components', 'src/pages']

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content
    
    # Replace the parent wrapper to include safe area paddings and center horizontally
    content = re.sub(
        r'(className="fixed inset-0 z-\[?\d+\]?\s+flex items-end)"',
        r'\1 justify-center px-safe pb-safe pt-safe"',
        content
    )
    
    content = re.sub(
        r'(className="fixed inset-0 z-\[?\d+\]?\s+bg-[a-zA-Z0-9/\-]+\s+flex items-end)"',
        r'\1 justify-center px-safe pb-safe pt-safe"',
        content
    )
    
    # Replace rounded-t-3xl with rounded-3xl mb-2 sm:mb-6 making it a floating sheet
    content = re.sub(
        r'(className="[^"]*)rounded-t-3xl([^"]*)"',
        r'\1rounded-3xl mb-4 sm:mb-8\2"',
        content
    )
    
    # Replace rounded-t-\[32px\] with rounded-[32px] mb-2 sm:mb-6
    content = re.sub(
        r'(className="[^"]*)rounded-t-\[32px\]([^"]*)"',
        r'\1rounded-[32px] mb-4 sm:mb-8\2"',
        content
    )

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx'):
                process_file(os.path.join(root, file))
