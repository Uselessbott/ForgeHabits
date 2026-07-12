import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform, AppState, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Habit, Category, HabitLog, AppSettings, DailyScore,
  LogStatus, LifetimeStats, WeeklyStats, MonthlyStats, DailyStats, StreakFreeze,
} from './types';
import {
  formatDate, parseDate, getTodayStr, isHabitScheduledForDate,
  getWeekStart, generateId, addDays, getMonthStr, WEEKDAY_SHORT,
} from '@/utils/scheduling';
import { getCurrentStreak, getLongestStreak } from '@/utils/streaks';
import { runDailyReset } from '@/utils/dailyReset';
import * as Notifications from 'expo-notifications';
import {
  startMonkModeSession,
  syncMonkModeSession,
  stopMonkModeSession,
  getMonkModeSessionState,
} from "@/utils/monkMode";

const KEYS = {
  HABITS: '@fg:habits',
  CATEGORIES: '@fg:categories',
  LOGS: '@fg:logs',
  SETTINGS: '@fg:settings',
  FREEZES: '@fg:freezes',
};

const DEFAULT_SETTINGS: AppSettings = {
  userName: '',
  monkModeEnabled: false,
  notificationsEnabled: false,
  lastResetDate: '',
  lastWeeklyReviewDate: '',
  theme: 'dark',
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_fitness', name: 'Fitness', emoji: '💪', order: 0, collapsed: false },
  { id: 'cat_learning', name: 'Learning', emoji: '📚', order: 1, collapsed: false },
  { id: 'cat_mindset', name: 'Mindset', emoji: '🧠', order: 2, collapsed: false },
  { id: 'cat_finance', name: 'Finance', emoji: '💰', order: 3, collapsed: false },
];

