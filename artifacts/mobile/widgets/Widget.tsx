import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export function ForgeHabitsWidget() {
  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <TextWidget
        text="ForgeHabits Widget"
        style={{
          fontSize: 18,
          color: '#ffffff',
        }}
      />
    </FlexWidget>
  );
}
