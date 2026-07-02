import 'expo-router/entry';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { Habit, HabitLog } from './context/types';

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

function isScheduledToday(habit: Habit, today: string): boolean {
  if (habit.archived) return false;
  const date = parseDate(today);
  const created = parseDate(habit.createdAt);
  if (date < created) return false;

  const { repetition } = habit;
  if (repetition && repetition.type !== 'forever') {
    if (repetition.type === 'days') {
      const end = new Date(created);
      end.setDate(end.getDate() + repetition.count - 1);
      if (date > end) return false;
    } else if (repetition.type === 'weeks') {
      const end = new Date(created);
      end.setDate(end.getDate() + repetition.count * 7 - 1);
      if (date > end) return false;
    } else if (repetition.type === 'months') {
      const end = new Date(created);
      end.setMonth(end.getMonth() + repetition.count);
      end.setDate(end.getDate() - 1);
      if (date > end) return false;
    } else if (repetition.type === 'until' && repetition.endDate) {
      if (date > parseDate(repetition.endDate)) return false;
    }
  }

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

function getBestStreakToday(habits: Habit[], logs: HabitLog[], today: string): number {
  let best = 0;
  for (const habit of habits) {
    if (habit.archived) continue;
    let streak = 0;
    const todayDate = parseDate(today);
    const created = parseDate(habit.createdAt);
    const cursor = new Date(todayDate);
    let attempts = 0;
    while (attempts < 365) {
      if (cursor < created) break;
      const ds = [
        cursor.getFullYear(),
        String(cursor.getMonth() + 1).padStart(2, '0'),
        String(cursor.getDate()).padStart(2, '0'),
      ].join('-');
      if (!isScheduledToday(habit, ds)) {
        cursor.setDate(cursor.getDate() - 1);
        attempts++;
        continue;
      }
      const log = logs.find(l => l.habitId === habit.id && l.date === ds);
      if (!log) {
        if (ds === today) {
          cursor.setDate(cursor.getDate() - 1);
          attempts++;
          continue;
        }
        break;
      }
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
  if (widgetName !== 'ForgeHabitsWidget') return;

  const { ForgeHabitsWidget } = require('./widgets/Widget');

  // Read raw data from AsyncStorage
  let habits: Habit[] = [];
  let logs: HabitLog[] = [];
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

  // Compute today's scheduled habits
  const scheduled = habits.filter(h => isScheduledToday(h, today));
  const total = scheduled.length;

  // Build habit list with completion status
  const habitList = scheduled.map(h => ({
    id: h.id,
    name: h.name,
    completed: logs.some(l => 
      l.habitId === h.id && 
      l.date === today && 
      (l.status === 'completed' || l.status === 'frozen')
    ),
  }));

  const completed = habitList.filter(h => h.completed).length;
  const remaining = total - completed;
  const streak = getBestStreakToday(habits, logs, today);

  // Render all 3 widget types - the widget will pick based on widgetType prop
  // The native widget class will use the first one, but we render the combined as default
  await renderWidget(
    <ForgeHabitsWidget
      completed={completed}
      total={total}
      remaining={remaining}
      streak={streak}
      habits={habitList}
      widgetType="combined"  // Change to 'progress' or 'tasks' for different views
    />
  );
});
