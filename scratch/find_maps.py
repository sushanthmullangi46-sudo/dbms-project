import os, re

map_calls = []

for root, dirs, files in os.walk('frontend/src'):
    for f in files:
        if f.endswith(('.jsx', '.js')):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8', errors='ignore') as fp:
                lines = fp.readlines()
                for idx, line in enumerate(lines, 1):
                    matches = re.findall(r'(\b[\w\.\?]+)\.map\(', line)
                    if matches:
                        for m in matches:
                            # Check if m is guarded or initialized
                            map_calls.append((p, idx, m, line.strip()))

print(f"Total .map() calls found: {len(map_calls)}")
# Look for unguarded calls on variables that come from API
unguarded = []
for p, idx, m, line in map_calls:
    if not '?.' in line and not '|| []' in line and not 'Array.isArray' in line:
        unguarded.append((p, idx, m, line))

print(f"Unguarded .map() calls: {len(unguarded)}")
for p, idx, m, line in unguarded[:30]:
    print(f"{p}:{idx}: {m} in '{line[:80]}'")
