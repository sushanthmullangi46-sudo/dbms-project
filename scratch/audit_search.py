import os

keywords = [
    'Lot Item', 
    'V_INVENTORY_STATUS', 
    'Hazard Category', 
    'Priority Distribution', 
    'Relief Resource Demand',
    'default',
    'WAREHOUSE INVENTORY & LOGISTICS LEDGER',
    'Stock Levels'
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
                    lines = fp.readlines()
                    for idx, line in enumerate(lines, 1):
                        for kw in keywords:
                            if kw.lower() in line.lower():
                                results.append(f"{fpath}:{idx}: [{kw}] {line.strip()[:100]}")
            except Exception as e:
                pass

print(f"Found {len(results)} matches:")
for r in results[:40]:
    print(r)
if len(results) > 40:
    print(f"... and {len(results) - 40} more matches")
