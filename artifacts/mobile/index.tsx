import 'expo-router/entry';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

registerWidgetTaskHandler(async ({ renderWidget }) => {
  const { ForgeHabitsWidget } = require('./widgets/Widget');
  renderWidget(<ForgeHabitsWidget />);
});
