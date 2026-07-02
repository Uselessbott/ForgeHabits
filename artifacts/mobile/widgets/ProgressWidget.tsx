import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

type Props = {
  completed: number;
  total: number;
  streak: number;
};

export function ProgressWidget({ completed, total, streak }: Props) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const color = percentage >= 80 ? '#4CAF50' : percentage >= 50 ? '#FF9800' : '#f44336';

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
      {/* Circle with percentage using border trick */}
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
          style={{
            fontSize: 22,
            fontWeight: 'bold',
            color: '#ffffff',
          }}
        />
      </FlexWidget>

      <TextWidget
        text={`${completed}/${total} habits`}
        style={{
          fontSize: 14,
          color: '#8888aa',
          marginTop: 8,
        }}
      />

      <TextWidget
        text={`🔥 ${streak} day streak`}
        style={{
          fontSize: 12,
          color: '#FF9800',
          marginTop: 4,
        }}
      />
    </FlexWidget>
  );
}
