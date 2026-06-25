import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Habit } from '@/context/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleHabitReminder(habit: Habit): Promise<void> {
  if (!habit.reminderTimes || habit.reminderTimes.length === 0) return;
  await cancelHabitReminders(habit.id);
  for (const timeStr of habit.reminderTimes) {
    const [hourStr, minuteStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (isNaN(hour) || isNaN(minute)) continue;
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `habit_${habit.id}_${hour}_${minute}`,
        content: {
          title: `${habit.emoji} ${habit.name}`,
          body: habit.description || 'Time to forge your habit!',
          data: { habitId: habit.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    } catch {}
  }
}

export async function cancelHabitReminders(habitId: string): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = scheduled.filter(n => n.identifier.startsWith(`habit_${habitId}_`));
    await Promise.all(toCancel.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  } catch {}
}

export async function scheduleMonkModeNotification(remaining: number): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      identifier: 'monk_mode',
      content: {
        title: '🔥 Monk Mode Active',
        body: remaining > 0 ? `${remaining} habit${remaining > 1 ? 's' : ''} remaining today. Stay focused.` : 'All habits complete! Outstanding discipline.',
        sticky: Platform.OS === 'android',
        data: { type: 'monk_mode' },
      },
      trigger: null,
    });
  } catch {}
}

export async function cancelMonkModeNotification(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync('monk_mode');
    await Notifications.dismissNotificationAsync('monk_mode');
  } catch {}
}

export async function scheduleMidnightReset(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync('midnight_reset');
    await Notifications.scheduleNotificationAsync({
      identifier: 'midnight_reset',
      content: {
        title: '🌅 New Day, New Discipline',
        body: 'Your habits have reset. Start strong.',
        data: { type: 'reset' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 0,
        minute: 0,
      },
    });
  } catch {}
}

export async function cancelAllHabitReminders(habits: Habit[]): Promise<void> {
  await Promise.all(habits.map(h => cancelHabitReminders(h.id)));
}

export async function rescheduleAllHabitReminders(habits: Habit[]): Promise<void> {
  for (const habit of habits) {
    if (!habit.archived && habit.reminderTimes?.length > 0) {
      await scheduleHabitReminder(habit);
    }
  }
}
