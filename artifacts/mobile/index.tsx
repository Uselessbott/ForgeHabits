import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { registerWidgetTaskHandler } from 'react-native-android-widget';

// ─── Minimal helpers ────────────────────────────────────────────────

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

// ─── Widget Task Handler ───────────────────────────────────────────────

registerWidgetTaskHandler(async ({ widgetName, renderWidget }) => {
  if (!widgetName.startsWith('ForgeHabits')) return;

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
});
