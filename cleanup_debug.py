from pathlib import Path
import re

# ---------- index.tsx ----------
p = Path("artifacts/mobile/app/(tabs)/index.tsx")
s = p.read_text()

s = re.sub(
    r"\s*const debugInfo = `Habits: \$\{habits\.length\}[\s\S]*?Today's: \$\{todayHabits\.length\}`;\n",
    "\n",
    s,
    count=1,
)

s = re.sub(
    r'\n\s*<View style=\{\{padding:\d+,borderWidth:1,borderColor:\'red\',marginBottom:\d+\}\}>\s*<Text style=\{\{color:\'red\'\}\}>\{debugInfo\}</Text>\s*</View>',
    "",
    s,
)

p.write_text(s)

# ---------- HeatmapGlanceWidget.kt ----------
p = Path("artifacts/mobile/android/app/src/main/java/com/forgehabits/app/glance/HeatmapGlanceWidget.kt")
s = p.read_text()

s = re.sub(
    r",\s*snapshotToday:\s*String\s*=\s*\"\"\s*",
    "",
    s,
)

s = s.replace(
    "heatmap = snapshot?.heatmap ?: emptyList(),\n                    snapshotToday = snapshot?.today ?: \"null\"",
    "heatmap = snapshot?.heatmap ?: emptyList()"
)

s = re.sub(
    r"\n\s*val lastDay = heatmap\.lastOrNull\(\)[\s\S]*?else -> \"ACCENT\"\n\s*}\n",
    "\n",
    s,
)

s = re.sub(
    r'\n\s*Text\(\s*text = "DBG[\s\S]*?style = TextStyle\(color = GlanceColors\.ACCENT\)\s*\)\n',
    "\n",
    s,
)

p.write_text(s)

print("✅ Debug code removed.")
