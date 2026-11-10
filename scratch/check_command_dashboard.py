import os

with open('frontend/src/pages/command/CommandDashboard.jsx', 'r') as f:
    lines = f.readlines()
    for idx, line in enumerate(lines, 1):
        if 'disastermap' in line.lower() or 'map' in line.lower():
            print(f"CommandDashboard.jsx:{idx}: {line.strip()[:100]}")

