import re
import json

with open('/home/rodrigo47363/.gemini/antigravity/brain/b9878984-a7df-41b5-a7e5-6d4337988a70/.system_generated/steps/308/content.md', 'r') as f:
    html = f.read()

# Nuxt payload is usually in <script id="__NUXT_DATA__" type="application/json">
match = re.search(r'<script id="__NUXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
if match:
    data = json.loads(match.group(1))
    print("Found NUXT_DATA")
    # Pretty print first few elements to understand structure
    print(str(data)[:500])
else:
    print("No NUXT_DATA script found")
