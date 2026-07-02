import { widget } from 'react-native-android-widget';
import { ForgeHabitsWidget } from './Widget';

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

export { WIDGET_CLASSES };
