import React from 'react';
import { AppRegistry } from 'react-native';
import { widget } from 'react-native-android-widget';
import { ProgressWidget } from './ProgressWidget';
import { TasksWidget } from './TasksWidget';
import { ProgressTasksWidget } from './ProgressTasksWidget';
import { WIDGET_CLASS, WidgetData, WIDGET_IDS } from './widget-config';

// Register all 3 widget types
widget.registerWidget(ProgressWidget, { 
  widgetName: 'ProgressWidget', 
  widgetClass: WIDGET_CLASS 
});

widget.registerWidget(TasksWidget, { 
  widgetName: 'TasksWidget', 
  widgetClass: WIDGET_CLASS 
});

widget.registerWidget(ProgressTasksWidget, { 
  widgetName: 'ProgressTasksWidget', 
  widgetClass: WIDGET_CLASS 
});

// Update functions for each widget type
export function updateProgressWidget(data: WidgetData) {
  return widget.updateWidget({
    widgetName: 'ProgressWidget',
    widgetClass: WIDGET_CLASS,
    renderWidget: () => (
      <ProgressWidget 
        completed={data.completedHabits} 
        total={data.totalHabits} 
      />
    ),
  });
}

export function updateTasksWidget(data: WidgetData) {
  return widget.updateWidget({
    widgetName: 'TasksWidget',
    widgetClass: WIDGET_CLASS,
    renderWidget: () => (
      <TasksWidget 
        habits={data.habits} 
        completed={data.completedHabits} 
        total={data.totalHabits} 
      />
    ),
  });
}

export function updateProgressTasksWidget(data: WidgetData) {
  return widget.updateWidget({
    widgetName: 'ProgressTasksWidget',
    widgetClass: WIDGET_CLASS,
    renderWidget: () => (
      <ProgressTasksWidget 
        completed={data.completedHabits} 
        total={data.totalHabits} 
        habits={data.habits} 
      />
    ),
  });
}

// Update all 3 widgets
export function updateAllWidgets(data: WidgetData) {
  updateProgressWidget(data);
  updateTasksWidget(data);
  updateProgressTasksWidget(data);
}
