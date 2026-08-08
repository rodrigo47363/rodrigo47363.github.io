import json
import os

def parse_htb_data(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = [line.strip() for line in f.readlines()]
    
    paths = []
    current_path = None
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Skip empty lines
        if not line:
            i += 1
            continue
            
        # Check if it's a Path. A path has its title repeated on the next line.
        if i + 1 < len(lines) and line == lines[i+1] and line not in ["Cybersecurity Paths", "ALL", "JOB ROLE PATHS", "SKILL PATHS"]:
            path_title = line
            i += 2
            
            # Skip empty lines
            while i < len(lines) and not lines[i]:
                i += 1
                
            path_desc = lines[i]
            i += 1
            
            # Difficulty and sections. Sometimes "Medium Path Sections 279 Sections" or just "Medium"
            if i < len(lines):
                stats_line = lines[i]
                if "Path Sections" in stats_line:
                    difficulty = stats_line.split(" Path Sections")[0].strip()
                else:
                    difficulty = stats_line.strip()
                i += 1
            else:
                difficulty = "Unknown"
            
            required = ""
            if i < len(lines) and "Required:" in lines[i]:
                required = lines[i].replace("Required: ", "").strip()
                i += 1
                
            reward = ""
            if i < len(lines) and "Reward:" in lines[i]:
                reward = lines[i].replace("Reward: ", "").strip()
                i += 1
                
            # Skip 'Path Modules' and 'X Modules included' lines
            if i < len(lines) and lines[i] == "Path Modules":
                i += 1
            if i < len(lines) and "Modules included" in lines[i]:
                i += 1
                
            # Also, check if this path already exists in our list (the user text has duplicates)
            existing_path = next((p for p in paths if p['title'] == path_title), None)
            if existing_path:
                current_path = existing_path
            else:
                current_path = {
                    "title": path_title,
                    "description": path_desc,
                    "difficulty": difficulty,
                    "required": required,
                    "reward": reward,
                    "modules": []
                }
                paths.append(current_path)
            continue
            
        # Parse Module
        if current_path and i + 2 < len(lines):
            peek_1 = lines[i+1]
            peek_2 = lines[i+2]
            
            if "Path Sections" in peek_1 or "Path Sections" in peek_2:
                module_title = line
                i += 1
                
                difficulty = lines[i]
                if difficulty == "mini module tag Mini-Module":
                    i += 1
                    difficulty = lines[i]
                i += 1
                
                sections = lines[i].replace("Path Sections ", "").strip()
                i += 1
                
                reward = ""
                if i < len(lines) and "Reward:" in lines[i]:
                    reward = lines[i].replace("Reward: ", "").strip()
                    i += 1
                    
                desc = lines[i] if i < len(lines) else ""
                i += 1
                
                # Check if module already exists in path (due to duplicates in text)
                existing_module = next((m for m in current_path["modules"] if m['title'] == module_title), None)
                if not existing_module:
                    current_path["modules"].append({
                        "title": module_title,
                        "difficulty": difficulty,
                        "sections": sections,
                        "reward": reward,
                        "description": desc
                    })
                continue
                
        i += 1
        
    return paths

if __name__ == "__main__":
    filepath = '/home/rodrigo47363/.gemini/antigravity/scratch/portfolio/modulos_htb.txt'
    if not os.path.exists(filepath):
        print(f"Error: File {filepath} not found.")
        exit(1)
        
    paths = parse_htb_data(filepath)
    
    out_dir = '/home/rodrigo47363/.gemini/antigravity/scratch/portfolio/data'
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'htb_data.json')
    
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(paths, f, indent=4, ensure_ascii=False)
        
    print(f"Successfully parsed {len(paths)} unique paths to {out_path}")
