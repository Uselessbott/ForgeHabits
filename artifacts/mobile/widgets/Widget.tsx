 import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetCache } from '../context/types';

const WIDGET_KEY = '@fg:widget';

const DEFAULT_CACHE: WidgetCache = {
  progress: 0,
  streak: 0,
  completed: 0,
  remaining: 0,
  tasks: [],
};

type WidgetSize = 'small' | 'medium' | 'large';

function getSize(width: number, height: number): WidgetSize {
  if (width < 200) return 'small';
  if (height < 200) return 'medium';
  return 'large';
}

interface ForgeHabitsWidgetProps {
  widgetInfo?: {
    widgetId: number;
    width: number;
    height: number;
  };
}

export function ForgeHabitsWidget({ widgetInfo }: ForgeHabitsWidgetProps) {
  const [cache, setCache] = useState<WidgetCache>(DEFAULT_CACHE);

  useEffect(() => {
    AsyncStorage.getItem(WIDGET_KEY)
      .then((raw) => {
        if (raw) {
          try {
            setCache(JSON.parse(raw) as WidgetCache);
          } catch {
            setCache(DEFAULT_CACHE);
          }
        }
      })
      .catch(() => {});
  }, []);

  const width = widgetInfo?.width ?? 250;
  const height = widgetInfo?.height ?? 250;  const size = getSize(width, height);

  const progressColor =
    cache.progress >= 80
      ? '#22c55e'
      : cache.progress >= 50
        ? '#eab308'
        : '#ef4444';

  if (size === 'small') {
    return (
      <View style={styles.rootSmall} clickAction="OPEN_APP">
        <View style={styles.progressRing}>
          <Text style={[styles.progressText, { color: progressColor }]}>
            {cache.progress}%
          </Text>
        </View>
        <View style={styles.streakRow}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakNumber}>{cache.streak}</Text>
        </View>
      </View>
    );
  }

  if (size === 'medium') {
    return (
      <View style={styles.rootMedium} clickAction="OPEN_APP">
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.titleLabel}>ForgeHabits</Text>
            <Text style={[styles.progressLabel, { color: progressColor }]}>
              {cache.progress}% done
            </Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakNumber}>{cache.streak}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.taskList}>
          {cache.tasks.slice(0, 4).map((task, i) => (
            <View key={i} style={styles.taskRow}>
              <Text style={styles.checkbox}>
                {task.completed ? '☑' : '☐'}
              </Text>
              <Text style={styles.taskEmoji}>{task.emoji}</Text>              <Text
                style={[
                  styles.taskName,
                  task.completed && styles.taskNameCompleted,
                ]}
                numberOfLines={1}
              >
                {task.name}
              </Text>
            </View>
          ))}
          {cache.tasks.length === 0 && (
            <Text style={styles.emptyText}>No habits today</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.rootLarge} clickAction="OPEN_APP">
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.titleLabel}>ForgeHabits</Text>
          <Text style={[styles.progressLabel, { color: progressColor }]}>
            {cache.progress}% complete
          </Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakNumber}>{cache.streak}</Text>
        </View>
      </View>

      <View style={styles.countersRow}>
        <View style={styles.counterBox}>
          <Text style={styles.counterValue}>{cache.completed}</Text>
          <Text style={styles.counterLabel}>Done</Text>
        </View>
        <View style={styles.counterBox}>
          <Text style={styles.counterValue}>{cache.remaining}</Text>
          <Text style={styles.counterLabel}>Left</Text>
        </View>
        <View style={styles.counterBox}>
          <Text style={styles.counterValue}>{cache.tasks.length}</Text>
          <Text style={styles.counterLabel}>Total</Text>
        </View>
      </View>

      <View style={styles.divider} />
      <View style={styles.taskList}>
        {cache.tasks.map((task, i) => (
          <View key={i} style={styles.taskRow}>
            <Text style={styles.checkbox}>
              {task.completed ? '☑' : '☐'}
            </Text>
            <Text style={styles.taskEmoji}>{task.emoji}</Text>
            <Text
              style={[
                styles.taskName,
                task.completed && styles.taskNameCompleted,
              ]}
              numberOfLines={1}
            >
              {task.name}
            </Text>
          </View>
        ))}
        {cache.tasks.length === 0 && (
          <Text style={styles.emptyText}>No habits scheduled today</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootSmall: {
    flex: 1,
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rootMedium: {
    flex: 1,
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  rootLarge: {
    flex: 1,
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 14,
    gap: 8,  },
  progressRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 18,
    fontWeight: '700',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f97316',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    gap: 2,
  },
  titleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e4e4e7',
    letterSpacing: 0.5,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#27272a',    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#27272a',
    marginVertical: 2,
  },
  countersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  counterBox: {
    alignItems: 'center',
    gap: 2,
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e4e4e7',
  },
  counterLabel: {
    fontSize: 10,
    color: '#71717a',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  taskList: {
    gap: 4,
    flex: 1,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  checkbox: {
    fontSize: 16,
    color: '#a1a1aa',
    width: 20,
    textAlign: 'center',
  },
  taskEmoji: {
    fontSize: 14,
  },
  taskName: {
    fontSize: 13,    color: '#e4e4e7',
    fontWeight: '500',
    flex: 1,
  },
  taskNameCompleted: {
    color: '#71717a',
    textDecorationLine: 'line-through',
  },
  emptyText: {
    fontSize: 12,
    color: '#52525b',
    textAlign: 'center',
    marginTop: 8,
  },
});
