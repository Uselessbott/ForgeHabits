#!/usr/bin/env python3
"""
Patch 1 of 13 — context/types.ts

- Tightens the `theme` field to `'super_amoled' | 'light'`
- Adds `accentColor` field to `AppSettings`

Backup: context/types.ts.pre-appearance.bak
"""

import shutil
import sys
from pathlib import Path

FILE = Path.home() / "ForgeHabits/artifacts/mobile/context/types.ts"
BACKUP = FILE.with_suffix(FILE.suffix + ".pre-appearance.bak")

def fail(msg):
    print(f"❌ {msg}")
    sys.exit(1)

def patch():
    if not FILE.exists():
        fail(f"File not found: {FILE}")

    # backup
    shutil.copy2(FILE, BACKUP)
    print(f"📦 Backup created: {BACKUP}")

    content = FILE.read_text(encoding="utf-8")

    # ----- 1. Change theme type -----
    old_theme = "  theme: 'dark' | 'light';"
    new_theme = "  theme: 'super_amoled' | 'light';"
    if old_theme not in content:
        fail(f"Expected theme field not found in {FILE}")
    content = content.replace(old_theme, new_theme, 1)
    print("  ✅ Updated theme type: 'dark' → 'super_amoled' | 'light'")

    # ----- 2. Add accentColor field right after theme line -----
    insert_after = new_theme
    if insert_after not in content:
        fail("Theme field insertion point missing after theme replacement")
    accent_line = "  accentColor: 'orange' | 'red' | 'maroon' | 'blue' | 'green' | 'purple' | 'pink' | 'cyan' | 'yellow';"
    content = content.replace(
        insert_after + "\n",
        insert_after + "\n" + accent_line + "\n",
        1,
    )
    print("  ✅ Added accentColor field")

    FILE.write_text(content, encoding="utf-8")
    print("✅ Patch applied successfully.\n")

if __name__ == "__main__":
    patch()
