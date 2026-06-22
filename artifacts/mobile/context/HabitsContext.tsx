import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Habit, Category, HabitLog, AppSettings, DailyScore, LogStatus,
} from './types';
import {
  formatDate, parseDate, getTodayStr, isHabitScheduledForDate,
  getWeekStart, generateId,
} from '@/utils/scheduling';
import { getCurrentStreak, getLongestStreak } from '@/utils/streaks';

const KEYS = {
  HABITS: '@fg:habits',
  CATEGORIES: '@fg:categories',
  LOGS: '@fg:logs',
  SETTINGS: '@fg:settings',
};

const DEFAULT_SETTINGS: AppSettings = {
  userName: '',
  monkModeEnabled: false,
  streakFreezeUsedMonths: [],
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
  settings: AppSettings;
  isLoading: boolean;
  createHabit: (data: Omit<Habit, 'id' | 'createdAt' | 'archived'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  archiveHabit: (id: string) => void;
  createCategory: (data: Omit<Category, 'id' | 'order' | 'collapsed'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (orderedIds: string[]) => void;
  toggleCategoryCollapsed: (id: string) => void;
  markHabit: (habitId: string, date: string) => void;
  applyStreakFreeze: () => boolean;
  updateSettings: (updates: Partial<AppSettings>) => void;
  getHabitsForDate: (date: string) => Habit[];
  getLogForHabit: (habitId: string, date: string) => HabitLog | undefined;
  getDailyScore: (date: string) => DailyScore;
  getStreakData: (habitId: string) => { current: number; longest: number };
  getWeeklyTargetProgress: (habitId: string, weekStart: string) => { completed: number; target: number };
  getCalendarDay: (date: string) => { color: 'none' | 'red' | 'yellow' | 'green'; completed: number; total: number };
  canUseStreakFreeze: () => boolean;
}

const HabitsContext = createContext<HabitsContextType | null>(null);

function save(key: string, data: unknown) {
  AsyncStorage.setItem(key, JSON.stringify(data)).catch(() => {});
}

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [h, c, l, s] = await Promise.all([
          AsyncStorage.getItem(KEYS.HABITS),
          AsyncStorage.getItem(KEYS.CATEGORIES),
          AsyncStorage.getItem(KEYS.LOGS),
          AsyncStorage.getItem(KEYS.SETTINGS),
        ]);
        if (h) setHabits(JSON.parse(h));
        if (c) {
          setCategories(JSON.parse(c));
        } else {
          setCategories(DEFAULT_CATEGORIES);
          save(KEYS.CATEGORIES, DEFAULT_CATEGORIES);
        }
        if (l) setLogs(JSON.parse(l));
        if (s) setSettings(JSON.parse(s));
      } catch {}
      setIsLoading(false);
    })();
  }, []);

  function setHabitsAndSave(h: Habit[]) {
    setHabits(h);
    save(KEYS.HABITS, h);
  }
  function setCatsAndSave(c: Category[]) {
    setCategories(c);
    save(KEYS.CATEGORIES, c);
  }
  function setLogsAndSave(l: HabitLog[]) {
    setLogs(l);
    save(KEYS.LOGS, l);
  }
  function setSettingsAndSave(s: AppSettings) {
    setSettings(s);
    save(KEYS.SETTINGS, s);
  }

  function createHabit(data: Omit<Habit, 'id' | 'createdAt' | 'archived'>) {
    const h: Habit = { ...data, id: generateId(), createdAt: getTodayStr(), archived: false };
    setHabitsAndSave([...habits, h]);
  }

  function updateHabit(id: string, updates: Partial<Habit>) {
    setHabitsAndSave(habits.map(h => h.id === id ? { ...h, ...updates } : h));
  }

  function deleteHabit(id: string) {
    setHabitsAndSave(habits.filter(h => h.id !== id));
    setLogsAndSave(logs.filter(l => l.habitId !== id));
  }

  function archiveHabit(id: string) {
    updateHabit(id, { archived: true });
  }

  function createCategory(data: Omit<Category, 'id' | 'order' | 'collapsed'>) {
    const c: Category = { ...data, id: generateId(), order: categories.length, collapsed: false };
    setCatsAndSave([...categories, c]);
  }

  function updateCategory(id: string, updates: Partial<Category>) {
    setCatsAndSave(categories.map(c => c.id === id ? { ...c, ...updates } : c));
  }

  function deleteCategory(id: string) {
    setCatsAndSave(categories.filter(c => c.id !== id));
    setHabitsAndSave(habits.filter(h => h.categoryId !== id));
  }

  function reorderCategories(orderedIds: string[]) {
    const reordered = orderedIds
      .map((id, index) => {
        const cat = categories.find(c => c.id === id);
        return cat ? { ...cat, order: index } : null;
      })
      .filter((c): c is Category => c !== null);
    setCatsAndSave(reordered);
  }

  function toggleCategoryCollapsed(id: string) {
    setCatsAndSave(categories.map(c => c.id === id ? { ...c, collapsed: !c.collapsed } : c));
  }

  function markHabit(habitId: string, date: string) {
    const existing = logs.find(l => l.habitId === habitId && l.date === date);
    if (existing) {
      if (existing.status === 'completed') {
        setLogsAndSave(logs.filter(l => !(l.habitId === habitId && l.date === date)));
      }
    } else {
      const newLog: HabitLog = { id: generateId(), habitId, date, status: 'completed' };
      setLogsAndSave([...logs, newLog]);
    }
  }

  function canUseStreakFreeze(): boolean {
    const month = getTodayStr().substring(0, 7);
    return !settings.streakFreezeUsedMonths.includes(month);
  }

  function applyStreakFreeze(): boolean {
    if (!canUseStreakFreeze()) return false;
    const month = getTodayStr().substring(0, 7);
    const today = getTodayStr();

    const habitsToday = habits.filter(h => !h.archived && isHabitScheduledForDate(h, today));
    const newLogs = [...logs];
    habitsToday.forEach(h => {
      const existing = logs.find(l => l.habitId === h.id && l.date === today);
      if (!existing) {
        newLogs.push({ id: generateId(), habitId: h.id, date: today, status: 'frozen' });
      }
    });

    setLogsAndSave(newLogs);
    const ns: AppSettings = { ...settings, streakFreezeUsedMonths: [...settings.streakFreezeUsedMonths, month] };
    setSettingsAndSave(ns);
    return true;
  }

  function updateSettings(updates: Partial<AppSettings>) {
    const ns = { ...settings, ...updates };
    setSettingsAndSave(ns);
  }

  function getHabitsForDate(date: string): Habit[] {
    return habits.filter(h => !h.archived && isHabitScheduledForDate(h, date));
  }

  function getLogForHabit(habitId: string, date: string): HabitLog | undefined {
    return logs.find(l => l.habitId === habitId && l.date === date);
  }

  function getDailyScore(date: string): DailyScore {
    const scheduled = getHabitsForDate(date);
    if (scheduled.length === 0) return { completed: 0, total: 0, percentage: 0 };
    const completed = scheduled.filter(h => {
      const log = getLogForHabit(h.id, date);
      return log?.status === 'completed';
    }).length;
    return { completed, total: scheduled.length, percentage: Math.round((completed / scheduled.length) * 100) };
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
      const log = getLogForHabit(habitId, ds);
      if (log?.status === 'completed') completed++;
    }
    return { completed, target: habit.weeklyTarget };
  }

  function getCalendarDay(date: string): { color: 'none' | 'red' | 'yellow' | 'green'; completed: number; total: number } {
    const today = getTodayStr();
    if (date > today) return { color: 'none', completed: 0, total: 0 };
    const scheduled = getHabitsForDate(date);
    if (scheduled.length === 0) return { color: 'none', completed: 0, total: 0 };
    const completed = scheduled.filter(h => {
      const log = getLogForHabit(h.id, date);
      return log?.status === 'completed' || log?.status === 'frozen';
    }).length;
    const color = completed === 0 ? 'red' : completed < scheduled.length ? 'yellow' : 'green';
    return { color, completed, total: scheduled.length };
  }

  return (
    <HabitsContext.Provider value={{
      habits, categories, logs, settings, isLoading,
      createHabit, updateHabit, deleteHabit, archiveHabit,
      createCategory, updateCategory, deleteCategory, reorderCategories, toggleCategoryCollapsed,
      markHabit, applyStreakFreeze, updateSettings,
      getHabitsForDate, getLogForHabit, getDailyScore, getStreakData,
      getWeeklyTargetProgress, getCalendarDay, canUseStreakFreeze,
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
