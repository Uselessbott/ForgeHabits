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

async function toggleHabitCompletion(habitId: string): Promise<void> {
  const today = getTodayStr();
  const rawLogs = await AsyncStorage.getItem('@fg:logs');
  const logs: any[] = rawLogs ? JSON.parse(rawLogs) : [];

  const existingIndex = logs.findIndex(
    (l: any) => l.habitId === habitId && l.date === today
  );

  let updatedLogs: any[];
  if (existingIndex >= 0 && logs[existingIndex].status === 'completed') {
    updatedLogs = logs.filter((_: any, i: number) => i !== existingIndex);
  } else if (existingIndex >= 0) {
    updatedLogs = logs.map((l: any, i: number) =>
      i === existingIndex
        ? { ...l, status: 'completed', completedAt: new Date().toISOString() }
        : l
    );
  } else {
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

const ALL_WIDGET_NAMES = ['ForgeHabitsProgress', 'ForgeHabitsTasks', 'ForgeHabitsCombined'];

// ── Widget Task Handler ──────────────────────────────────────────────────

registerWidgetTaskHandler(async ({ widgetName, renderWidget, widgetAction, clickAction, clickActionData }: any) => {
  if (!widgetName.startsWith('ForgeHabits')) return;

  if (widgetAction === 'WIDGET_CLICK' && clickAction === 'TOGGLE_HABIT' && clickActionData?.habitId) {
    await toggleHabitCompletion(clickActionData.habitId);
    // fall through below to re-render the widget that was tapped with fresh data,
    // then also nudge the other two widgets so progress/streak stay in sync.
  }

  let habits: any[] = [];
  let logs: any[] = [];
  try {
    let [rawHabits, rawLogs] = await Promise.all([
      AsyncStorage.getItem('@fg:habits'),
      AsyncStorage.getItem('@fg:logs'),
    ]);
    // On a fresh widget placement (cold start / headless), the native
    // storage bridge can occasionally answer before it's fully warmed up,
    // returning null even though data exists on disk. Retry once shortly
    // after before falling back to the empty state.
    if (!rawHabits) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      [rawHabits, rawLogs] = await Promise.all([
        AsyncStorage.getItem('@fg:habits'),
        AsyncStorage.getItem('@fg:logs'),
      ]);
    }
    habits = rawHabits ? JSON.parse(rawHabits) : [];
    logs = rawLogs ? JSON.parse(rawLogs) : [];
  } catch {
    await renderWidget(<ForgeHabitsWidget />);
    return;
  }

  const today = getTodayStr();
  const scheduled = habits.filter((h: any) => isScheduledToday(h, today));
  const total = scheduled.length;

  const habitList = scheduled.map((h: any) => ({
    id: h.id,
    name: h.name,
    completed: logs.some((l: any) =>
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

  await renderWidget(
    <ForgeHabitsWidget
      completed={completed}
      total={total}
      remaining={remaining}
      streak={streak}
      habits={habitList}
      widgetType={widgetType}
    />
  );

  if (widgetAction === 'WIDGET_CLICK' && clickAction === 'TOGGLE_HABIT') {
    // Keep the other two widgets in sync after a tap.
    for (const otherName of ALL_WIDGET_NAMES) {
      if (otherName === widgetName) continue;
      let otherType: 'progress' | 'tasks' | 'combined' = 'combined';
      if (otherName === 'ForgeHabitsProgress') otherType = 'progress';
      else if (otherName === 'ForgeHabitsTasks') otherType = 'tasks';
      await requestWidgetUpdate({
        widgetName: otherName,
        renderWidget: () => (
          <ForgeHabitsWidget
            completed={completed}
            total={total}
            remaining={remaining}
            streak={streak}
            habits={habitList}
            widgetType={otherType}
          />
        ),
      });
    }
  }
});
