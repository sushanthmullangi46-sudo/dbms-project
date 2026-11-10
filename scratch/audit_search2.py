import os

keywords = [
    'Lot Item', 
    'V_INVENTORY_STATUS', 
    'Hazard Category', 
    'Priority Distribution', 
    'Relief Resource Demand',
    'WAREHOUSE INVENTORY',
    'Stock Levels',
    'Asset ID',
    'reading \'map\'',
    'reading "map"',
    '.map('
]

results = []

for root, dirs, files in os.walk('.'):
    if any(p in root for p in ['node_modules', '.git', '.pytest_cache', '__pycache__', 'dist', 'FINAL_PROJECT_REPORT']):
        continue
    for f in files:
        if f.endswith(('.js', '.jsx', '.ts', '.tsx', '.py', '.sql', '.html', '.json')):
            fpath = os.path.join(root, f)
            try:
                with open(fpath, 'r', encoding='utf-8', errors='ignore') as fp:
                    content = fp.read()
                    for kw in ['Lot Item', 'V_INVENTORY_STATUS', 'Hazard Category', 'Priority Distribution', 'Relief Resource Demand', 'WAREHOUSE INVENTORY', 'Asset ID']:
                        if kw.lower() in content.lower():
                            print(f"Match '{kw}' in {fpath}")
            except Exception as e:
                pass
