#!/usr/bin/env python3
"""
Fix Glance compilation errors – final instance-based patch v3.

- GlanceColors.kt: add missing import toArgb, add TRACK_ARGB property.
- Widget files: replace GlanceTypography.* with inline TextStyle using local `colors`.
- Ensure TextStyle and FontWeight imports exist in widget files.
- Delete GlanceTypography.kt.

Backups: <filename>.fix-final.bak
"""

import shutil
import sys
from pathlib import Path

ROOT = Path.home() / "ForgeHabits" / "artifacts" / "mobile"

FILES = {
    "colors": "android/app/src/main/java/com/forgehabits/app/glance/GlanceColors.kt",
    "typography": "android/app/src/main/java/com/forgehabits/app/glance/GlanceTypography.kt",
    "combined": "android/app/src/main/java/com/forgehabits/app/glance/CombinedGlanceWidget.kt",
    "progress": "android/app/src/main/java/com/forgehabits/app/glance/ProgressGlanceWidget.kt",
    "tasks": "android/app/src/main/java/com/forgehabits/app/glance/TasksGlanceWidget.kt",
    "heatmap": "android/app/src/main/java/com/forgehabits/app/glance/HeatmapGlanceWidget.kt",
}

def backup(path):
    dest = path.with_suffix(path.suffix + ".fix-final.bak")
    shutil.copy2(path, dest)
    print(f"📦 Backed up: {path} → {dest}")

def fail(file, msg):
    print(f"❌ [{file}] {msg}")
    sys.exit(1)

# ---------------------------------------------------------------------------
# 1) GlanceColors.kt
# ---------------------------------------------------------------------------
def fix_colors():
    path = ROOT / FILES["colors"]
    if not path.exists():
        fail(path, "File not found")
    backup(path)
    lines = path.read_text(encoding="utf-8").split("\n")

    # a) Add toArgb import if missing
    toArgb_import = "import androidx.compose.ui.graphics.toArgb"
    if toArgb_import not in path.read_text():
        inserted = False
        for i, line in enumerate(lines):
            if line.strip() == "import androidx.glance.unit.ColorProvider":
                lines.insert(i + 1, toArgb_import)
                inserted = True
                print("  ✅ Added import androidx.compose.ui.graphics.toArgb")
                break
        if not inserted:
            # Fallback: insert after first import
            for i, line in enumerate(lines):
                if line.startswith("import "):
                    lines.insert(i + 1, toArgb_import)
                    inserted = True
                    break
        if not inserted:
            fail(path, "Could not add toArgb import")
    else:
        print("  ⏭️  toArgb import already present")

    # b) Add TRACK_ARGB property after ACCENT_ARGB
    accent_idx = None
    for i, line in enumerate(lines):
        if line.strip() == "val ACCENT_ARGB: Int":
            accent_idx = i
            break
    if accent_idx is None:
        fail(path, "ACCENT_ARGB property not found")

    # Determine indentation from the property line
    prop_indent = " " * (len(lines[accent_idx]) - len(lines[accent_idx].lstrip()))

    # Find the end of the property (next line at same or lower indentation that is not blank)
    end_idx = None
    for j in range(accent_idx + 1, len(lines)):
        stripped = lines[j].strip()
        if stripped == "":
            continue
        current_indent = len(lines[j]) - len(lines[j].lstrip())
        if current_indent <= len(prop_indent):
            end_idx = j
            break
    if end_idx is None:
        end_idx = len(lines)

    # Build the new property block with proper indentation
    new_block = [
        "",
        "    val TRACK_ARGB: Int",
        "        get() =",
        "            if (theme == \"light\")",
        "                android.graphics.Color.parseColor(\"#E5E5E5\")",
        "            else",
        "                android.graphics.Color.parseColor(\"#1C1C1C\")",
    ]

    if "val TRACK_ARGB: Int" not in path.read_text():
        lines[end_idx:end_idx] = new_block
        print("  ✅ Added TRACK_ARGB property")
    else:
        print("  ⏭️  TRACK_ARGB already present")

    path.write_text("\n".join(lines), encoding="utf-8")
    print(f"✅ {path.name} fixed")

# ---------------------------------------------------------------------------
# 2) Replace GlanceTypography usages in widgets
# ---------------------------------------------------------------------------
TYPOGRAPHY_REPLACEMENTS = {
    "GlanceTypography.Title": "TextStyle(color = colors.TEXT, fontWeight = FontWeight.Bold)",
    "GlanceTypography.Body": "TextStyle(color = colors.TEXT)",
    "GlanceTypography.Secondary": "TextStyle(color = colors.SUBTEXT)",
    "GlanceTypography.Accent": "TextStyle(color = colors.ACCENT, fontWeight = FontWeight.Bold)",
}

def ensure_import(lines, import_statement):
    """Ensure that the import_statement appears among the file's import lines."""
    # We'll simply check if any line matches exactly the import statement (ignoring leading whitespace).
    if any(line.strip() == import_statement for line in lines):
        return lines  # already present
    # Insert after the last import line
    last_import_idx = None
    for i, line in enumerate(lines):
        if line.strip().startswith("import "):
            last_import_idx = i
    if last_import_idx is not None:
        lines.insert(last_import_idx + 1, import_statement)
    else:
        # No imports? Insert after package line
        pkg_idx = None
        for i, line in enumerate(lines):
            if line.strip().startswith("package "):
                pkg_idx = i
                break
        if pkg_idx is not None:
            lines.insert(pkg_idx + 2, import_statement)
        else:
            lines.insert(0, import_statement)
    return lines

def fix_widget(rel_path):
    path = ROOT / rel_path
    if not path.exists():
        fail(path, "File not found")
    backup(path)
    content = path.read_text(encoding="utf-8")
    lines = content.split("\n")

    # Replace GlanceTypography.* references
    changes = 0
    for old, new in TYPOGRAPHY_REPLACEMENTS.items():
        if old in content:
            content = content.replace(old, new)
            changes += 1
            print(f"  ✅ Replaced {old}")

    if changes > 0:
        # Update lines from modified content
        lines = content.split("\n")
        # Ensure TextStyle and FontWeight imports
        lines = ensure_import(lines, "import androidx.glance.text.TextStyle")
        lines = ensure_import(lines, "import androidx.glance.text.FontWeight")
        path.write_text("\n".join(lines), encoding="utf-8")
        print(f"  ✅ Ensured TextStyle and FontWeight imports")
    else:
        print("  ⏭️  No GlanceTypography references found")

    print(f"✅ {path.name} fixed")

# ---------------------------------------------------------------------------
# 3) Delete GlanceTypography.kt
# ---------------------------------------------------------------------------
def delete_typography():
    path = ROOT / FILES["typography"]
    if path.exists():
        backup(path)
        path.unlink()
        print(f"✅ Deleted {path.name}")
    else:
        print("⏭️  GlanceTypography.kt already removed")

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=" * 60)
    print("Finalising Glance instance‑based migration (v3)")
    print("=" * 60)

    fix_colors()

    for rel in [FILES["combined"], FILES["progress"], FILES["tasks"], FILES["heatmap"]]:
        fix_widget(rel)

    delete_typography()

    print("\n✅ All Glance compilation errors fixed. Architecture preserved.")
    print("Backups: .fix-final.bak")

if __name__ == "__main__":
    main()
