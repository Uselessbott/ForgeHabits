import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import {
  ProgressWidget,
  TasksWidget,
  CombinedWidget,
  HeatmapWidget,
} from "./Widget";

async function getHabits() {
  return [
    { id: "1", name: "Meditate", done: true },
    { id: "2", name: "Read 20 min", done: true },
    { id: "3", name: "Workout", done: false },
    { id: "4", name: "Journal", done: false },
  ];
}

async function getProgressPct() {
  const habits = await getHabits();
  const done = habits.filter((h) => h.done).length;
  return habits.length ? done / habits.length : 0;
}

async function getHeatmapLevels(): Promise<number[][]> {
  const rows = 5;
  const cols = 20;
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.floor(Math.random() * 4))
  );
}

function getWidgetInfoFromProps(props: WidgetTaskHandlerProps) {
  const info = (props.widgetInfo as any) ?? {};
  return {
    width: info.width ?? 250,
    height: info.height ?? 180,
  };
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = getWidgetInfoFromProps(props);
  const widgetName = props.widgetInfo?.widgetName;

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED":
      switch (widgetName) {
        case "ForgeHabitsProgress": {
          const pct = await getProgressPct();
          props.renderWidget(<ProgressWidget pct={pct} widgetInfo={widgetInfo} />);
          break;
        }
        case "ForgeHabitsTasks": {
          const habits = await getHabits();
          props.renderWidget(<TasksWidget habits={habits} widgetInfo={widgetInfo} />);
          break;
        }
        case "ForgeHabitsCombined": {
          const [pct, habits] = await Promise.all([getProgressPct(), getHabits()]);
          props.renderWidget(
            <CombinedWidget pct={pct} habits={habits} widgetInfo={widgetInfo} />
          );
          break;
        }
        case "ForgeHabitsHeatmap": {
          const levels = await getHeatmapLevels();
          props.renderWidget(<HeatmapWidget levels={levels} widgetInfo={widgetInfo} />);
          break;
        }
        default:
          break;
      }
      break;

    case "WIDGET_CLICK": {
      const clickData = (props as any).clickActionData;
      if (clickData?.habitId) {
        switch (widgetName) {
          case "ForgeHabitsTasks": {
            const habits = await getHabits();
            props.renderWidget(<TasksWidget habits={habits} widgetInfo={widgetInfo} />);
            break;
          }
          case "ForgeHabitsCombined": {
            const [pct, habits] = await Promise.all([getProgressPct(), getHabits()]);
            props.renderWidget(
              <CombinedWidget pct={pct} habits={habits} widgetInfo={widgetInfo} />
            );
            break;
          }
          default:
            break;
        }
      }
      break;
    }

    default:
      break;
  }
}
