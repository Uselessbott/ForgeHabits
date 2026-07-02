import { widget } from 'react-native-android-widget';
import { ForgeHabitsWidget } from './Widget';

// Widget class names matching Android
const WIDGET_CLASSES = {
  PROGRESS: 'com.forgehabits.app.widget.ProgressWidget',
  TASKS: 'com.forgehabits.app.widget.TasksWidget',
  COMBINED: 'com.forgehabits.app.widget.CombinedWidget',
};

// Register all 3 widget types
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

// Export for use in app
export { WIDGET_CLASSES };
