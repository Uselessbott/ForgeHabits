import React, { useEffect } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { HabitsProvider } from './context/HabitsContext';
import { HomeScreen } from './screens/HomeScreen';
import { widget } from 'react-native-android-widget';
import { ForgeHabitsWidget } from './widgets/Widget';
import { WIDGET_CLASSES } from './widgets/index';

export default function App() {
  useEffect(() => {
    try {
      widget.registerWidget(ForgeHabitsWidget, {
        widgetName: 'ForgeHabitsProgress',
        widgetClass: WIDGET_CLASSES.PROGRESS,
      });
      widget.registerWidget(ForgeHabitsWidget, {
        widgetName: 'ForgeHabitsTasks',
        widgetClass: WIDGET_CLASSES.TASKS,
      });
      widget.registerWidget(ForgeHabitsWidget, {
        widgetName: 'ForgeHabitsCombined',
        widgetClass: WIDGET_CLASSES.COMBINED,
      });
    } catch (error) {
      console.log('Widget registration error:', error);
    }
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a2e' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <HabitsProvider>
        <HomeScreen />
      </HabitsProvider>
    </SafeAreaView>
  );
}
