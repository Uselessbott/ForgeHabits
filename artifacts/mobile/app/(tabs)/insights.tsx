import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useHabits } from '@/context/HabitsContext';
import {
  formatDate, parseDate, getTodayStr, getWeekStart, MONTH_NAMES, WEEKDAY_SHORT, addDays,
} from '@/utils/scheduling';
import {
  WeeklyBarChart, MonthlyLineChart, StreakBar, DayOfWeekChart,
} from '@/components/Charts';

type Tab = 'daily' | 'weekly' | 'monthly';

function SectionTitle({ title }: { title: string }) {
  const colors = useColors();
  return <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>;
}

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color: accent ? colors.primary : colors.foreground }]}>{value}</Text>
    </View>
  );
}

export default function InsightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { habits, logs, getDailyScore, getStreakData, getWeeklyTargetProgress, getHabitsForDate } = useHabits();
  const [activeTab, setActiveTab] = useState<Tab>('daily');

  const today = getTodayStr();
  const todayDate = parseDate(today);
  const weekStart = getWeekStart(today);
  const now = new Date();

  const topInset = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  // ── Shared: best streak ──────────────────────────────────────────
  const allStreakData = useMemo(() => {
    return habits
      .filter(h => !h.archived)
      .map(h => ({ habit: h, ...getStreakData(h.id) }))
      .sort((a, b) => b.current - a.current);
  }, [habits, logs]);

  const bestCurrentStreak = allStreakData[0]?.current ?? 0;

  // ── DAILY TAB ────────────────────────────────────────────────────
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - 6 + i);
      const ds = formatDate(d);
      const score = getDailyScore(ds);
      const dayIdx = d.getDay();
      return {
        label: WEEKDAY_SHORT[dayIdx].slice(0, 3),
        pct: score.total > 0 ? score.percentage : 0,
        isToday: ds === today,
        hasHabits: score.total > 0,
        date: ds,
      };
    });
  }, [today, logs, habits]);

  const todayScore = getDailyScore(today);

  // Week average (last 7 days)
  const weekAvg = useMemo(() => {
    const days = last7Days.filter(d => d.hasHabits);
    if (days.length === 0) return 0;
    return Math.round(days.reduce((acc, d) => acc + d.pct, 0) / days.length);
  }, [last7Days]);

  // ── WEEKLY TAB ───────────────────────────────────────────────────
  const weeklyTargetHabits = habits.filter(h => !h.archived && h.frequency === 'weekly_target');

  const dayOfWeekStats = useMemo(() => {
    const counts: number[] = Array(7).fill(0);
    const totals: number[] = Array(7).fill(0);
    // Last 8 weeks
    for (let w = 0; w < 8; w++) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(todayDate);
        date.setDate(date.getDate() - w * 7 - (6 - d));
        const ds = formatDate(date);
        if (ds > today) continue;
        const score = getDailyScore(ds);
        const dow = date.getDay();
        if (score.total > 0) {
          totals[dow]++;
          if (score.percentage === 100) counts[dow]++;
        }
      }
    }
    return Array.from({ length: 7 }, (_, i) => ({
      label: WEEKDAY_SHORT[i],
      pct: totals[i] > 0 ? Math.round((counts[i] / totals[i]) * 100) : 0,
      count: counts[i],
    }));
  }, [today, logs, habits]);

  // ── MONTHLY TAB ──────────────────────────────────────────────────
  const monthlyLineData = useMemo(() => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const score = getDailyScore(ds);
      return { day: d, pct: score.percentage, hasHabits: score.total > 0 };
    }).filter(d => d.hasHabits || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}` <= today);
  }, [today, logs, habits]);

  const monthlyHabits = habits.filter(h => !h.archived && h.frequency === 'monthly');

  const monthlyStats = useMemo(() => {
    let totalCompleted = 0;
    let totalScheduled = 0;
    monthlyLineData.forEach(d => {
      const ds = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
      const score = getDailyScore(ds);
      totalCompleted += score.completed;
      totalScheduled += score.total;
    });
    const pct = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;
    return { completed: totalCompleted, total: totalScheduled, pct };
  }, [monthlyLineData, logs, habits]);

  // ── Render ───────────────────────────────────────────────────────
  function renderDaily() {
    return (
      <View>
        {/* 7-Day Bar Chart */}
        <SectionTitle title="COMPLETION — LAST 7 DAYS" />
        <Card style={{ paddingVertical: 16, paddingHorizontal: 8 }}>
          <WeeklyBarChart data={last7Days} height={170} />
        </Card>

        {/* Stats */}
        <SectionTitle title="TODAY'S STATS" />
        <Card>
          <StatRow label="Today" value={`${todayScore.percentage}%`} accent />
          <Divider />
          <StatRow label="Completed" value={`${todayScore.completed} / ${todayScore.total}`} />
          <Divider />
          <StatRow label="7-Day Avg" value={`${weekAvg}%`} />
          <Divider />
          <StatRow label="Best Streak" value={`🔥 ${bestCurrentStreak} days`} />
        </Card>

        {/* Today's Habits */}
        {getHabitsForDate(today).length > 0 && (
          <>
            <SectionTitle title="TODAY'S HABITS" />
            <Card>
              {getHabitsForDate(today).map((h, i) => {
                const log = logs.find(l => l.habitId === h.id && l.date === today);
                const done = log?.status === 'completed' || log?.status === 'frozen';
                const frozen = log?.status === 'frozen';
                return (
                  <View key={h.id}>
                    {i > 0 && <Divider />}
                    <View style={styles.habitRow}>
                      <Text style={styles.habitEmoji}>{h.emoji || '✨'}</Text>
                      <Text style={[styles.habitName, { color: done ? colors.mutedForeground : colors.foreground }]} numberOfLines={1}>
                        {h.name}
                      </Text>
                      <Text style={{ color: done ? (frozen ? '#60A5FA' : colors.success) : colors.destructive, fontSize: 14 }}>
                        {done ? (frozen ? '❄️' : '✓') : '–'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </Card>
          </>
        )}
      </View>
    );
  }

  function renderWeekly() {
    return (
      <View>
        {/* Weekly completion by day-of-week */}
        <SectionTitle title="BEST DAYS OF THE WEEK" />
        <Card style={{ paddingVertical: 16, paddingHorizontal: 8 }}>
          <DayOfWeekChart data={dayOfWeekStats} />
        </Card>

        {/* Streak leaderboard */}
        {allStreakData.filter(d => d.current > 0).length > 0 && (
          <>
            <SectionTitle title="CURRENT STREAKS" />
            <Card style={{ padding: 16 }}>
              {allStreakData
                .filter(d => d.current > 0)
                .slice(0, 8)
                .map(d => (
                  <StreakBar
                    key={d.habit.id}
                    label={d.habit.name}
                    emoji={d.habit.emoji || '✨'}
                    value={d.current}
                    max={Math.max(bestCurrentStreak, 1)}
                    color={colors.primary}
                  />
                ))}
            </Card>
          </>
        )}

        {/* Weekly target habits */}
        {weeklyTargetHabits.length > 0 && (
          <>
            <SectionTitle title="WEEKLY TARGETS" />
            <Card>
              {weeklyTargetHabits.map((h, i) => {
                const progress = getWeeklyTargetProgress(h.id, weekStart);
                const pct = progress.target > 0 ? progress.completed / progress.target : 0;
                return (
                  <View key={h.id}>
                    {i > 0 && <Divider />}
                    <View style={[styles.habitRow, { paddingVertical: 14 }]}>
                      <Text style={styles.habitEmoji}>{h.emoji || '✨'}</Text>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={[styles.habitName, { color: colors.foreground }]} numberOfLines={1}>
                            {h.name}
                          </Text>
                          <Text style={[styles.habitName, { color: pct >= 1 ? colors.success : colors.primary }]}>
                            {progress.completed}/{progress.target}
                          </Text>
                        </View>
                        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                          <View style={[styles.progressFill, {
                            backgroundColor: pct >= 1 ? colors.success : colors.primary,
                            width: `${Math.min(100, pct * 100)}%` as any,
                          }]} />
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </Card>
          </>
        )}

        {allStreakData.filter(d => d.current > 0).length === 0 && weeklyTargetHabits.length === 0 && (
          <Text style={[styles.noData, { color: colors.mutedForeground }]}>
            Complete habits to see your weekly stats.
          </Text>
        )}
      </View>
    );
  }

  function renderMonthly() {
    const monthName = MONTH_NAMES[now.getMonth()];
    return (
      <View>
        {/* Monthly Line Chart */}
        <SectionTitle title={`DAILY COMPLETION — ${monthName.toUpperCase()}`} />
        {monthlyLineData.length >= 2 ? (
          <Card style={{ paddingVertical: 16, paddingHorizontal: 8 }}>
            <MonthlyLineChart data={monthlyLineData} height={150} />
          </Card>
        ) : (
          <Card>
            <Text style={[styles.noData, { color: colors.mutedForeground, paddingVertical: 24 }]}>
              Keep tracking to see your monthly trend.
            </Text>
          </Card>
        )}

        {/* Monthly stats */}
        <SectionTitle title={`${monthName.toUpperCase()} OVERVIEW`} />
        <Card>
          <StatRow label="Month Completion" value={`${monthlyStats.pct}%`} accent />
          <Divider />
          <StatRow label="Total Completed" value={`${monthlyStats.completed}`} />
          <Divider />
          <StatRow label="Total Scheduled" value={`${monthlyStats.total}`} />
          <Divider />
          <StatRow label="Days Tracked" value={`${monthlyLineData.length}`} />
        </Card>

        {/* Streak leaderboard */}
        {allStreakData.length > 0 && (
          <>
            <SectionTitle title="ALL-TIME STREAKS" />
            <Card style={{ padding: 16 }}>
              {allStreakData.slice(0, 6).map(d => (
                <StreakBar
                  key={d.habit.id}
                  label={d.habit.name}
                  emoji={d.habit.emoji || '✨'}
                  value={d.longest}
                  max={Math.max(...allStreakData.map(x => x.longest), 1)}
                  color={colors.warning}
                />
              ))}
            </Card>
          </>
        )}

        {/* Monthly habits */}
        {monthlyHabits.length > 0 && (
          <>
            <SectionTitle title="MONTHLY HABIT PROGRESS" />
            <Card>
              {monthlyHabits.map((h, i) => {
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                let completed = 0;
                let total = 0;
                for (let d = 1; d <= daysInMonth; d++) {
                  const ds = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  if (ds > today) continue;
                  if ((h.monthlyDates ?? []).includes(d)) {
                    total++;
                    const log = logs.find(l => l.habitId === h.id && l.date === ds);
                    if (log?.status === 'completed' || log?.status === 'frozen') completed++;
                  }
                }
                const pct = total > 0 ? completed / total : 0;
                return (
                  <View key={h.id}>
                    {i > 0 && <Divider />}
                    <View style={[styles.habitRow, { paddingVertical: 14 }]}>
                      <Text style={styles.habitEmoji}>{h.emoji || '✨'}</Text>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={[styles.habitName, { color: colors.foreground }]} numberOfLines={1}>
                            {h.name}
                          </Text>
                          <Text style={[styles.habitName, { color: pct >= 1 ? colors.success : colors.primary }]}>
                            {completed}/{total}
                          </Text>
                        </View>
                        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                          <View style={[styles.progressFill, {
                            backgroundColor: pct >= 1 ? colors.success : colors.primary,
                            width: `${Math.min(100, pct * 100)}%` as any,
                          }]} />
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </Card>
          </>
        )}
      </View>
    );
  }

  function Divider() {
    return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
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
              style={[styles.tabBtn, activeTab === tab && { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabLabel, { color: activeTab === tab ? '#fff' : colors.mutedForeground }]}>
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
    marginBottom: 20,
    gap: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  tabLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 20,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 0,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  statValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  divider: { height: 1, marginHorizontal: 16 },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  habitEmoji: { fontSize: 18 },
  habitName: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },
  noData: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
