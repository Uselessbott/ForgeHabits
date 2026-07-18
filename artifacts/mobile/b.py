from pathlib import Path

p = Path("app/_layout.tsx")
text = p.read_text(encoding="utf-8")

text = text.replace(
    "const { updateSettings } = useHabits();",
    "const { updateSettings, isLoading } = useHabits();"
)

old = """  useEffect(() => {
    setupNotificationChannel().then(() => {
      requestNotificationPermissions().then(granted => {
        updateSettings({ notificationsEnabled: granted });
      });
    });
  }, []);"""

new = """  useEffect(() => {
    if (isLoading) return;

    setupNotificationChannel().then(() => {
      requestNotificationPermissions().then(granted => {
        updateSettings({ notificationsEnabled: granted });
      });
    });
  }, [isLoading]);"""

if old not in text:
    raise SystemExit("Couldn't find useEffect to patch")

text = text.replace(old, new, 1)

p.write_text(text, encoding="utf-8")
print("✅ app/_layout.tsx patched.")

