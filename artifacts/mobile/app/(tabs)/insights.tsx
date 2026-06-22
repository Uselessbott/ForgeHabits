import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useHabits } from '@/context/HabitsContext';
import { formatDate, parseDate, getTodayStr, getWeekStart, getMonthStr, MONTH_NAMES } from '@/utils/scheduling';

type Tab = 'daily' | 'weekly' | 'monthly';

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color: accent ? colors.primary : colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {sub ? <Text style={[styles.statSub, { color: colors.mutedForeground }]}>{sub}</Text> : null}
    </View>
  );
}

export default function InsightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { habits, logs, getDailyScore, getStreakData, getWeeklyTargetProgress, getHabitsForDate } = useHabits();
  const [activeTab, setActiveTab] = useState<Tab>('daily');

  const today = getTodayStr();
  const weekStart = getWeekStart(today);
  const monthStr = getMonthStr(today);
  const now = new Date();

  // Daily data
  const dailyScore = getDailyScore(today);

  // Overall best streak across all habits
  const bestStreak = useMemo(() => {
    let best = 0;
    habits.filter(h => !h.archived).forEach(h => {
      const { current } = getStreakData(h.id);
      if (current > best) best = current;
    });
    return best;
  }, [habits, logs]);

  // Weekly data
  const weeklyHabits = useMemo(
    () => habits.filter(h => !h.archived && h.frequency === 'weekly_target'),
    [habits],
  );

  const weeklyStats = useMemo(() => {
    let totalCompleted = 0;
    let totalScheduled = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(parseDate(weekStart));
      d.setDate(d.getDate() + i);
      const ds = formatDate(d);
      if (ds > today) break;
      const score = getDailyScore(ds);
      totalCompleted += score.completed;
      totalScheduled += score.total;
    }
    const pct = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;
    return { completed: totalCompleted, total: totalScheduled, pct };
  }, [weekStart, today, logs]);

  // Monthly data
  const monthlyStats = useMemo(() => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let totalCompleted = 0;
    let totalScheduled = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (ds > today) break;
      const score = getDailyScore(ds);
      totalCompleted += score.completed;
      totalScheduled += score.total;
    }
    const pct = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;
    return { completed: totalCompleted, total: totalScheduled, pct };
  }, [monthStr, today, logs]);

  const monthlyHabits = useMemo(
    () => habits.filter(h => !h.archived && h.frequency === 'monthly'),
    [habits],
  );

  const topInset = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  function renderDaily() {
    const missedCount = dailyScore.total - dailyScore.completed;
    return (
      <View style={styles.tabContent}>
        <View style={styles.statsGrid}>
          <StatCard label="Completion" value={`${dailyScore.percentage}%`} accent />
          <StatCard label="Completed" value={`${dailyScore.completed}`} sub={`of ${dailyScore.total}`} />
          <StatCard label="Missed" value={`${missedCount}`} />
          <StatCard label="Best Streak" value={`${bestStreak}`} sub="days 🔥" />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TODAY'S HABITS</Text>
        {getHabitsForDate(today).map(h => {
          const log = logs.find(l => l.habitId === h.id && l.date === today);
          const done = log?.status === 'completed' || log?.status === 'frozen';
          return (
            <View
              key={h.id}
              style={[styles.habitRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={styles.rowEmoji}>{h.emoji || '✨'}</Text>
              <Text style={[styles.rowName, { color: done ? colors.mutedForeground : colors.foreground }]}>
                {h.name}
              </Text>
              <View style={[styles.statusDot, { backgroundColor: done ? colors.success : colors.destructive }]} />
            </View>
          );
        })}
        {getHabitsForDate(today).length === 0 && (
          <Text style={[styles.noData, { color: colors.mutedForeground }]}>No habits scheduled today.</Text>
        )}
      </View>
    );
  }

  function renderWeekly() {
    return (
      <View style={styles.tabContent}>
        <View style={styles.statsGrid}>
          <StatCard label="Week Rate" value={`${weeklyStats.pct}%`} accent />
          <StatCard label="Completed" value={`${weeklyStats.completed}`} />
          <StatCard label="Total" value={`${weeklyStats.total}`} sub="this week" />
          <StatCard label="Best Streak" value={`${bestStreak}`} sub="days 🔥" />
        </View>

        {weeklyHabits.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>WEEKLY TARGETS</Text>
            {weeklyHabits.map(h => {
              const progress = getWeeklyTargetProgress(h.id, weekStart);
              const pct = progress.target > 0 ? progress.completed / progress.target : 0;
              return (
                <View key={h.id} style={[styles.habitRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={styles.rowEmoji}>{h.emoji || '✨'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowName, { color: colors.foreground }]}>{h.name}</Text>
                    <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${Math.min(100, pct * 100)}%` as any }]} />
                    </View>
                  </View>
                  <Text style={[styles.targetText, { color: pct >= 1 ? colors.success : colors.primary }]}>
                    {progress.completed}/{progress.target}
                  </Text>
                </View>
              );
            })}
          </>
        )}
        {weeklyHabits.length === 0 && (
          <Text style={[styles.noData, { color: colors.mutedForeground }]}>
            No weekly target habits set. Add one in the Habits tab.
          </Text>
        )}
      </View>
    );
  }

  function renderMonthly() {
    const monthName = MONTH_NAMES[now.getMonth()];
    return (
      <View style={styles.tabContent}>
        <View style={styles.statsGrid}>
          <StatCard label={`${monthName} Rate`} value={`${monthlyStats.pct}%`} accent />
          <StatCard label="Completed" value={`${monthlyStats.completed}`} />
          <StatCard label="Total" value={`${monthlyStats.total}`} sub="this month" />
          <StatCard label="Best Streak" value={`${bestStreak}`} sub="days 🔥" />
        </View>

        {monthlyHabits.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>MONTHLY HABITS</Text>
            {monthlyHabits.map(h => {
              const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
              let completed = 0;
              let total = 0;
              for (let d = 1; d <= daysInMonth; d++) {
                const ds = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                if (ds > today) continue;
                const scheduled = (h.monthlyDates ?? []).includes(d);
                if (scheduled) {
                  total++;
                  const log = logs.find(l => l.habitId === h.id && l.date === ds);
                  if (log?.status === 'completed' || log?.status === 'frozen') completed++;
                }
              }
              return (
                <View key={h.id} style={[styles.habitRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={styles.rowEmoji}>{h.emoji || '✨'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowName, { color: colors.foreground }]}>{h.name}</Text>
                    <Text style={[styles.freqSub, { color: colors.mutedForeground }]}>
                      Days: {(h.monthlyDates ?? []).join(', ')}
                    </Text>
                  </View>
                  <Text style={[styles.targetText, { color: completed === total && total > 0 ? colors.success : colors.primary }]}>
                    {completed}/{total}
                  </Text>
                </View>
              );
            })}
          </>
        )}
        {monthlyHabits.length === 0 && (
          <Text style={[styles.noData, { color: colors.mutedForeground }]}>
            No monthly habits set.
          </Text>
        )}
      </View>
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
        <Text style={[styles.title, { color: colors.foreground }]}>Insights</Text>

        {/* Tab Selector */}
        <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(['daily', 'weekly', 'monthly'] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabBtn,
                activeTab === tab && { backgroundColor: colors.primary },
              ]}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.tabLabel,
                { color: activeTab === tab ? '#fff' : colors.mutedForeground },
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'daily' && renderDaily()}
        {activeTab === 'weekly' && renderWeekly()}
        {activeTab === 'monthly' && renderMonthly()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.8, marginBottom: 20 },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  tabContent: { gap: 0 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.8 },
  statLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginTop: 4, textAlign: 'center' },
  statSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2, textAlign: 'center' },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.2, marginBottom: 10 },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  rowEmoji: { fontSize: 20 },
  rowName: { fontSize: 15, fontFamily: 'Inter_500Medium', flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  progressTrack: { height: 4, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  targetText: { fontSize: 15, fontFamily: 'Inter_700Bold', minWidth: 40, textAlign: 'right' },
  freqSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  noData: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingVertical: 24 },
});
