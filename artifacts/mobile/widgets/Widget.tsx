import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface ForgeHabitsWidgetProps {
  completed?: number;
  total?: number;
  streak?: number;
  remaining?: number;
}

export function ForgeHabitsWidget({
  completed = 0,
  total = 0,
  streak = 0,
  remaining = 0,
}: ForgeHabitsWidgetProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone = total > 0 && completed >= total;

  const progressBar = total > 0
    ? Array.from({ length: 10 }, (_, i) =>
        i < Math.round((completed / total) * 10) ? '█' : '░'
      ).join('')
    : '░░░░░░░░░░';

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#0f0f0f',
        borderRadius: 20,
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 16,
      }}
    >
      {/* Header */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <TextWidget
          text="🔥 ForgeHabits"
          style={{
            fontSize: 14,
            color: '#FF6B00',
            fontFamily: 'sans-serif-medium',
          }}
        />
        {streak > 0 && (
          <TextWidget
            text={`${streak} day streak`}
            style={{
              fontSize: 11,
              color: '#888888',
              fontFamily: 'sans-serif',
            }}
          />
        )}
      </FlexWidget>

      {/* Main stat */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        <TextWidget
          text={allDone ? '✅ All done!' : `${completed} / ${total}`}
          style={{
            fontSize: 28,
            color: allDone ? '#22c55e' : '#FFFFFF',
            fontFamily: 'sans-serif-medium',
          }}
        />
        <TextWidget
          text={
            total === 0
              ? 'No habits today'
              : allDone
              ? 'Outstanding discipline.'
              : `${remaining} remaining · ${percentage}%`
          }
          style={{
            fontSize: 12,
            color: '#888888',
            fontFamily: 'sans-serif',
          }}
        />
      </FlexWidget>

      {/* Progress bar */}
      {total > 0 && (
        <TextWidget
          text={progressBar}
          style={{
            fontSize: 12,
            color: allDone ? '#22c55e' : '#FF6B00',
            fontFamily: 'monospace',
          }}
        />
      )}
    </FlexWidget>
  );
}
