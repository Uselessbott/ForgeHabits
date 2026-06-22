import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useHabits } from '@/context/HabitsContext';
import { Habit } from '@/context/types';
import { getTodayStr, getWeekStart } from '@/utils/scheduling';

function FrequencyLabel({ habit }: { habit: Habit }) {
  const colors = useColors();
  let label = '';
  switch (habit.frequency) {
    case 'daily': label = 'Daily'; break;
    case 'weekly': {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      label = (habit.weekdays ?? []).map(d => days[d]).join(', ') || 'Weekly';
      break;
    }
    case 'weekly_target': label = `${habit.weeklyTarget}×/week`; break;
    case 'monthly': label = `${(habit.monthlyDates ?? []).map(d => `${d}`).join(', ')} of month`; break;
  }
  return (
    <Text style={[styles.freqLabel, { color: colors.mutedForeground }]}>{label}</Text>
  );
}

export default function HabitsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { habits, categories, deleteHabit, archiveHabit, toggleCategoryCollapsed, deleteCategory, updateCategory } = useHabits();
  const [showArchived, setShowArchived] = useState(false);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories],
  );

  const topInset = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  function handleEditHabit(habitId: string) {
    router.push({ pathname: '/habit-form', params: { habitId } });
  }

  function handleHabitOptions(habit: Habit) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      `${habit.emoji} ${habit.name}`,
      '',
      [
        { text: 'Edit', onPress: () => handleEditHabit(habit.id) },
        {
          text: habit.archived ? 'Unarchive' : 'Archive',
          onPress: () => archiveHabit(habit.id),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Delete Habit?', 'All data for this habit will be removed.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(habit.id) },
            ]),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }

  function handleCategoryOptions(catId: string, catName: string) {
    Alert.alert(catName, '', [
      { text: 'Edit', onPress: () => router.push({ pathname: '/category-form', params: { categoryId: catId } }) },
      {
        text: 'Delete Category',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete Category?', 'All habits in this category will also be deleted.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(catId) },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const activeHabits = habits.filter(h => !h.archived);
  const archivedHabits = habits.filter(h => h.archived);

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
          <Text style={[styles.title, { color: colors.foreground }]}>Habits</Text>
          <View style={styles.headerBtns}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/category-form' })}
              style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <Feather name="folder-plus" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/habit-form' })}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={18} color="#fff" />
              <Text style={styles.addBtnText}>New Habit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {activeHabits.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon]}>🌱</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No habits yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Tap "New Habit" to start building your discipline.
            </Text>
          </View>
        )}

        {sortedCategories.map(cat => {
          const catHabits = activeHabits.filter(h => h.categoryId === cat.id);
          if (catHabits.length === 0) return null;
          return (
            <View key={cat.id} style={styles.section}>
              <TouchableOpacity
                onPress={() => toggleCategoryCollapsed(cat.id)}
                onLongPress={() => handleCategoryOptions(cat.id, `${cat.emoji} ${cat.name}`)}
                style={styles.categoryHeader}
                activeOpacity={0.7}
              >
                <Text style={[styles.catTitle, { color: colors.foreground }]}>
                  {cat.emoji} {cat.name}
                </Text>
                <View style={styles.catRight}>
                  <Text style={[styles.catCount, { color: colors.mutedForeground }]}>{catHabits.length}</Text>
                  <Feather
                    name={cat.collapsed ? 'chevron-right' : 'chevron-down'}
                    size={16}
                    color={colors.mutedForeground}
                  />
                </View>
              </TouchableOpacity>

              {!cat.collapsed &&
                catHabits.map(habit => (
                  <TouchableOpacity
                    key={habit.id}
                    onPress={() => handleEditHabit(habit.id)}
                    onLongPress={() => handleHabitOptions(habit)}
                    style={[styles.habitRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.habitEmoji}>{habit.emoji || '✨'}</Text>
                    <View style={styles.habitContent}>
                      <Text style={[styles.habitName, { color: colors.foreground }]}>{habit.name}</Text>
                      <FrequencyLabel habit={habit} />
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
            </View>
          );
        })}

        {/* Uncategorized */}
        {(() => {
          const uncategorized = activeHabits.filter(h => !categories.find(c => c.id === h.categoryId));
          if (uncategorized.length === 0) return null;
          return (
            <View style={styles.section}>
              <Text style={[styles.catTitle, { color: colors.foreground }]}>Other</Text>
              {uncategorized.map(habit => (
                <TouchableOpacity
                  key={habit.id}
                  onPress={() => handleEditHabit(habit.id)}
                  onLongPress={() => handleHabitOptions(habit)}
                  style={[styles.habitRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={0.75}
                >
                  <Text style={styles.habitEmoji}>{habit.emoji || '✨'}</Text>
                  <View style={styles.habitContent}>
                    <Text style={[styles.habitName, { color: colors.foreground }]}>{habit.name}</Text>
                    <FrequencyLabel habit={habit} />
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </View>
          );
        })()}

        {/* Archived */}
        {archivedHabits.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              onPress={() => setShowArchived(v => !v)}
              style={styles.categoryHeader}
              activeOpacity={0.7}
            >
              <Text style={[styles.catTitle, { color: colors.mutedForeground }]}>Archived ({archivedHabits.length})</Text>
              <Feather name={showArchived ? 'chevron-down' : 'chevron-right'} size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            {showArchived &&
              archivedHabits.map(habit => (
                <TouchableOpacity
                  key={habit.id}
                  onLongPress={() => handleHabitOptions(habit)}
                  style={[styles.habitRow, { backgroundColor: colors.card, borderColor: colors.border, opacity: 0.5 }]}
                  activeOpacity={0.75}
                >
                  <Text style={styles.habitEmoji}>{habit.emoji || '✨'}</Text>
                  <View style={styles.habitContent}>
                    <Text style={[styles.habitName, { color: colors.mutedForeground }]}>{habit.name}</Text>
                    <Text style={[styles.freqLabel, { color: colors.mutedForeground }]}>Archived</Text>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.8 },
  headerBtns: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  section: { marginBottom: 20 },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 4,
  },
  catTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  catRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catCount: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  habitEmoji: { fontSize: 22 },
  habitContent: { flex: 1 },
  habitName: { fontSize: 15, fontFamily: 'Inter_500Medium', marginBottom: 2 },
  freqLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
