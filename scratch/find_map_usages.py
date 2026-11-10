import os

for root, dirs, files in os.walk('frontend/src'):
    for f in files:
        if f.endswith(('.jsx', '.js')):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8', errors='ignore') as fp:
                c = fp.read()
                if 'DisasterMap' in c:
                    print(f"Found DisasterMap in {p}")

