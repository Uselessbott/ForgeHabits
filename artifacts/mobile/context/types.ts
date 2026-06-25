export type HabitFrequency = 'daily' | 'weekly' | 'weekly_target' | 'monthly';
export type RepetitionType = 'forever' | 'days' | 'weeks' | 'months' | 'until';
export type LogStatus = 'completed' | 'frozen' | 'missed';
export type FilterType = 'all' | 'daily' | 'weekly' | 'weekly_target' | 'monthly' | 'archived' | 'completed' | 'missed';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  order: number;
  collapsed: boolean;
}

export interface HabitRepetition {
  type: RepetitionType;
  count: number;
  endDate: string;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  description: string;
  categoryId: string;
  frequency: HabitFrequency;
  weekdays: number[];
  weeklyTarget: number;
  monthlyDates: number[];
  reminderTimes: string[];
  notes: string;
  repetition: HabitRepetition;
  createdAt: string;
  archived: boolean;
  sortOrder: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  status: LogStatus;
  completedAt?: string;
}

export interface StreakFreeze {
  habitId: string;
  month: string;
  usedDate?: string;
}

export interface AppSettings {
  userName: string;
  monkModeEnabled: boolean;
  notificationsEnabled: boolean;
  lastResetDate: string;
  lastWeeklyReviewDate: string;
  theme: 'dark';
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
