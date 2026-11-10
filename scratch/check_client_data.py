with open('frontend/src/api/clientData.js', 'r') as f:
    lines = f.readlines()
    for idx, line in enumerate(lines, 1):
        if 'warehouse' in line.lower() or 'inventory' in line.lower():
            print(f"clientData.js:{idx}: {line.strip()[:100]}")

