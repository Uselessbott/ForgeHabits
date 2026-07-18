#!/usr/bin/env python3
"""
Edit 2.py – skip Patch 1 (already applied).

Creates backup: 2.py.pre-main-patch.bak
Replaces the line that calls patch_types() with a comment.
"""

import shutil
import sys
from pathlib import Path

FILE = Path("2.py")
BACKUP = FILE.with_suffix(FILE.suffix + ".pre-main-patch.bak")

def fail(msg):
    print(f"❌ {msg}")
    sys.exit(1)

def main():
    if not FILE.exists():
        fail(f"File not found: {FILE}")

    # Backup
    shutil.copy2(FILE, BACKUP)
    print(f"📦 Backup created: {BACKUP}")

    content = FILE.read_text(encoding="utf-8")
    lines = content.split("\n")

    modified = False
    for i, line in enumerate(lines):
        stripped = line.strip()
        # Find the exact call line (ignoring trailing comments)
        if stripped.startswith("patch_types()"):
            # Preserve the original indentation
            indent = line[:len(line) - len(line.lstrip())]
            new_line = indent + "# patch_types()  # Already applied"
            lines[i] = new_line
            modified = True
            break

    if not modified:
        fail("Line 'patch_types()' not found in 2.py. Is the script already modified?")

    new_content = "\n".join(lines)
    FILE.write_text(new_content, encoding="utf-8")
    print("✅ Replaced patch_types() call with comment in 2.py")
    print("   The appearance patcher will now skip Patch 1.")

if __name__ == "__main__":
    main()
