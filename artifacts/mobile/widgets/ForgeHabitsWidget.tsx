import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export function ForgeHabitsWidget() {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#080808',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <TextWidget
        text="🔥 ForgeHabits"
        style={{
          fontSize: 18,
          color: '#FFFFFF',
          fontFamily: 'sans-serif-medium',
        }}
      />
      <TextWidget
        text="Tap to track habits"
        style={{
          fontSize: 12,
          color: '#888888',
          fontFamily: 'sans-serif',
        }}
      />
    </FlexWidget>
  );
}
