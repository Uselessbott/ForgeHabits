import 'expo-router/entry';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerWidgetTaskHandler, requestWidgetUpdate, FlexWidget, TextWidget } from 'react-native-android-widget';
import { ForgeHabitsWidget } from './widgets/Widget';

function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateStr(d: Date): string {
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

function buildHeatmapHistory(habits: any[], logs: any[], today: string, weeks: number) {
  const totalDays = weeks * 7;
  const history: { date: string; pct: number; hasData: boolean }[] = [];
  const cursor = parseDate(today);
  cursor.setDate(cursor.getDate() - (totalDays - 1));

  for (let i = 0; i < totalDays; i++) {
    const ds = formatDateStr(cursor);
    const scheduled = habits.filter((h: any) => isScheduledToday(h, ds));
    const total = scheduled.length;
    const completedCount = scheduled.filter((h: any) =>
      logs.some((l: any) =>
        l.habitId === h.id && l.date === ds && (l.status === 'completed' || l.status === 'frozen')
      )
    ).length;
    const pct = total > 0 ? completedCount / total : 0;
    history.push({ date: ds, pct, hasData: total > 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return history;
}

const ALL_WIDGET_NAMES = ['ForgeHabitsProgress', 'ForgeHabitsTasks', 'ForgeHabitsCombined', 'ForgeHabitsHeatmap'];

function widgetTypeFor(widgetName: string): 'progress' | 'tasks' | 'combined' | 'heatmap' {
  if (widgetName === 'ForgeHabitsProgress') return 'progress';
  if (widgetName === 'ForgeHabitsTasks') return 'tasks';
  if (widgetName === 'ForgeHabitsHeatmap') return 'heatmap';
  return 'combined';
}

registerWidgetTaskHandler(async ({ widgetName, renderWidget, widgetAction, clickAction, clickActionData }: any) => {
  if (!widgetName.startsWith('ForgeHabits')) return;

  try {
    if (widgetAction === 'WIDGET_CLICK' && clickAction === 'TOGGLE_HABIT' && clickActionData?.habitId) {
      await toggleHabitCompletion(clickActionData.habitId);
    }

    let habits: any[] = [];
    let logs: any[] = [];
    let [rawHabits, rawLogs] = await Promise.all([
      AsyncStorage.getItem('@fg:habits'),
      AsyncStorage.getItem('@fg:logs'),
    ]);
    if (!rawHabits) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      [rawHabits, rawLogs] = await Promise.all([
        AsyncStorage.getItem('@fg:habits'),
        AsyncStorage.getItem('@fg:logs'),
      ]);
    }
    habits = rawHabits ? JSON.parse(rawHabits) : [];
    logs = rawLogs ? JSON.parse(rawLogs) : [];

    const today = getTodayStr();
    const scheduled = habits.filter((h: any) => isScheduledToday(h, today));
    const total = scheduled.length;

    let habitList = scheduled.map((h: any) => ({
      id: h.id,
      name: h.name,
      completed: logs.some((l: any) =>
        l.habitId === h.id &&
        l.date === today &&
        (l.status === 'completed' || l.status === 'frozen')
      ),
    }));

    if (widgetAction === 'WIDGET_CLICK' && clickAction === 'COMPLETE_NEXT') {
      const next = habitList.find((h: any) => !h.completed);
      if (next) {
        await toggleHabitCompletion(next.id);
        const rawLogs2 = await AsyncStorage.getItem('@fg:logs');
        logs = rawLogs2 ? JSON.parse(rawLogs2) : [];
        habitList = scheduled.map((h: any) => ({
          id: h.id,
          name: h.name,
          completed: logs.some((l: any) =>
            l.habitId === h.id &&
            l.date === today &&
            (l.status === 'completed' || l.status === 'frozen')
          ),
        }));
      }
    }

    const completed = habitList.filter((h: any) => h.completed).length;
    const remaining = total - completed;
    const streak = getBestStreakToday(habits, logs, today);
    const widgetType = widgetTypeFor(widgetName);
    const history = widgetType === 'heatmap' ? buildHeatmapHistory(habits, logs, today, 10) : undefined;

    await renderWidget(
      <ForgeHabitsWidget
        completed={completed}
        total={total}
        remaining={remaining}
        streak={streak}
        habits={habitList}
        widgetType={widgetType}
        history={history}
      />
    );

    const didModify =
      (widgetAction === 'WIDGET_CLICK' && clickAction === 'TOGGLE_HABIT') ||
      (widgetAction === 'WIDGET_CLICK' && clickAction === 'COMPLETE_NEXT');

    if (didModify) {
      for (const otherName of ALL_WIDGET_NAMES) {
        if (otherName === widgetName) continue;
        const otherType = widgetTypeFor(otherName);
        const otherHistory = otherType === 'heatmap' ? buildHeatmapHistory(habits, logs, today, 10) : undefined;
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
              history={otherHistory}
            />
          ),
        });
      }
    }
  } catch (e: any) {
    const message = e?.message ? String(e.message) : String(e);
    await renderWidget(
      <FlexWidget
        style={{
          width: 'match_parent',
          height: 'match_parent',
          backgroundColor: '#2e1a1a',
          padding: 8,
          flexDirection: 'column',
        }}
      >
        <TextWidget
          text="⚠️ Widget error"
          style={{ fontSize: 12, fontWeight: 'bold', color: '#ff6666' }}
        />
        <TextWidget
          text={message.slice(0, 150)}
          style={{ fontSize: 9, color: '#ffaaaa', marginTop: 4 }}
        />
      </FlexWidget>
    );
  }
});
