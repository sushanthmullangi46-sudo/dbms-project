import os

for root, dirs, files in os.walk('.'):
    if any(p in root for p in ['node_modules', '.git', 'FINAL_PROJECT_REPORT']):
        continue
    for f in files:
        if f.endswith('.py') or f.endswith('.js'):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8', errors='ignore') as fp:
                c = fp.read()
                if '/resources' in c or 'api/resources' in c or 'get_resources' in c:
                    print(f"Found /resources in {p}")
