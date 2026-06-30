 import React from 'react';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { ForgeHabitsWidget } from './widgets/Widget';

const widgetRegistry: Record<string, React.FC<any>> = {
  ForgeHabitsWidget,
};

registerWidgetTaskHandler((widgetInfo) => {
  const WidgetComponent = widgetRegistry[widgetInfo.widgetName];

  if (!WidgetComponent) {
    return null;
  }

  return <WidgetComponent widgetInfo={widgetInfo} />;
});
