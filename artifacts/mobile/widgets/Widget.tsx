import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

type Props = {
  completed?: number;
  total?: number;
  remaining?: number;
  streak?: number;
};

export function ForgeHabitsWidget({
  completed = 0,
  total = 0,
  remaining = 0,
  streak = 0,
}: Props) {
  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: '#000000',
        justifyContent: 'center',
        padding: 16,
      }}>
      <TextWidget
        text="🔥 ForgeHabits"
        style={{
          fontSize: 18,
          color: '#ffffff',
        }}
      />

      <TextWidget
        text={`Completed: ${completed}/${total}`}
        style={{
          fontSize: 14,
          color: '#ffffff',
          marginTop: 8,
        }}
      />

      <TextWidget
        text={`Remaining: ${remaining}`}
        style={{
          fontSize: 14,
          color: '#ffffff',
          marginTop: 4,
        }}
      />

      <TextWidget
        text={`🔥 Streak: ${streak}`}
        style={{
          fontSize: 14,
          color: '#ffffff',
          marginTop: 4,
        }}
      />
    </FlexWidget>
  );
}
