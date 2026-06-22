import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useHabits } from '@/context/HabitsContext';
import { HabitCard } from '@/components/HabitCard';
import { ProgressRing } from '@/components/ProgressRing';
import { getTodayStr, getWeekStart } from '@/utils/scheduling';
import { getDailyQuote, getMotivationalGreeting } from '@/utils/motivations';

export default function TodayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    habits, categories, settings,
    getHabitsForDate, getLogForHabit, getDailyScore, getStreakData,
    getWeeklyTargetProgress, markHabit, applyStreakFreeze, canUseStreakFreeze,
    updateSettings,
  } = useHabits();

  const today = getTodayStr();
  const weekStart = getWeekStart(today);
  const score = getDailyScore(today);
  const todayHabits = getHabitsForDate(today);
  const quote = useMemo(() => getDailyQuote(), []);
  const remaining = score.total - score.completed;
  const greeting = getMotivationalGreeting(settings.userName, remaining, score.completed > 0 ? getStreakData(todayHabits[0]?.id ?? '').current : 0);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories],
  );

  function handleToggle(habitId: string) {
    markHabit(habitId, today);
  }

  function handleMonkMode() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    updateSettings({ monkModeEnabled: !settings.monkModeEnabled });
  }

  function handleStreakFreeze() {
    if (!canUseStreakFreeze()) {
      Alert.alert('No Freeze Available', 'You\'ve already used your streak freeze this month.');
      return;
    }
    Alert.alert(
      '❄️ Use Streak Freeze?',
      'This will protect all your streaks for today. You get 1 freeze per month.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use Freeze',
          onPress: () => {
            const ok = applyStreakFreeze();
            if (ok) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  }

  const topInset = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topInset + 16, paddingBottom: 120 + bottomInset },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.flame}>🔥</Text>
            <Text style={[styles.appName, { color: colors.foreground }]}>ForgeHabits</Text>
          </View>
          <TouchableOpacity
            onPress={handleMonkMode}
            style={[
              styles.monkBtn,
              {
                backgroundColor: settings.monkModeEnabled ? colors.primary : colors.card,
                borderColor: settings.monkModeEnabled ? colors.primary : colors.border,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[styles.monkBtnText, { color: settings.monkModeEnabled ? '#fff' : colors.mutedForeground }]}>
              {settings.monkModeEnabled ? '🔥 MONK' : 'Monk Mode'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Monk Mode Banner */}
        {settings.monkModeEnabled && (
          <View style={[styles.monkBanner, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
            <Text style={[styles.monkBannerText, { color: colors.primary }]}>
              🔥 MONK MODE ACTIVE — No distractions. Only discipline.
            </Text>
          </View>
        )}

        {/* Greeting */}
        <Text style={[styles.greeting, { color: colors.foreground }]}>{greeting}</Text>

        {/* Quote */}
        <View style={[styles.quoteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.quoteText, { color: colors.mutedForeground }]}>"{quote}"</Text>
        </View>

        {/* Progress Ring + Score */}
        <View style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ProgressRing
            progress={score.total > 0 ? score.completed / score.total : 0}
            size={100}
            strokeWidth={8}
            color={colors.primary}
            trackColor={colors.border}
          >
            <View style={styles.scoreInner}>
              <Text style={[styles.scorePct, { color: colors.foreground }]}>{score.percentage}%</Text>
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>done</Text>
            </View>
          </ProgressRing>

          <View style={styles.scoreDetails}>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreNum, { color: colors.success }]}>{score.completed}</Text>
              <Text style={[styles.scoreDesc, { color: colors.mutedForeground }]}>completed</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreNum, { color: colors.mutedForeground }]}>{score.total - score.completed}</Text>
              <Text style={[styles.scoreDesc, { color: colors.mutedForeground }]}>remaining</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreNum, { color: colors.foreground }]}>{score.total}</Text>
              <Text style={[styles.scoreDesc, { color: colors.mutedForeground }]}>total today</Text>
            </View>
          </View>
        </View>

        {/* Habits by Category */}
        {todayHabits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon, { color: colors.mutedForeground }]}>🌅</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nothing scheduled today</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Add habits in the Habits tab to get started.
            </Text>
          </View>
        ) : (
          sortedCategories.map(cat => {
            const catHabits = todayHabits.filter(h => h.categoryId === cat.id);
            if (catHabits.length === 0) return null;
            return (
              <View key={cat.id} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                  {cat.emoji} {cat.name.toUpperCase()}
                </Text>
                {catHabits.map(habit => {
                  const log = getLogForHabit(habit.id, today);
                  const { current } = getStreakData(habit.id);
                  const weeklyProgress = habit.frequency === 'weekly_target'
                    ? getWeeklyTargetProgress(habit.id, weekStart)
                    : undefined;
                  return (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      log={log}
                      streak={current}
                      isToday={true}
                      onToggle={() => handleToggle(habit.id)}
                      weeklyProgress={weeklyProgress}
                    />
                  );
                })}
              </View>
            );
          })
        )}

        {/* Uncategorized */}
        {(() => {
          const uncategorized = todayHabits.filter(h => !categories.find(c => c.id === h.categoryId));
          if (uncategorized.length === 0) return null;
          return (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>OTHER</Text>
              {uncategorized.map(habit => {
                const log = getLogForHabit(habit.id, today);
                const { current } = getStreakData(habit.id);
                return (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    log={log}
                    streak={current}
                    isToday={true}
                    onToggle={() => handleToggle(habit.id)}
                  />
                );
              })}
            </View>
          );
        })()}

        {/* Streak Freeze */}
        {canUseStreakFreeze() && (
          <TouchableOpacity
            onPress={handleStreakFreeze}
            style={[styles.freezeBtn, { backgroundColor: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.3)' }]}
            activeOpacity={0.7}
          >
            <Text style={styles.freezeText}>❄️ Use Streak Freeze</Text>
            <Text style={[styles.freezeSub, { color: colors.mutedForeground }]}>1 available this month</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flame: { fontSize: 22 },
  appName: { fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  monkBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  monkBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.2 },
  monkBanner: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  monkBannerText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textAlign: 'center', letterSpacing: 0.4 },
  greeting: { fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: -0.6, marginBottom: 12 },
  quoteCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  quoteText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, fontStyle: 'italic' },
  scoreCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 24,
  },
  scoreInner: { alignItems: 'center' },
  scorePct: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  scoreLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  scoreDetails: { flex: 1, gap: 10 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreNum: { fontSize: 20, fontFamily: 'Inter_700Bold', width: 36 },
  scoreDesc: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.2, marginBottom: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  freezeBtn: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  freezeText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#60A5FA', marginBottom: 2 },
  freezeSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
