from pathlib import Path

p = Path("context/HabitsContext.tsx")
text = p.read_text(encoding="utf-8")

old1 = "await refreshWidget(loadedHabits, newLogs);"
new1 = """await refreshWidget(
            loadedHabits,
            newLogs,
            wasReset ? [] : loadedTodayTasks,
            finalSettings
          );"""

old2 = "await refreshWidget(habits, resetLogs);"
new2 = """await refreshWidget(
            habits,
            resetLogs,
            [],
            updatedSettings
          );"""

if old1 not in text:
    raise SystemExit("Couldn't find startup refreshWidget() call")

if old2 not in text:
    raise SystemExit("Couldn't find reconcile refreshWidget() call")

text = text.replace(old1, new1, 1)
text = text.replace(old2, new2, 1)

p.write_text(text, encoding="utf-8")

print("✅ Patched both refreshWidget() call sites.")