interface HabitsContextType {
  habits: Habit[];
  categories: Category[];
  logs: HabitLog[];
  freezes: StreakFreeze[];
  settings: AppSettings;
  isLoading: boolean;
  createHabit: (data: Omit<Habit, 'id' | 'createdAt' | 'archived' | 'sortOrder'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  archiveHabit: (id: string) => void;
  restoreHabit: (id: string) => void;
  createCategory: (data: Omit<Category, 'id' | 'order' | 'collapsed'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (orderedIds: string[]) => void;
  toggleCategoryCollapsed: (id: string) => void;
  markHabit: (habitId: string, date: string) => void;
  applyStreakFreeze: () => boolean;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetAllData: () => Promise<void>;
  getHabitsForDate: (date: string) => Habit[];
  getLogForHabit: (habitId: string, date: string) => HabitLog | undefined;
  getDailyScore: (date: string) => DailyScore;
  getDailyStats: (date: string) => DailyStats;
  getStreakData: (habitId: string) => { current: number; longest: number };
  getWeeklyTargetProgress: (habitId: string, weekStart: string) => { completed: number; target: number };
  getCalendarDay: (date: string) => { color: 'none' | 'red' | 'yellow' | 'green'; completed: number; total: number; missed: number; percentage: number; streak: number };
  canUseStreakFreeze: () => boolean;
  getLifetimeStats: () => LifetimeStats;
  getWeeklyStats: (weekStart: string) => WeeklyStats;
  getMonthlyStats: (month: string) => MonthlyStats;
  getWeeklyReview: () => WeeklyStats & { summary: string };
  getLast7DaysData: () => Array<{ date: string; label: string; percentage: number; completed: number; total: number }>;
  getHabitCompletionHistory: (habitId: string, days: number) => Array<{ date: string; completed: boolean }>;
  getOverallConsistency: () => Array<{ date: string; color: 'none' | 'red' | 'yellow' | 'green' }>;
  searchHabits: (query: string) => Habit[];
}

const HabitsContext = createContext<HabitsContextType | null>(null);

function save(key: string, data: unknown) {
  AsyncStorage.setItem(key, JSON.stringify(data)).catch(() => {});
}


export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [freezes, setFreezes] = useState<StreakFreeze[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const resetRanRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const [h, c, l, s, f] = await Promise.all([
          AsyncStorage.getItem(KEYS.HABITS),
          AsyncStorage.getItem(KEYS.CATEGORIES),
          AsyncStorage.getItem(KEYS.LOGS),
          AsyncStorage.getItem(KEYS.SETTINGS),
          AsyncStorage.getItem(KEYS.FREEZES),
        ]);
        const loadedHabits: Habit[] = h ? JSON.parse(h) : [];
        const loadedCategories: Category[] = c ? JSON.parse(c) : DEFAULT_CATEGORIES;
        const loadedLogs: HabitLog[] = l ? JSON.parse(l) : [];
        const loadedSettings: AppSettings = s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS;
        const loadedFreezes: StreakFreeze[] = f ? JSON.parse(f) : [];
        if (!c) save(KEYS.CATEGORIES, DEFAULT_CATEGORIES);
        if (!resetRanRef.current) {
          resetRanRef.current = true;
          const { newLogs, updatedSettings } = runDailyReset(loadedHabits, loadedLogs, loadedSettings);
          let finalSettings = updatedSettings;
          try {
            const permResult = await Notifications.getPermissionsAsync();
            const actuallyGranted = permResult.status === 'granted';
            if (actuallyGranted !== updatedSettings.notificationsEnabled) {
              finalSettings = { ...updatedSettings, notificationsEnabled: actuallyGranted };
            }
          } catch {}
          setHabits(loadedHabits);
          setCategories(loadedCategories);
          setLogs(newLogs);
          setSettings(finalSettings);
          setFreezes(loadedFreezes);
          if (newLogs.length !== loadedLogs.length) save(KEYS.LOGS, newLogs);
          if (finalSettings !== loadedSettings) save(KEYS.SETTINGS, finalSettings);
        }
      } catch {
        setCategories(DEFAULT_CATEGORIES);
      }
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    refreshWidget(habits, logs);
  }, [habits, logs, isLoading]);


  useEffect(() => {
    if (Platform.OS !== 'android' || isLoading) return;
    const reconcile = async () => {
      try {
        const sessionState = await getMonkModeSessionState();
        if (!sessionState?.isActive) {
          // Native side may have auto-stopped the session (all habits done,
          // or it expired). Reflect that in the Profile toggle too.
          if (settings.monkModeEnabled) {
            const updated = { ...settings, monkModeEnabled: false };
            setSettings(updated);
            save(KEYS.SETTINGS, updated);
          }
          return;
        }
        const today = getTodayStr();
        if (sessionState.sessionDate !== today) {
          await stopMonkModeSession();
          return;
        }
        let needsUpdate = false;
        const updatedLogs = [...logs];
        sessionState.habits.forEach(habit => {
          if (!habit.completed) return;
          const exists = updatedLogs.some(
            l =>
              l.habitId === habit.id &&
              l.date === today &&
              (l.status === "completed" || l.status === "frozen")
          );
          if (!exists) {
            updatedLogs.push({
              id: generateId(),
              habitId: habit.id,
              date: today,
              status: "completed",
              completedAt: new Date().toISOString(),
            });
            needsUpdate = true;
          }
        });
        if (needsUpdate) {
          setLogsAndSave(updatedLogs);
        }
        const scheduled = habits.filter(
          h => !h.archived && isHabitScheduledForDate(h, today)
        );
        await syncMonkModeSession(
          scheduled.map(h => ({
            id: h.id,
            name: h.name,
            completed: updatedLogs.some(
              l =>
                l.habitId === h.id &&
                l.date === today &&
                (l.status === "completed" || l.status === "frozen")
            ),
          }))
        );
      } catch {}
    };
    reconcile();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        reconcile();
      }
    });

    return () => subscription.remove();
  }, [isLoading]);


  function refreshWidget(habitsOverride, logsOverride) {
    if (Platform.OS !== 'android') return;
    try {

    const h = habitsOverride ?? habits;
    const l = logsOverride ?? logs;
    const today = getTodayStr();
    const scheduled = h.filter(hb => !hb.archived && isHabitScheduledForDate(hb, today));
    const total = scheduled.length;

    const habitList = scheduled.map(hb => ({
      id: hb.id,
      name: hb.name,
      completed: l.some(log =>
        log.habitId === hb.id &&
        log.date === today &&
        (log.status === 'completed' || log.status === 'frozen')
      ),
    }));

    const completed = habitList.filter(hb => hb.completed).length;
    const remaining = total - completed;

    // Use the fresh h/l override values directly via getCurrentStreak,
    // NOT the local getStreakData() wrapper - that wrapper closes over the
    // component's habits/logs React state, which has not yet committed at
    // this point (refreshWidget is called synchronously right after
    // setHabits/setLogs, before React re-renders). Using the stale closure
    // here caused the streak number to disagree with the heatmap/completion
    // count, which are computed from the fresh override values below.
    let streak = 0;
    scheduled.forEach(hb => {
      const current = getCurrentStreak(hb, l);
      if (current > streak) streak = current;
    });

    const heatmapWeeks = 10;
    const heatmapDays = heatmapWeeks * 7;
    const historyStart = addDays(today, -(heatmapDays - 1));
    const history: { date: string; pct: number; hasData: boolean }[] = [];
    for (let i = 0; i < heatmapDays; i++) {
      const ds = addDays(historyStart, i);
      const scheduledForDay = h.filter(hb => !hb.archived && isHabitScheduledForDate(hb, ds));
      const totalForDay = scheduledForDay.length;
      const completedForDay = scheduledForDay.filter(hb =>
        l.some(log => log.habitId === hb.id && log.date === ds && (log.status === 'completed' || log.status === 'frozen'))
      ).length;
      history.push({
        date: ds,
        pct: totalForDay > 0 ? completedForDay / totalForDay : 0,
        hasData: totalForDay > 0,
      });
    }

    // Write the snapshot to native DataStore, consumed by the Glance
    // widgets. Fire-and-forget with a caught rejection: a failed snapshot
    // write should never break the React Native app.
    try {
      const snapshot = {
        version: 1,
        updatedAt: new Date().toISOString(),
        today,
        completed,
        total,
        remaining,
        streak,
        habits: habitList,
        heatmap: history,
      };
      if (NativeModules.WidgetSnapshotModule?.writeSnapshot) {
        NativeModules.WidgetSnapshotModule.writeSnapshot(JSON.stringify(snapshot)).catch(
          (e: unknown) => console.warn('widget snapshot write failed:', e)
        );
      }
    } catch (e) {
      console.warn('widget snapshot serialization failed:', e);
    }

  } catch (e) {
    console.warn('refreshWidget failed:', e);
  }

  }

  function setHabitsAndSave(h: Habit[]) {
    setHabits(h);
    save(KEYS.HABITS, h);
    refreshWidget(h, logs);
  }
  function setCatsAndSave(c: Category[]) { setCategories(c); save(KEYS.CATEGORIES, c); }
  function setLogsAndSave(l: HabitLog[]) {
    setLogs(l);
    save(KEYS.LOGS, l);
    refreshWidget(habits, l);
  }
  function setSettingsAndSave(s: AppSettings) { setSettings(s); save(KEYS.SETTINGS, s); }
  function setFreezesAndSave(f: StreakFreeze[]) { setFreezes(f); save(KEYS.FREEZES, f); }

  function createHabit(data: Omit<Habit, 'id' | 'createdAt' | 'archived' | 'sortOrder'>) {
    const h: Habit = {
      ...data,
      id: generateId(),
      createdAt: getTodayStr(),
      archived: false,
      sortOrder: habits.length,
    };
    setHabitsAndSave([...habits, h]);
  }

  function updateHabit(id: string, updates: Partial<Habit>) {
    setHabitsAndSave(habits.map(h => h.id === id ? { ...h, ...updates } : h));
  }

  function deleteHabit(id: string) {
    const newHabits = habits.filter(h => h.id !== id);
    const newLogs = logs.filter(l => l.habitId !== id);

    setHabits(newHabits);
    setLogs(newLogs);
    setFreezesAndSave(freezes.filter(f => f.habitId !== id));

    save(KEYS.HABITS, newHabits);
    save(KEYS.LOGS, newLogs);

    refreshWidget(newHabits, newLogs);
  }

  function archiveHabit(id: string) { updateHabit(id, { archived: true }); }
  function restoreHabit(id: string) { updateHabit(id, { archived: false }); }

  function createCategory(data: Omit<Category, 'id' | 'order' | 'collapsed'>) {
    const c: Category = { ...data, id: generateId(), order: categories.length, collapsed: false };
    setCatsAndSave([...categories, c]);
  }

  function updateCategory(id: string, updates: Partial<Category>) {
    setCatsAndSave(categories.map(c => c.id === id ? { ...c, ...updates } : c));
  }

  function deleteCategory(id: string) {
    setCatsAndSave(categories.filter(c => c.id !== id));
    setHabitsAndSave(habits.map(h => h.categoryId === id ? { ...h, categoryId: '' } : h));
  }

  function reorderCategories(orderedIds: string[]) {
    const reordered = orderedIds
      .map((id, index) => { const cat = categories.find(c => c.id === id); return cat ? { ...cat, order: index } : null; })
      .filter((c): c is Category => c !== null);
    setCatsAndSave(reordered);
  }

  function toggleCategoryCollapsed(id: string) {
    setCatsAndSave(categories.map(c => c.id === id ? { ...c, collapsed: !c.collapsed } : c));
  }

  function markHabit(habitId: string, date: string) {
    const today = getTodayStr();
    if (date !== today) return;
    let newLogs: HabitLog[];
    const existing = logs.find(
      l => l.habitId === habitId && l.date === date
    );
    if (existing?.status === 'completed') {
      newLogs = logs.filter(
        l => !(l.habitId === habitId && l.date === date)
      );
    } else {
      newLogs = [
        ...logs,
        {
          id: generateId(),
          habitId,
          date,
          status: 'completed',
          completedAt: new Date().toISOString(),
        },
      ];
    }
    setLogsAndSave(newLogs);
    if (settings.monkModeEnabled) {
      const scheduled = habits.filter(
        h => !h.archived && isHabitScheduledForDate(h, today)
      );
      const habitData = scheduled.map(h => ({
        id: h.id,
        name: h.name,
        completed: newLogs.some(
          l =>
            l.habitId === h.id &&
            l.date === today &&
            (l.status === 'completed' || l.status === 'frozen')
        ),
      }));
      syncMonkModeSession(habitData).catch(() => {});
    }
  }

  function canUseStreakFreeze(): boolean {
    const month = getMonthStr(getTodayStr());
    return !freezes.some(f => f.month === month);
  }

  function applyStreakFreeze(): boolean {
    if (!canUseStreakFreeze()) return false;
    const month = getMonthStr(getTodayStr());
    const today = getTodayStr();
    const habitsToday = habits.filter(h => !h.archived && isHabitScheduledForDate(h, today));
    const newLogs = [...logs];
    habitsToday.forEach(h => {
      const existing = newLogs.find(l => l.habitId === h.id && l.date === today);
      if (!existing) {
        newLogs.push({ id: generateId(), habitId: h.id, date: today, status: 'frozen' });
      }
    });
    setLogsAndSave(newLogs);
    const newFreezes: StreakFreeze[] = [...freezes, { habitId: 'global', month, usedDate: today }];
    setFreezesAndSave(newFreezes);
    return true;
  }

  function updateSettings(updates: Partial<AppSettings>) {
    const ns = { ...settings, ...updates };
    setSettingsAndSave(ns);
    if (updates.monkModeEnabled === true) {
      const today = getTodayStr();
      const scheduled = habits.filter(
        h => !h.archived && isHabitScheduledForDate(h, today)
      );
      const habitData = scheduled.map(h => ({
        id: h.id,
        name: h.name,
        completed: logs.some(
          l =>
            l.habitId === h.id &&
            l.date === today &&
            (l.status === 'completed' || l.status === 'frozen')
        ),
      }));
      startMonkModeSession(habitData).catch(() => {});
    }
    if (updates.monkModeEnabled === false) {
      stopMonkModeSession().catch(() => {});
    }
  }

  async function resetAllData(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(KEYS.HABITS),
      AsyncStorage.removeItem(KEYS.CATEGORIES),
      AsyncStorage.removeItem(KEYS.LOGS),
      AsyncStorage.removeItem(KEYS.SETTINGS),
      AsyncStorage.removeItem(KEYS.FREEZES),
    ]);
    setHabits([]);
    setCategories(DEFAULT_CATEGORIES);
    setLogs([]);
    setSettings(DEFAULT_SETTINGS);
    setFreezes([]);
    save(KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    // Bug fix: this previously referenced loadedHabits/newLogs, which don't
    // exist in this function's scope at all (they belong to the cold-start
    // useEffect elsewhere in this file) - that would throw a ReferenceError
    // every time resetAllData() ran, crashing before the widget ever
    // refreshed. Pass the actual freshly-reset empty arrays instead.
  }

  function getHabitsForDate(date: string): Habit[] {
    console.log("========== getHabitsForDate ==========");
    console.log("Date:", date);
    console.log("Habits count:", habits.length);

    habits.forEach(h => {
      const scheduled = isHabitScheduledForDate(h, date);
      console.log({
        id: h.id,
        name: h.name,
        frequency: h.frequency,
        createdAt: h.createdAt,
        archived: h.archived,
        scheduled,
        habit: h,
      });
    });

    const filtered = habits.filter(
      h => !h.archived && isHabitScheduledForDate(h, date)
    );

    console.log("Today's habits:", filtered.length);
    console.log(filtered);
    console.log("======================================");

    return filtered;
  }

  function getLogForHabit(habitId: string, date: string): HabitLog | undefined {
    return logs.find(l => l.habitId === habitId && l.date === date);
  }

  function getDailyScore(date: string): DailyScore {
    const scheduled = getHabitsForDate(date);
    if (scheduled.length === 0) return { completed: 0, total: 0, percentage: 0, missed: 0 };
    const completed = scheduled.filter(h => getLogForHabit(h.id, date)?.status === 'completed').length;
    const missed = scheduled.filter(h => {
      const log = getLogForHabit(h.id, date);
      return log?.status === 'missed' || (date < getTodayStr() && !log);
    }).length;
    return { completed, total: scheduled.length, percentage: Math.round((completed / scheduled.length) * 100), missed };
  }

  function getDailyStats(date: string): DailyStats {
    const score = getDailyScore(date);
    const today = getTodayStr();
    return {
      date,
      total: score.total,
      completed: score.completed,
      missed: score.missed,
      completionPercent: score.percentage,
      dailyScore: score.total > 0 ? Math.round((score.completed / score.total) * 100) : 0,
      isLocked: date < today,
    };
  }

  function getStreakData(habitId: string): { current: number; longest: number } {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return { current: 0, longest: 0 };
    return { current: getCurrentStreak(habit, logs), longest: getLongestStreak(habit, logs) };
  }

  function getWeeklyTargetProgress(habitId: string, weekStart: string): { completed: number; target: number } {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || habit.frequency !== 'weekly_target') return { completed: 0, target: 0 };
    let completed = 0;
    const ws = parseDate(weekStart);
    for (let i = 0; i < 7; i++) {
      const d = new Date(ws);
      d.setDate(d.getDate() + i);
      const ds = formatDate(d);
      if (getLogForHabit(habitId, ds)?.status === 'completed') completed++;
    }
    return { completed, target: habit.weeklyTarget };
  }

  function getCalendarDay(date: string) {
    const today = getTodayStr();
    if (date > today) return { color: 'none' as const, completed: 0, total: 0, missed: 0, percentage: 0, streak: 0 };
    const scheduled = getHabitsForDate(date);
    if (scheduled.length === 0) return { color: 'none' as const, completed: 0, total: 0, missed: 0, percentage: 0, streak: 0 };
    const completed = scheduled.filter(h => {
      const log = getLogForHabit(h.id, date);
      return log?.status === 'completed' || log?.status === 'frozen';
    }).length;
    const missed = scheduled.length - completed;
    const percentage = Math.round((completed / scheduled.length) * 100);
    const color = completed === 0 ? 'red' as const : completed < scheduled.length ? 'yellow' as const : 'green' as const;
    const streak = scheduled.reduce((max, h) => Math.max(max, getCurrentStreak(h, logs)), 0);
    return { color, completed, total: scheduled.length, missed, percentage, streak };
  }

  function getLifetimeStats(): LifetimeStats {
    const activeHabits = habits.filter(h => !h.archived);
    const allScheduledLogs = logs.filter(l => l.status !== 'missed');
    const totalCompleted = logs.filter(l => l.status === 'completed').length;
    const totalMissed = logs.filter(l => l.status === 'missed').length;
    const totalScheduled = totalCompleted + totalMissed + logs.filter(l => l.status === 'frozen').length;
    const longestEverStreak = activeHabits.reduce((max, h) => Math.max(max, getLongestStreak(h, logs)), 0);
    const currentBestStreak = activeHabits.reduce((max, h) => Math.max(max, getCurrentStreak(h, logs)), 0);
    const activeDays = new Set(allScheduledLogs.map(l => l.date)).size;
    return {
      totalCompleted,
      totalMissed,
      totalScheduled,
      overallCompletion: totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0,
      longestEverStreak,
      currentBestStreak,
      activeDays,
      habitsCreated: habits.length,
    };
  }

  function getWeeklyStats(weekStart: string): WeeklyStats {
    const weekEnd = addDays(weekStart, 6);
    const activeHabits = habits.filter(h => !h.archived);
    let totalScheduled = 0, completed = 0, missed = 0;
    const habitCompletions: Record<string, number> = {};
    const habitScheduled: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      activeHabits.forEach(h => {
        if (isHabitScheduledForDate(h, date)) {
          totalScheduled++;
          habitScheduled[h.id] = (habitScheduled[h.id] || 0) + 1;
          const log = getLogForHabit(h.id, date);
          if (log?.status === 'completed') { completed++; habitCompletions[h.id] = (habitCompletions[h.id] || 0) + 1; }
          else if (log?.status === 'missed') missed++;
        }
      });
    }
    const sortedByCompletion = Object.keys(habitCompletions).sort((a, b) => {
      const rateA = (habitCompletions[a] || 0) / (habitScheduled[a] || 1);
      const rateB = (habitCompletions[b] || 0) / (habitScheduled[b] || 1);
      return rateB - rateA;
    });
    const longestStreak = activeHabits.reduce((max, h) => Math.max(max, getLongestStreak(h, logs)), 0);
    return {
      weekStart,
      weekEnd,
      totalScheduled,
      completed,
      missed,
      completionPercent: totalScheduled > 0 ? Math.round((completed / totalScheduled) * 100) : 0,
      bestHabitId: sortedByCompletion[0] || '',
      worstHabitId: sortedByCompletion[sortedByCompletion.length - 1] || '',
      longestStreak,
      averageCompletion: activeHabits.length > 0
        ? Math.round(Object.values(habitCompletions).reduce((s, v) => s + v, 0) / activeHabits.length)
        : 0,
    };
  }

  function getMonthlyStats(month: string): MonthlyStats {
    const [year, monthNum] = month.split('-').map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const activeHabits = habits.filter(h => !h.archived);
    let totalScheduled = 0, completed = 0, missed = 0;
    const habitCompletions: Record<string, number> = {};
    const habitScheduled: Record<string, number> = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${month}-${String(day).padStart(2, '0')}`;
      activeHabits.forEach(h => {
        if (isHabitScheduledForDate(h, date)) {
          totalScheduled++;
          habitScheduled[h.id] = (habitScheduled[h.id] || 0) + 1;
          const log = getLogForHabit(h.id, date);
          if (log?.status === 'completed') { completed++; habitCompletions[h.id] = (habitCompletions[h.id] || 0) + 1; }
          else if (log?.status === 'missed') missed++;
        }
      });
    }
    const sortedByRate = Object.keys(habitScheduled).sort((a, b) => {
      const rateA = (habitCompletions[a] || 0) / (habitScheduled[a] || 1);
      const rateB = (habitCompletions[b] || 0) / (habitScheduled[b] || 1);
      return rateB - rateA;
    });
    return {
      month,
      totalScheduled,
      completed,
      missed,
      completionPercent: totalScheduled > 0 ? Math.round((completed / totalScheduled) * 100) : 0,
      mostConsistentHabitId: sortedByRate[0] || '',
      leastConsistentHabitId: sortedByRate[sortedByRate.length - 1] || '',
    };
  }

  function getWeeklyReview(): WeeklyStats & { summary: string } {
    const today = new Date();
    const lastSunday = new Date(today);
    lastSunday.setDate(today.getDate() - today.getDay() - 7);
    const weekStart = formatDate(lastSunday);
    const stats = getWeeklyStats(weekStart);
    const { completionPercent } = stats;
    let summary = '';
    if (completionPercent >= 90) summary = 'Outstanding week! You showed up when it mattered.';
    else if (completionPercent >= 70) summary = 'Solid effort this week. Keep the momentum.';
    else if (completionPercent >= 50) summary = 'You made progress. Next week, push harder.';
    else summary = 'Rough week. Reset and recommit. Tomorrow starts now.';
    return { ...stats, summary };
  }

  function getLast7DaysData() {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(getTodayStr(), i - 6);
      const score = getDailyScore(date);
      const d = parseDate(date);
      return {
        date,
        label: WEEKDAY_SHORT[d.getDay()],
        percentage: score.percentage,
        completed: score.completed,
        total: score.total,
      };
    });
  }

  function getHabitCompletionHistory(habitId: string, days: number) {
    const today = getTodayStr();
    return Array.from({ length: days }, (_, i) => {
      const date = addDays(today, i - days + 1);
      const log = getLogForHabit(habitId, date);
      return { date, completed: log?.status === 'completed' || log?.status === 'frozen' };
    });
  }

  function getOverallConsistency() {
    const today = getTodayStr();
    return Array.from({ length: 90 }, (_, i) => {
      const date = addDays(today, i - 89);
      const { color } = getCalendarDay(date);
      return { date, color };
    });
  }

  function searchHabits(query: string): Habit[] {
    if (!query.trim()) return habits.filter(h => !h.archived);
    const q = query.toLowerCase();
    return habits.filter(h =>
      !h.archived && (
        h.name.toLowerCase().includes(q) ||
        h.description?.toLowerCase().includes(q) ||
        h.notes?.toLowerCase().includes(q)
      ),
    );
  }

  return (
    <HabitsContext.Provider value={{
      habits, categories, logs, freezes, settings, isLoading,
      createHabit, updateHabit, deleteHabit, archiveHabit, restoreHabit,
      createCategory, updateCategory, deleteCategory, reorderCategories, toggleCategoryCollapsed,
      markHabit, applyStreakFreeze, updateSettings, resetAllData,
      getHabitsForDate, getLogForHabit, getDailyScore, getDailyStats,
      getStreakData, getWeeklyTargetProgress, getCalendarDay, canUseStreakFreeze,
      getLifetimeStats, getWeeklyStats, getMonthlyStats, getWeeklyReview,
      getLast7DaysData, getHabitCompletionHistory, getOverallConsistency, searchHabits,
    }}>
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabits(): HabitsContextType {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error('useHabits must be used within HabitsProvider');
  return ctx;
}
