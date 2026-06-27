import 'expo-router/entry';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

registerWidgetTaskHandler(async ({ widgetName, renderWidget }) => {
  if (widgetName === 'ForgeHabitsWidget') {
    const { ForgeHabitsWidget } = require('./widgets/Widget.tsx');
    await renderWidget(<ForgeHabitsWidget />);
  }
});
