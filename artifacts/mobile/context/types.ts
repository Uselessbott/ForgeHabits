export type HabitFrequency = 'daily' | 'weekly' | 'weekly_target' | 'monthly';
export type RepetitionType = 'forever' | 'days' | 'weeks' | 'months' | 'until';
export type LogStatus = 'completed' | 'frozen';

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
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  status: LogStatus;
}

export interface AppSettings {
  userName: string;
  monkModeEnabled: boolean;
  streakFreezeUsedMonths: string[];
}

export interface DailyScore {
  completed: number;
  total: number;
  percentage: number;
}
