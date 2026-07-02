import { widget } from 'react-native-android-widget';

export interface WidgetData {
  totalHabits: number;
  completedHabits: number;
  habits: Array<{ id: string; name: string; completed: boolean }>;
  streak: number;
}

export const WIDGET_CLASS = 'com.forgehabits.app.widget.ForgeHabitsWidget';

export const WIDGET_IDS = {
  PROGRESS: 1,
  TASKS: 2,
  PROGRESS_TASKS: 3,
} as const;
