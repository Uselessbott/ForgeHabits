#!/usr/bin/env python3
"""
Fix accent-color hook – refined patch.

Problem:
  useColors.ts checks `accentColor in colors` (the default export object).
  That object only has keys 'light', 'dark', 'radius', so the check always
  fails and the accent defaults to 'orange'.

Fix:
  Use `ACCENT_MAP[rawAccent]` to validate against the canonical set of
  supported accent keys.

Backup: hooks/useColors.ts.fix-accent-hook.bak
"""

import shutil
import sys
from pathlib import Path

FILE = Path.home() / "ForgeHabits" / "artifacts" / "mobile" / "hooks" / "useColors.ts"
BACKUP = FILE.with_suffix(FILE.suffix + ".fix-accent-hook.bak")

def fail(msg):
    print(f"❌ {msg}")
    sys.exit(1)

def patch():
    if not FILE.exists():
        fail(f"File not found: {FILE}")
    shutil.copy2(FILE, BACKUP)
    print(f"📦 Backup: {BACKUP}")

    content = FILE.read_text(encoding="utf-8")

    # --- 1. Add ACCENT_MAP to the named import ---
    old_import = "import { generateColors, type ThemeKey, type AccentKey } from '@/constants/colors';"
    new_import = "import { generateColors, ACCENT_MAP, type ThemeKey, type AccentKey } from '@/constants/colors';"
    if old_import not in content:
        fail("Named import line not found – file may have been modified.")
    content = content.replace(old_import, new_import, 1)
    print("  ✅ Added ACCENT_MAP to import")

    # --- 2. Replace the fragile accent detection block ---
    old_block = (
        "  const accent: AccentKey =\n"
        "    (settings as any).accentColor in colors\n"
        "      ? (settings as any).accentColor\n"
        "      : 'orange';"
    )
    new_block = (
        "  const rawAccent = (settings as any).accentColor;\n"
        "  const accent: AccentKey =\n"
        "    rawAccent && ACCENT_MAP[rawAccent as AccentKey]\n"
        "      ? (rawAccent as AccentKey)\n"
        "      : 'orange';"
    )
    if old_block not in content:
        # Fallback: try without leading spaces variation
        alt_old = (
            "const accent: AccentKey =\n"
            "    (settings as any).accentColor in colors\n"
            "      ? (settings as any).accentColor\n"
            "      : 'orange';"
        )
        if alt_old not in content:
            fail("Accent validation block not found – file may have been modified.")
        content = content.replace(alt_old, new_block, 1)
    else:
        content = content.replace(old_block, new_block, 1)
    print("  ✅ Replaced fragile accent detection with safe lookup")

    FILE.write_text(content, encoding="utf-8")
    print(f"✅ Patch applied to {FILE.name}")

if __name__ == "__main__":
    patch()
