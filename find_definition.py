import sys
import os

search_str = sys.argv[1]
for root, dirs, files in os.walk('.'):
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    for file in files:
        if file.endswith('.js') or file.endswith('.html'):
            path = os.path.join(root, file)
            with open(path, 'r', errors='ignore') as f:
                content = f.read()
                if f"window.{search_str}" in content or f"function {search_str}" in content or f"{search_str} =" in content:
                    print(f"Found in {path}")
