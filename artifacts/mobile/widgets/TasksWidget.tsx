import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

type HabitItem = {
  id: string;
  name: string;
  completed: boolean;
};

type Props = {
  habits: HabitItem[];
  completed: number;
  total: number;
};

export function TasksWidget({ habits, completed, total }: Props) {
  const displayHabits = habits.slice(0, 4);

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
      <TextWidget
        text={`📋 Today's Tasks (${completed}/${total})`}
        style={{
          fontSize: 14,
          fontWeight: 'bold',
          color: '#ffffff',
          marginBottom: 8,
        }}
      />

      {displayHabits.map((habit) => (
        <FlexWidget
          key={habit.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 4,
          }}
        >
          <TextWidget
            text={habit.completed ? '✅' : '⬜'}
            style={{
              fontSize: 16,
              marginRight: 8,
            }}
          />
          <TextWidget
            text={habit.name}
            style={{
              fontSize: 13,
              color: habit.completed ? '#4CAF50' : '#ffffff',
              textDecorationLine: habit.completed ? 'line-through' : 'none',
              opacity: habit.completed ? 0.6 : 1,
            }}
          />
        </FlexWidget>
      ))}

      {habits.length > 4 && (
        <TextWidget
          text={`+${habits.length - 4} more`}
          style={{
            fontSize: 12,
            color: '#666688',
            marginTop: 4,
          }}
        />
      )}
    </FlexWidget>
  );
}
