import React from 'react';
import { View, Text } from 'react-native';
import { Widget } from 'react-native-android-widget';

interface TasksWidgetProps {
  habits: Array<{ id: string; name: string; completed: boolean }>;
  completed: number;
  total: number;
}

export function TasksWidget({ habits, completed, total }: TasksWidgetProps) {
  // Show only first 3 habits or all if less
  const displayHabits = habits.slice(0, 3);

  return (
    <Widget>
      <View style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: '#1a1a2e',
        padding: 12,
      }}>
        <Text style={{
          fontSize: 14,
          fontWeight: 'bold',
          color: '#ffffff',
          marginBottom: 8,
        }}>
          Today's Tasks ({completed}/{total})
        </Text>
        {displayHabits.map((habit) => (
          <View key={habit.id} style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 4,
          }}>
            <Text style={{
              fontSize: 16,
              marginRight: 8,
            }}>
              {habit.completed ? '✅' : '⬜'}
            </Text>
            <Text style={{
              fontSize: 13,
              color: habit.completed ? '#4CAF50' : '#ffffff',
              textDecorationLine: habit.completed ? 'line-through' : 'none',
              opacity: habit.completed ? 0.6 : 1,
            }}>
              {habit.name}
            </Text>
          </View>
        ))}
        {habits.length > 3 && (
          <Text style={{
            fontSize: 12,
            color: '#666688',
            marginTop: 4,
          }}>
            +{habits.length - 3} more
          </Text>
        )}
      </View>
    </Widget>
  );
}
