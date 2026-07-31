import os
import re

# Find all .tsx files in src directory
def update_imports(directory):
    count = 0
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Replace react-router-dom with react-router
                    new_content = content.replace("'react-router-dom'", "'react-router'")
                    new_content = new_content.replace('"react-router-dom"', '"react-router"')
                    
                    if new_content != content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        count += 1
                        print(f"Updated: {filepath}")
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")
    
    print(f"\nTotal files updated: {count}")

if __name__ == "__main__":
    update_imports('/src/app')
