import React from 'react';
import { View, Text } from 'react-native';
import { Widget } from 'react-native-android-widget';

interface ProgressTasksWidgetProps {
  completed: number;
  total: number;
  habits: Array<{ id: string; name: string; completed: boolean }>;
}

export function ProgressTasksWidget({ completed, total, habits }: ProgressTasksWidgetProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const displayHabits = habits.slice(0, 2);

  return (
    <Widget>
      <View style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: '#1a1a2e',
        padding: 12,
      }}>
        {/* Progress row */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 10,
        }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#16213e',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 3,
            borderColor: percentage > 50 ? '#4CAF50' : '#FF9800',
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: 'bold',
              color: '#ffffff',
            }}>
              {percentage}%
            </Text>
          </View>
          <Text style={{
            marginLeft: 12,
            fontSize: 14,
            color: '#ffffff',
          }}>
            {completed}/{total} done
          </Text>
        </View>

        {/* Tasks list */}
        {displayHabits.map((habit) => (
          <View key={habit.id} style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 3,
          }}>
            <Text style={{
              fontSize: 14,
              marginRight: 8,
            }}>
              {habit.completed ? '✅' : '⬜'}
            </Text>
            <Text style={{
              fontSize: 12,
              color: habit.completed ? '#4CAF50' : '#ffffff',
              textDecorationLine: habit.completed ? 'line-through' : 'none',
              opacity: habit.completed ? 0.6 : 1,
            }}>
              {habit.name}
            </Text>
          </View>
        ))}
        {habits.length > 2 && (
          <Text style={{
            fontSize: 10,
            color: '#666688',
            marginTop: 2,
          }}>
            +{habits.length - 2} more
          </Text>
        )}
      </View>
    </Widget>
  );
}
