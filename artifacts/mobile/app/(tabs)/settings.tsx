import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
  Switch, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useHabits } from '@/context/HabitsContext';
import { getTodayStr, getMonthStr } from '@/utils/scheduling';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function RowItem({ label, right, onPress, destructive }: { label: string; right?: React.ReactNode; onPress?: () => void; destructive?: boolean }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.row}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.rowLabel, { color: destructive ? colors.destructive : colors.foreground }]}>{label}</Text>
      {right}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, canUseStreakFreeze, habits, logs } = useHabits();
  const [name, setName] = useState(settings.userName);

  const topInset = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomInset = Platform.OS === 'web' ? 34 : 0;
  const monthStr = getMonthStr(getTodayStr());
  const freezeAvailable = canUseStreakFreeze();

  function handleNameBlur() {
    if (name !== settings.userName) {
      updateSettings({ userName: name });
    }
  }

  function handleMonkMode(val: boolean) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateSettings({ monkModeEnabled: val });
  }

  function handleResetAllData() {
    Alert.alert(
      'Reset All Data?',
      'This will permanently delete all habits, logs, streaks, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: () => {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            AsyncStorage.multiRemove(['@fg:habits', '@fg:categories', '@fg:logs', '@fg:settings'])
              .then(() => Alert.alert('Done', 'All data has been reset. Please restart the app.'));
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topInset + 16, paddingBottom: 120 + bottomInset },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>

        {/* Profile */}
        <Section title="PROFILE">
          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Your Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              onBlur={handleNameBlur}
              placeholder="Enter your name"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              returnKeyType="done"
              onSubmitEditing={handleNameBlur}
            />
          </View>
        </Section>

        {/* Monk Mode */}
        <Section title="MONK MODE">
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>🔥 Monk Mode</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                Maximum accountability. No excuses.
              </Text>
            </View>
            <Switch
              value={settings.monkModeEnabled}
              onValueChange={handleMonkMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          {settings.monkModeEnabled && (
            <View style={[styles.monkActiveBanner, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
              <Text style={[styles.monkActiveText, { color: colors.primary }]}>
                Active — complete all tasks daily.
              </Text>
            </View>
          )}
        </Section>

        {/* Streak Freeze */}
        <Section title="STREAK FREEZE">
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>❄️ Monthly Freeze</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                1 freeze per month to protect streaks
              </Text>
            </View>
            <View style={[
              styles.badge,
              { backgroundColor: freezeAvailable ? '#60A5FA22' : colors.border },
            ]}>
              <Text style={[styles.badgeText, { color: freezeAvailable ? '#60A5FA' : colors.mutedForeground }]}>
                {freezeAvailable ? '1 left' : 'used'}
              </Text>
            </View>
          </View>
        </Section>

        {/* Stats Summary */}
        <Section title="OVERVIEW">
          <RowItem
            label={`Total Habits`}
            right={<Text style={[styles.rowValue, { color: colors.primary }]}>{habits.filter(h => !h.archived).length}</Text>}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <RowItem
            label={`Total Completions`}
            right={<Text style={[styles.rowValue, { color: colors.primary }]}>{logs.filter(l => l.status === 'completed').length}</Text>}
          />
        </Section>

        {/* Privacy */}
        <Section title="PRIVACY">
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>100% Local</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                No accounts, no servers, no tracking. Your data stays on this device.
              </Text>
            </View>
            <Feather name="shield" size={18} color={colors.success} />
          </View>
        </Section>

        {/* About */}
        <Section title="ABOUT">
          <RowItem label="ForgeHabits" right={<Text style={[styles.rowValue, { color: colors.mutedForeground }]}>v1.0.0</Text>} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <RowItem
            label="Reset All Data"
            destructive
            onPress={handleResetAllData}
          />
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.8, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.2, marginBottom: 8, marginLeft: 4 },
  sectionCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  rowSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2, lineHeight: 16 },
  rowValue: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1, marginHorizontal: 16 },
  inputRow: { paddingHorizontal: 16, paddingVertical: 14 },
  inputLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 8, letterSpacing: 0.3 },
  input: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    borderBottomWidth: 1,
    paddingBottom: 8,
    paddingTop: 0,
  },
  monkActiveBanner: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  monkActiveText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
