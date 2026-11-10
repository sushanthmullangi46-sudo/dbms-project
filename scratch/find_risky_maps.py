import os, re

for root, dirs, files in os.walk('frontend/src'):
    for f in files:
        if f.endswith(('.jsx', '.js')):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8', errors='ignore') as fp:
                content = fp.read()
                # Find all .map(
                for m in re.finditer(r'([a-zA-Z0-9_\.\[\]\'\"]+)\.map\(', content):
                    var_name = m.group(1)
                    # Check if var_name is something like res.data, items, reports, etc.
                    if any(sub in var_name for sub in ['res', 'data', 'items', 'list', 'reports', 'incidents', 'missions', 'resources', 'warehouses', 'shelters', 'hospitals', 'users', 'logs']):
                        # Check line context
                        start = max(0, content.rfind('\n', 0, m.start()))
                        end = content.find('\n', m.end())
                        line = content[start:end].strip()
                        print(f"{p}: {var_name} in: {line[:90]}")
