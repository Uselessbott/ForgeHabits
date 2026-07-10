from pathlib import Path

p = Path("artifacts/mobile/android/app/src/main/java/com/forgehabits/app/glance/HeatmapGlanceWidget.kt")
s = p.read_text()

start = s.index("    val gap = when {")
end = s.index("    Column(", start)

replacement = """    val availableWidth = (size.width.value - paddingPx * 2).coerceAtLeast(40f)
    val availableHeight = (size.height.value - paddingPx * 2 - headerHeight).coerceAtLeast(30f)

    val provisionalGap = 3f
    val cellFromWidth = (availableWidth - provisionalGap * (cols - 1)) / cols
    val cellFromHeight = (availableHeight - provisionalGap * 6) / 7
    val cellSize = minOf(cellFromWidth, cellFromHeight).coerceAtLeast(4f)

    val gap = when {
        cellSize >= 14f -> 4f
        cellSize >= 9f -> 3f
        else -> 2f
    }

"""

p.write_text(s[:start] + replacement + s[end:])
print("Done.")
