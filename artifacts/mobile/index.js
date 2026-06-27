import { registerRootComponent } from 'expo';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import App from './app/_layout';
import { ForgeHabitsWidget } from './widgets/ForgeHabitsWidget';

registerWidgetTaskHandler(async ({ widgetName, renderWidget }) => {
  if (widgetName === 'ForgeHabitsWidget') {
    await renderWidget(<ForgeHabitsWidget />);
  }
});

registerRootComponent(App);