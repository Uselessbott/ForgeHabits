import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useHabits } from '@/context/HabitsContext';
import {
  formatDate, parseDate, getTodayStr, getDaysInMonth, getFirstDayOfMonth,
  WEEKDAY_LABELS, MONTH_NAMES,
} from '@/utils/scheduling';

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getCalendarDay, getHabitsForDate, getLogForHabit, getDailyScore } = useHabits();

  const today = getTodayStr();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfMonth(year, month);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const calendarData = useMemo(() => {
    const cells: Array<{ date: string | null; color: 'none' | 'red' | 'yellow' | 'green'; day: number | null; isToday: boolean; isFuture: boolean }> = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push({ date: null, color: 'none', day: null, isToday: false, isFuture: false });
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isFuture = ds > today;
      const isToday = ds === today;
      const { color } = isFuture ? { color: 'none' as const } : getCalendarDay(ds);
      cells.push({ date: ds, color, day: d, isToday, isFuture });
    }
    return cells;
  }, [year, month, today]);

  function getDotColor(color: 'none' | 'red' | 'yellow' | 'green'): string {
    switch (color) {
      case 'green': return colors.success;
      case 'yellow': return colors.warning;
      case 'red': return colors.destructive;
      default: return 'transparent';
    }
  }

  function getCellBg(color: 'none' | 'red' | 'yellow' | 'green', isFuture: boolean): string {
    if (isFuture) return 'transparent';
    switch (color) {
      case 'green': return colors.success + '22';
      case 'yellow': return colors.warning + '22';
      case 'red': return colors.destructive + '22';
      default: return colors.card;
    }
  }

  const selectedDayInfo = useMemo(() => {
    if (!selectedDate) return null;
    const score = getDailyScore(selectedDate);
    const habitsForDay = getHabitsForDate(selectedDate);
    return { score, habits: habitsForDay };
  }, [selectedDate]);

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
        <Text style={[styles.title, { color: colors.foreground }]}>Calendar</Text>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.7}>
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.foreground }]}>
            {MONTH_NAMES[month]} {year}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.7}>
            <Feather name="chevron-right" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Weekday Labels */}
        <View style={styles.weekRow}>
          {WEEKDAY_LABELS.map((label, i) => (
            <Text key={i} style={[styles.weekLabel, { color: colors.mutedForeground }]}>{label}</Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.grid}>
          {calendarData.map((cell, index) => {
            if (!cell.date || !cell.day) {
              return <View key={`empty-${index}`} style={styles.cell} />;
            }
            const isSelected = selectedDate === cell.date;
            return (
              <TouchableOpacity
                key={cell.date}
                onPress={() => cell.date ? setSelectedDate(cell.date === selectedDate ? null : cell.date) : null}
                style={[
                  styles.cell,
                  {
                    backgroundColor: getCellBg(cell.color, cell.isFuture),
                    borderWidth: cell.isToday ? 1.5 : isSelected ? 1.5 : 0,
                    borderColor: cell.isToday ? colors.primary : isSelected ? colors.foreground : 'transparent',
                    borderRadius: 8,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayNum,
                  {
                    color: cell.isToday
                      ? colors.primary
                      : cell.isFuture
                      ? colors.border
                      : colors.foreground,
                    fontFamily: cell.isToday ? 'Inter_700Bold' : 'Inter_400Regular',
                  },
                ]}>
                  {cell.day}
                </Text>
                {!cell.isFuture && cell.color !== 'none' && (
                  <View style={[styles.dot, { backgroundColor: getDotColor(cell.color) }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {[
            { color: colors.success, label: '100% done' },
            { color: colors.warning, label: 'Partial' },
            { color: colors.destructive, label: '0% done' },
          ].map(({ color, label }) => (
            <View key={label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color + '44', borderColor: color }]} />
              <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Selected Day Detail */}
        {selectedDate && selectedDayInfo && (
          <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.detailDate, { color: colors.foreground }]}>
              {new Date(parseDate(selectedDate)).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            <Text style={[styles.detailScore, { color: colors.primary }]}>
              {selectedDayInfo.score.percentage}% — {selectedDayInfo.score.completed}/{selectedDayInfo.score.total} completed
            </Text>
            {selectedDayInfo.habits.map(h => {
              const log = getLogForHabit(h.id, selectedDate);
              const done = log?.status === 'completed' || log?.status === 'frozen';
              const frozen = log?.status === 'frozen';
              return (
                <View key={h.id} style={styles.detailRow}>
                  <Text style={styles.detailEmoji}>{h.emoji || '✨'}</Text>
                  <Text style={[styles.detailHabit, { color: done ? colors.mutedForeground : colors.foreground }]}>
                    {h.name}
                  </Text>
                  <Text style={{ color: done ? (frozen ? '#60A5FA' : colors.success) : colors.destructive, fontSize: 13 }}>
                    {done ? (frozen ? '❄️' : '✓') : '✗'}
                  </Text>
                </View>
              );
            })}
            {selectedDayInfo.habits.length === 0 && (
              <Text style={[styles.noHabits, { color: colors.mutedForeground }]}>No habits scheduled.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.8, marginBottom: 20 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  cell: { width: `${100 / 7}%` as any, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  dayNum: { fontSize: 14, lineHeight: 18 },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 4, borderWidth: 1 },
  legendLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  detailCard: { borderRadius: 16, borderWidth: 1, padding: 18, marginTop: 8 },
  detailDate: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  detailScore: { fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  detailEmoji: { fontSize: 18 },
  detailHabit: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  noHabits: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingVertical: 8 },
});
