import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

type HabitItem = {
  id: string;
  name: string;
  completed: boolean;
};

type Props = {
  completed: number;
  total: number;
  habits: HabitItem[];
  streak: number;
};

export function ProgressTasksWidget({ completed, total, habits, streak }: Props) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const color = percentage >= 80 ? '#4CAF50' : percentage >= 50 ? '#FF9800' : '#f44336';
  const displayHabits = habits.slice(0, 3);

  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: '#1a1a2e',
        padding: 12,
        flexDirection: 'column',
      }}
    >
      {/* Top row: progress circle + stats */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <FlexWidget
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: '#16213e',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 4,
            borderColor: color,
          }}
        >
          <TextWidget
            text={`${percentage}%`}
            style={{
              fontSize: 14,
              fontWeight: 'bold',
              color: '#ffffff',
            }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            flexDirection: 'column',
            marginLeft: 12,
          }}
        >
          <TextWidget
            text={`${completed}/${total} done`}
            style={{
              fontSize: 14,
              color: '#ffffff',
            }}
          />
          <TextWidget
            text={`🔥 ${streak} day streak`}
            style={{
              fontSize: 12,
              color: '#FF9800',
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Tasks list */}
      {displayHabits.map((habit) => (
        <FlexWidget
          key={habit.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 3,
          }}
        >
          <TextWidget
            text={habit.completed ? '✅' : '⬜'}
            style={{
              fontSize: 14,
              marginRight: 8,
            }}
          />
          <TextWidget
            text={habit.name}
            style={{
              fontSize: 12,
              color: habit.completed ? '#4CAF50' : '#ffffff',
              textDecorationLine: habit.completed ? 'line-through' : 'none',
              opacity: habit.completed ? 0.6 : 1,
            }}
          />
        </FlexWidget>
      ))}

      {habits.length > 3 && (
        <TextWidget
          text={`+${habits.length - 3} more`}
          style={{
            fontSize: 11,
            color: '#666688',
            marginTop: 2,
          }}
        />
      )}
    </FlexWidget>
  );
}
