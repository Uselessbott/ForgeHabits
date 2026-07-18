#!/usr/bin/env python3

from pathlib import Path
import shutil
import sys

ROOT = Path.home() / "ForgeHabits" / "artifacts" / "mobile" / "android" / "app" / "src" / "main" / "java" / "com" / "forgehabits" / "app" / "glance"

FILES = [
    ROOT / "CombinedGlanceWidget.kt",
    ROOT / "ProgressGlanceWidget.kt",
]

REPLACEMENTS = {
    "GlanceTypography.Title":
        "TextStyle(color = colors.TEXT, fontWeight = FontWeight.Bold)",

    "GlanceTypography.Body":
        "TextStyle(color = colors.TEXT)",

    "GlanceTypography.Secondary":
        "TextStyle(color = colors.SUBTEXT)",

    "GlanceTypography.Accent":
        "TextStyle(color = colors.ACCENT, fontWeight = FontWeight.Bold)",
}

def ensure_import(text, imp):
    if imp in text:
        return text

    lines = text.splitlines()

    last_import = -1
    for i, line in enumerate(lines):
        if line.startswith("import "):
            last_import = i

    if last_import == -1:
        raise RuntimeError("No import section found.")

    lines.insert(last_import + 1, imp)
    return "\n".join(lines)


for file in FILES:
    if not file.exists():
        print(f"Missing: {file}")
        sys.exit(1)

    backup = file.with_suffix(file.suffix + ".bak")
    shutil.copy2(file, backup)

    text = file.read_text()

    changed = False

    for old, new in REPLACEMENTS.items():
        if old in text:
            text = text.replace(old, new)
            changed = True

    if changed:
        text = ensure_import(
            text,
            "import androidx.glance.text.TextStyle"
        )

        text = ensure_import(
            text,
            "import androidx.glance.text.FontWeight"
        )

        file.write_text(text)
        print(f"✓ Patched {file.name}")
    else:
        print(f"✓ {file.name} already patched")

typography = ROOT / "GlanceTypography.kt"

if typography.exists():
    backup = typography.with_suffix(".kt.bak")
    shutil.copy2(typography, backup)
    typography.unlink()
    print("✓ Removed GlanceTypography.kt")

print("\nDone.")

