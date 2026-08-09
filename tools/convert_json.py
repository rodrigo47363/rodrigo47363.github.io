import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
json_path = os.path.join(BASE_DIR, "data", "htb_data.json")
js_path = os.path.join(BASE_DIR, "js", "htb_data.js")

with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

js_content = "const htbData = " + json.dumps(data, indent=4) + ";\n"

with open(js_path, "w", encoding="utf-8") as f:
    f.write(js_content)
