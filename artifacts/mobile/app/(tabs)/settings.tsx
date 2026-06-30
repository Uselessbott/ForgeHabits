import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
  Switch, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useHabits } from '@/context/HabitsContext';
import { requestNotificationPermissions, rescheduleAllHabitReminders, cancelAllHabitReminders, scheduleMidnightReset , scheduleMonkModeNotification, cancelMonkModeNotification } from '@/utils/notifications';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, habits, logs, getHabitsForDate, resetAllData, getLifetimeStats, canUseStreakFreeze } = useHabits();
  const [nameInput, setNameInput] = useState(settings.userName);
  const [nameSaved, setNameSaved] = useState(false);

  const stats = getLifetimeStats();
  const topInset = insets.top + (Platform.OS === 'web' ? 67 : 0);

  function saveName() {
    if (!nameInput.trim()) return;
    updateSettings({ userName: nameInput.trim() });
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 1500);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function toggleNotifications(val: boolean) {
    if (val) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert('Permission Required', 'Please enable notifications in your device settings.');
        return;
      }
      await rescheduleAllHabitReminders(habits);
      await scheduleMidnightReset();
    } else {
      await cancelAllHabitReminders(habits);
    }
    updateSettings({ notificationsEnabled: val });
  }

  function handleResetData() {
    Alert.alert(
      '⚠️ Reset All Data',
      'This permanently deletes all habits, streaks, statistics, calendar history, reminders, notes and settings.\n\nThis cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await resetAllData();
            setNameInput('');
          },
        },
      ],
    );
  }

  const sections: { icon: string; label: string; value: string }[] = [
    { icon: '✅', label: 'Total Completed', value: stats.totalCompleted.toString() },
    { icon: '❌', label: 'Total Missed', value: stats.totalMissed.toString() },
    { icon: '📊', label: 'Overall Completion', value: `${stats.overallCompletion}%` },
    { icon: '🔥', label: 'Longest Ever Streak', value: `${stats.longestEverStreak} days` },
    { icon: '⚡', label: 'Current Best Streak', value: `${stats.currentBestStreak} days` },
    { icon: '📅', label: 'Active Days', value: stats.activeDays.toString() },
    { icon: '💪', label: 'Habits Created', value: stats.habitsCreated.toString() },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 16, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>

        {/* Profile Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '22' }]}>
            <Text style={styles.avatarEmoji}>🔥</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>YOUR NAME</Text>
            <View style={styles.nameRow}>
              <TextInput
                style={[styles.nameInput, { color: colors.foreground, borderColor: colors.border }]}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Enter your name..."
                placeholderTextColor={colors.mutedForeground}
                returnKeyType="done"
                onSubmitEditing={saveName}
              />
              <TouchableOpacity
                onPress={saveName}
                style={[styles.saveBtn, { backgroundColor: nameSaved ? '#22c55e' : colors.primary }]}
                activeOpacity={0.8}
              >
                <Feather name={nameSaved ? 'check' : 'save'} size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            {settings.userName ? (
              <Text style={[styles.greetingPreview, { color: colors.mutedForeground }]}>
                Preview: "{settings.userName}, keep going."
              </Text>
            ) : null}
          </View>
        </View>

        {/* Lifetime Stats */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>LIFETIME STATISTICS</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 0 }]}>
          {sections.map((s, i) => (
            <View key={s.label} style={[styles.statRow, { borderBottomColor: colors.border, borderBottomWidth: i < sections.length - 1 ? 1 : 0 }]}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={[styles.statLabel, { color: colors.foreground }]}>{s.label}</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* Streak Freeze Status */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>STREAK FREEZE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.freezeRow}>
            <Text style={{ fontSize: 28 }}>❄️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>
                {canUseStreakFreeze() ? '1 freeze available this month' : 'Freeze used this month'}
              </Text>
              <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>
                Resets on the 1st of each month. Protects your entire day.
              </Text>
            </View>
            <View style={[styles.freezeBadge, { backgroundColor: canUseStreakFreeze() ? '#3B82F622' : colors.card }]}>
              <Text style={[{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: canUseStreakFreeze() ? '#60A5FA' : colors.mutedForeground }]}>
                {canUseStreakFreeze() ? 'Ready' : 'Used'}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>SETTINGS</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 0 }]}>
          <View style={[styles.settingRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Notifications</Text>
              <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Habit reminders and daily reset alerts</Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Monk Mode</Text>
              <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Maximum accountability. No distractions.</Text>
            </View>
            <Switch
              value={settings.monkModeEnabled}
              onValueChange={async (val) => {
                  updateSettings({ monkModeEnabled: val });

                  if (val) {
                    const today = getTodayStr();
                    const total = getHabitsForDate(today).length;
                    const completed = logs.filter(
                      l => l.date === today && l.status === "completed"
                    ).length;
                    const remaining = Math.max(0, total - completed);
                    await scheduleMonkModeNotification(remaining);
                  } else {
                    await cancelMonkModeNotification();
                  }

                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* App Info */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.aboutText, { color: colors.mutedForeground }]}>
            ForgeHabits is a local-first discipline app. No accounts, no cloud, no tracking. Everything lives on your device.
          </Text>
          <Text style={[styles.versionText, { color: colors.mutedForeground + '88' }]}>Version 1.0.0</Text>
        </View>

        {/* Reset */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>DANGER ZONE</Text>
        <TouchableOpacity
          onPress={handleResetData}
          style={[styles.resetBtn, { backgroundColor: '#ef444411', borderColor: '#ef444433' }]}
          activeOpacity={0.8}
        >
          <Feather name="trash-2" size={18} color="#ef4444" />
          <Text style={styles.resetBtnText}>Reset All Data</Text>
        </TouchableOpacity>
        <Text style={[styles.resetWarning, { color: colors.mutedForeground }]}>
          Permanently deletes all habits, streaks, statistics, calendar, reminders, notes and settings.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, marginBottom: 20 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20, overflow: 'hidden' },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarEmoji: { fontSize: 28 },
  cardLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.2, marginBottom: 8 },
  nameRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  nameInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, fontFamily: 'Inter_500Medium' },
  saveBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  greetingPreview: { fontSize: 12, fontFamily: 'Inter_400Regular', fontStyle: 'italic' },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.2, marginBottom: 10 },
  statRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  statIcon: { fontSize: 18 },
  statLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  statValue: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  settingLabel: { fontSize: 15, fontFamily: 'Inter_500Medium', marginBottom: 2 },
  settingDesc: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  freezeRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  freezeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  aboutText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22, marginBottom: 8 },
  versionText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, borderWidth: 1, paddingVertical: 16, marginBottom: 8 },
  resetBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#ef4444' },
  resetWarning: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 18 },
});
