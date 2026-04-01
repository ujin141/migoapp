import os
import re

replacements = {
    "support@lunaticsgroup.co.kr": "support@lunaticsgroup.com",
    "ujin@lunatics.kr": "ujin@lunaticsgroup.com",
    "privacy@lunaticsgroup.co.kr": "privacy@lunaticsgroup.com",
    "hello@migo-go.com": "hello@lunaticsgroup.com",
    "privacy@migo-go.com": "privacy@lunaticsgroup.com",
    "support@migo-go.com": "support@lunaticsgroup.com",
    "demo@migo.app": "demo@lunaticsgroup.com"
}

target_dirs = ["src"]

for root, _, files in os.walk("src"):
    for file in files:
        if file.endswith((".ts", ".tsx", ".js", ".jsx", ".md")):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            
            new_content = content
            for old_email, new_email in replacements.items():
                new_content = new_content.replace(old_email, new_email)
                
            if content != new_content:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated {path}")
