import json

with open("data/htb_data.json", "r") as f:
    data = json.load(f)

js_content = "const htbData = " + json.dumps(data, indent=4) + ";\n"

with open("js/htb_data.js", "w") as f:
    f.write(js_content)
