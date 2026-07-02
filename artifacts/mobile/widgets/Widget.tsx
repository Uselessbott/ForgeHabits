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
        style={{ fontSize: 18, color: '#ffffff' }}
      />
      <TextWidget
        text="Add some habits!"
        style={{ fontSize: 14, color: '#666688', marginTop: 8 }}
      />
    </FlexWidget>
  );
}

// Main widget component
export function ForgeHabitsWidget(props: Props) {
  const { completed = 0, total = 0, habits = [], streak = 0, widgetType = 'combined' } = props;

  // If no habits, show empty state
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
          padding: 16,
        }}
      >
        <FlexWidget
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#16213e',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 6,
            borderColor: color,
          }}
        >
          <TextWidget
            text={`${percentage}%`}
            style={{ fontSize: 22, fontWeight: 'bold', color: '#ffffff' }}
          />
        </FlexWidget>
        <TextWidget
          text={`${completed}/${total} habits`}
          style={{ fontSize: 14, color: '#8888aa', marginTop: 8 }}
        />
        <TextWidget
          text={`🔥 ${streak} day streak`}
          style={{ fontSize: 12, color: '#FF9800', marginTop: 4 }}
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
          style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff', marginBottom: 8 }}
        />
        {displayHabits.map((habit) => (
          <FlexWidget
            key={habit.id}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 3 }}
          >
            <TextWidget
              text={habit.completed ? '✅' : '⬜'}
              style={{ fontSize: 14, marginRight: 8 }}
            />
            <TextWidget
              text={habit.name}
              style={{
                fontSize: 12,
                color: habit.completed ? '#4CAF50' : '#ffffff',
              }}
            />
          </FlexWidget>
        ))}
        {habits.length > 4 && (
          <TextWidget
            text={`+${habits.length - 4} more`}
            style={{ fontSize: 11, color: '#666688', marginTop: 2 }}
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
      {/* Progress row */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
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
            style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}
          />
        </FlexWidget>
        <FlexWidget style={{ flexDirection: 'column', marginLeft: 12 }}>
          <TextWidget
            text={`${completed}/${total} done`}
            style={{ fontSize: 14, color: '#ffffff' }}
          />
          <TextWidget
            text={`🔥 ${streak} day streak`}
            style={{ fontSize: 12, color: '#FF9800' }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Tasks list */}
      {displayHabits.map((habit) => (
        <FlexWidget
          key={habit.id}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 2 }}
        >
          <TextWidget
            text={habit.completed ? '✅' : '⬜'}
            style={{ fontSize: 13, marginRight: 8 }}
          />
          <TextWidget
            text={habit.name}
            style={{
              fontSize: 12,
              color: habit.completed ? '#4CAF50' : '#ffffff',
            }}
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
