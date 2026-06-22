import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Habit, HabitLog } from '@/context/types';

interface HabitCardProps {
  habit: Habit;
  log: HabitLog | undefined;
  streak: number;
  isToday: boolean;
  onToggle: () => void;
  onLongPress?: () => void;
  weeklyProgress?: { completed: number; target: number };
}

export function HabitCard({ habit, log, streak, isToday, onToggle, onLongPress, weeklyProgress }: HabitCardProps) {
  const colors = useColors();
  const isCompleted = log?.status === 'completed';
  const isFrozen = log?.status === 'frozen';

  function handleToggle() {
    if (!isToday) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  }

  const checkboxColor = isCompleted
    ? colors.primary
    : isFrozen
    ? '#60A5FA'
    : colors.border;

  const checkboxBg = isCompleted
    ? colors.primary
    : isFrozen
    ? 'rgba(96,165,250,0.15)'
    : 'transparent';

  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      activeOpacity={0.75}
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <TouchableOpacity
        onPress={handleToggle}
        disabled={!isToday}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={[styles.checkbox, { borderColor: checkboxColor, backgroundColor: checkboxBg }]}
        activeOpacity={0.7}
      >
        {isCompleted && <Feather name="check" size={13} color={colors.primaryForeground} />}
        {isFrozen && <Text style={styles.frozenIcon}>❄️</Text>}
      </TouchableOpacity>

      <Text style={styles.emoji}>{habit.emoji || '✨'}</Text>

      <View style={styles.content}>
        <Text
          style={[
            styles.name,
            { color: isCompleted ? colors.mutedForeground : colors.foreground },
            isCompleted && styles.strikethrough,
          ]}
          numberOfLines={1}
        >
          {habit.name}
        </Text>
        {habit.frequency === 'weekly_target' && weeklyProgress ? (
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            {weeklyProgress.completed}/{weeklyProgress.target} this week
          </Text>
        ) : habit.description ? (
          <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {habit.description}
          </Text>
        ) : null}
      </View>

      {streak > 0 && (
        <View style={styles.streakRow}>
          <Text style={styles.fire}>🔥</Text>
          <Text style={[styles.streakNum, { color: colors.primary }]}>{streak}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frozenIcon: {
    fontSize: 11,
  },
  emoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    letterSpacing: -0.2,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  sub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  fire: {
    fontSize: 14,
  },
  streakNum: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
