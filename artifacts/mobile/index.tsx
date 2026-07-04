import 'expo-router/entry';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerWidgetTaskHandler, requestWidgetUpdate } from 'react-native-android-widget';
import { ForgeHabitsWidget } from './widgets/Widget';

// ── Minimal helpers ──────────────────────────────────────────────────────

function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isScheduledToday(habit: any, today: string): boolean {
  if (habit.archived) return false;
  const date = parseDate(today);
  const created = parseDate(habit.createdAt);
  if (date < created) return false;

  const dow = date.getDay();
  const dom = date.getDate();
  switch (habit.frequency) {
    case 'daily': return true;
    case 'weekly': return (habit.weekdays ?? []).includes(dow);
    case 'weekly_target': return true;
    case 'monthly': return (habit.monthlyDates ?? []).includes(dom);
    default: return false;
  }
}

function getBestStreakToday(habits: any[], logs: any[], today: string): number {
  let best = 0;
  for (const habit of habits) {
    if (habit.archived) continue;
    let streak = 0;
    const cursor = new Date(parseDate(today));
    let attempts = 0;
    while (attempts < 365) {
      const ds = cursor.toISOString().split('T')[0];
      if (!isScheduledToday(habit, ds)) {
        cursor.setDate(cursor.getDate() - 1);
        attempts++;
        continue;
      }
      const log = logs.find((l: any) => l.habitId === habit.id && l.date === ds);
      if (!log) break;
      if (log.status === 'completed' || log.status === 'frozen') {
        streak++;
      } else {
        break;
      }
      cursor.setDate(cursor.getDate() - 1);
      attempts++;
    }
    if (streak > best) best = streak;
  }
  return best;
}

function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Toggle today's completion for a habit directly in AsyncStorage.
// Mirrors the shape HabitsContext / markHabit uses for HabitLog.
async function toggleHabitCompletion(habitId: string): Promise<void> {
  const today = getTodayStr();
  const rawLogs = await AsyncStorage.getItem('@fg:logs');
  const logs: any[] = rawLogs ? JSON.parse(rawLogs) : [];

  const existingIndex = logs.findIndex(
    (l) => l.habitId === habitId && l.date === today
  );

  let updatedLogs: any[];
  if (existingIndex >= 0 && logs[existingIndex].status === 'completed') {
    // Already completed -> uncheck (remove today's log)
    updatedLogs = logs.filter((_, i) => i !== existingIndex);
  } else if (existingIndex >= 0) {
    // Log exists but not completed (e.g. missed/frozen) -> mark completed
    updatedLogs = logs.map((l, i) =>
      i === existingIndex
        ? { ...l, status: 'completed', completedAt: new Date().toISOString() }
        : l
    );
  } else {
    // No log yet -> create a completed one
    updatedLogs = [
      ...logs,
      {
        id: generateLogId(),
        habitId,
        date: today,
        status: 'completed',
        completedAt: new Date().toISOString(),
      },
    ];
  }

  await AsyncStorage.setItem('@fg:logs', JSON.stringify(updatedLogs));
}

async function computeWidgetProps(widgetName: string) {
  let habits: any[] = [];
  let logs: any[] = [];
  try {
    const [rawHabits, rawLogs] = await Promise.all([
      AsyncStorage.getItem('@fg:habits'),
      AsyncStorage.getItem('@fg:logs'),
    ]);
    habits = rawHabits ? JSON.parse(rawHabits) : [];
    logs = rawLogs ? JSON.parse(rawLogs) : [];
  } catch {
    return null;
  }

  const today = getTodayStr();
  const scheduled = habits.filter((h: any) => isScheduledToday(h, today));
  const total = scheduled.length;

  const habitList = scheduled.map((h: any) => ({
    id: h.id,
    name: h.name,
    completed: logs.some(
      (l: any) =>
        l.habitId === h.id &&
        l.date === today &&
        (l.status === 'completed' || l.status === 'frozen')
    ),
  }));

  const completed = habitList.filter((h: any) => h.completed).length;
  const remaining = total - completed;
  const streak = getBestStreakToday(habits, logs, today);

  let widgetType: 'progress' | 'tasks' | 'combined' = 'combined';
  if (widgetName === 'ForgeHabitsProgress') widgetType = 'progress';
  else if (widgetName === 'ForgeHabitsTasks') widgetType = 'tasks';

  return { completed, total, remaining, streak, habitList, widgetType };
}

const ALL_WIDGET_NAMES = ['ForgeHabitsProgress', 'ForgeHabitsTasks', 'ForgeHabitsCombined'];

async function refreshAllWidgets() {
  for (const name of ALL_WIDGET_NAMES) {
    const props = await computeWidgetProps(name);
    if (!props) continue;
    await requestWidgetUpdate({
      widgetName: name,
      renderWidget: () => (
        <ForgeHabitsWidget
          completed={props.completed}
          total={props.total}
          remaining={props.remaining}
          streak={props.streak}
          habits={props.habitList}
          widgetType={props.widgetType}
        />
      ),
    });
  }
}

// ── Widget Task Handler ──────────────────────────────────────────────────

registerWidgetTaskHandler(async (widgetInfo) => {
  const { widgetName, renderWidget, widgetAction } = widgetInfo;
  if (!widgetName.startsWith('ForgeHabits')) return;

  if (widgetAction === 'WIDGET_CLICK') {
    const { clickAction, clickActionData } = widgetInfo as any;
    if (clickAction === 'TOGGLE_HABIT' && clickActionData?.habitId) {
      await toggleHabitCompletion(clickActionData.habitId);
      // Refresh every widget so progress/streak stay consistent everywhere,
      // not just the one that was tapped.
      await refreshAllWidgets();
      return;
    }
  }

  const props = await computeWidgetProps(widgetName);
  if (!props) {
    await renderWidget(<ForgeHabitsWidget />);
    return;
  }

  await renderWidget(
    <ForgeHabitsWidget
      completed={props.completed}
      total={props.total}
      remaining={props.remaining}
      streak={props.streak}
      habits={props.habitList}
      widgetType={props.widgetType}
    />
  );
});
