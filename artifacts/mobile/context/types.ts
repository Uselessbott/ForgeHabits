export type LogStatus = 'completed' | 'missed' | 'frozen';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  notes?: string;
  emoji?: string;
  categoryId: string;
  createdAt: string;
  archived: boolean;
  sortOrder: number;
  frequency: 'daily' | 'weekly' | 'weekly_target' | 'specific_days';
  weeklyTarget?: number;
  scheduleDays?: number[];
  reminderTime?: string;
  color?: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  order: number;
  collapsed: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  status: LogStatus;
  completedAt?: string;
}

export interface AppSettings {
  userName: string;
  monkModeEnabled: boolean;
  notificationsEnabled: boolean;
  lastResetDate: string;
  lastWeeklyReviewDate: string;
  theme: 'dark' | 'light';
}

export interface DailyScore {
  completed: number;
  total: number;
  percentage: number;
  missed: number;
}
export interface DailyStats {
  date: string;
  total: number;
  completed: number;
  missed: number;
  completionPercent: number;
  dailyScore: number;
  isLocked: boolean;
}

export interface LifetimeStats {
  totalCompleted: number;
  totalMissed: number;
  totalScheduled: number;
  overallCompletion: number;
  longestEverStreak: number;
  currentBestStreak: number;
  activeDays: number;
  habitsCreated: number;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  totalScheduled: number;
  completed: number;
  missed: number;
  completionPercent: number;
  bestHabitId: string;
  worstHabitId: string;
  longestStreak: number;
  averageCompletion: number;
}

export interface MonthlyStats {
  month: string;
  totalScheduled: number;
  completed: number;
  missed: number;
  completionPercent: number;
  mostConsistentHabitId: string;
  leastConsistentHabitId: string;
}

export interface StreakFreeze {
  habitId: string;
  month: string;
  usedDate: string;
}
export interface WidgetCache {
  progress: number;
  streak: number;
  completed: number;
  remaining: number;
  tasks: Array<{
    emoji: string;
    name: string;
    completed: boolean;
  }>;
}
