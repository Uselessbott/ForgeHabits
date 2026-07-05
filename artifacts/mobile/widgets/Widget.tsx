import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

type HabitItem = {
  id: string;
  name: string;
  completed: boolean;
};

type Props = {
  completed?: number;
  total?: number;
  remaining?: number;
  streak?: number;
  habits?: HabitItem[];
  widgetType?: 'progress' | 'tasks' | 'combined';
};

// Simple fallback widget
function EmptyWidget() {
  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
      }}
    >
      <TextWidget
        text="🔥 ForgeHabits"
        style={{ fontSize: 16, color: '#ffffff' }}
      />
      <TextWidget
        text="Add some habits!"
        style={{ fontSize: 12, color: '#666688', marginTop: 6 }}
      />
    </FlexWidget>
  );
}

// Main widget component
export function ForgeHabitsWidget(props: Props) {
  const { completed = 0, total = 0, habits = [], streak = 0, widgetType = 'combined' } = props;

  if (total === 0) {
    return <EmptyWidget />;
  }

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const color = percentage >= 80 ? '#4CAF50' : percentage >= 50 ? '#FF9800' : '#f44336';
  const displayHabits = habits.slice(0, widgetType === 'tasks' ? 4 : 3);

  // Progress widget
  if (widgetType === 'progress') {
    return (
      <FlexWidget
        style={{
          width: 'match_parent',
          height: 'match_parent',
          backgroundColor: '#1a1a2e',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 10,
        }}
      >
        <FlexWidget
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: '#16213e',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 5,
            borderColor: color,
          }}
        >
          <TextWidget
            text={`${percentage}%`}
            style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff' }}
          />
        </FlexWidget>
        <TextWidget
          text={`${completed}/${total} habits`}
          style={{ fontSize: 11, color: '#8888aa', marginTop: 6 }}
        />
        <TextWidget
          text={`🔥 ${streak} day streak`}
          style={{ fontSize: 10, color: '#FF9800', marginTop: 2 }}
        />
      </FlexWidget>
    );
  }

  // Tasks widget
  if (widgetType === 'tasks') {
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
          text={`📋 Today (${completed}/${total})`}
          style={{ fontSize: 13, fontWeight: 'bold', color: '#ffffff', marginBottom: 6 }}
        />
        {displayHabits.map((habit) => (
          <FlexWidget
            key={habit.id}
            clickAction="TOGGLE_HABIT"
            clickActionData={{ habitId: habit.id }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 3 }}
          >
            <TextWidget
              text={habit.completed ? '✅' : '⬜'}
              style={{ fontSize: 13, marginRight: 8 }}
            />
            <TextWidget
              text={habit.name}
              style={{ fontSize: 12, color: habit.completed ? '#4CAF50' : '#ffffff' }}
            />
          </FlexWidget>
        ))}
        {habits.length > 4 && (
          <TextWidget
            text={`+${habits.length - 4} more`}
            style={{ fontSize: 10, color: '#666688', marginTop: 2 }}
          />
        )}
      </FlexWidget>
    );
  }

  // Combined widget (default)
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
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <FlexWidget
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#16213e',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 4,
            borderColor: color,
          }}
        >
          <TextWidget
            text={`${percentage}%`}
            style={{ fontSize: 12, fontWeight: 'bold', color: '#ffffff' }}
          />
        </FlexWidget>
        <FlexWidget style={{ flexDirection: 'column', marginLeft: 10 }}>
          <TextWidget
            text={`${completed}/${total} done`}
            style={{ fontSize: 13, color: '#ffffff' }}
          />
          <TextWidget
            text={`🔥 ${streak} day streak`}
            style={{ fontSize: 11, color: '#FF9800' }}
          />
        </FlexWidget>
      </FlexWidget>

      {displayHabits.map((habit) => (
        <FlexWidget
          key={habit.id}
          clickAction="TOGGLE_HABIT"
          clickActionData={{ habitId: habit.id }}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 2 }}
        >
          <TextWidget
            text={habit.completed ? '✅' : '⬜'}
            style={{ fontSize: 13, marginRight: 8 }}
          />
          <TextWidget
            text={habit.name}
            style={{ fontSize: 12, color: habit.completed ? '#4CAF50' : '#ffffff' }}
          />
        </FlexWidget>
      ))}
      {habits.length > 3 && (
        <TextWidget
          text={`+${habits.length - 3} more`}
          style={{ fontSize: 10, color: '#666688', marginTop: 2 }}
        />
      )}
    </FlexWidget>
  );
}
