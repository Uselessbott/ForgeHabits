import React from "react";
import {
  FlexWidget,
  TextWidget,
  SvgWidget,
} from "react-native-android-widget";

type Habit = {
  id: string;
  name: string;
  done: boolean;
};

type WidgetInfo = {
  width: number;
  height: number;
};

const COLORS = {
  bg: "#080808",
  accent: "#FF6B35",
  accentDim: "#5A2D19",
  text: "#F0F0F0",
  subtext: "#969696",
};

function sizeBucket(widgetInfo: WidgetInfo) {
  const { width, height } = widgetInfo;
  if (width < 140 && height < 140) return "small";
  if (width < 200) return "medium";
  return "large";
}

function ringSvg(pct: number, size: number) {
  const stroke = Math.max(6, size * 0.09);
  const r = size / 2 - stroke;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * pct;
  return `
    <svg width="${size}" height="${size}">
      <circle cx="${c}" cy="${c}" r="${r}" stroke="${COLORS.accentDim}" stroke-width="${stroke}" fill="none" />
      <circle cx="${c}" cy="${c}" r="${r}" stroke="${COLORS.accent}" stroke-width="${stroke}" fill="none"
        stroke-dasharray="${dash} ${circumference}"
        stroke-linecap="round"
        transform="rotate(-90 ${c} ${c})" />
    </svg>
  `;
}

function openAppAction(target?: string) {
  return {
    clickAction: "OPEN_APP" as const,
    clickActionData: target ? { screen: target } : undefined,
  };
}

export function ProgressWidget({
  pct,
  widgetInfo,
}: {
  pct: number;
  widgetInfo: WidgetInfo;
}) {
  const bucket = sizeBucket(widgetInfo);
  const ringSize = bucket === "small" ? 64 : bucket === "medium" ? 84 : 110;

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: COLORS.bg,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 24,
      }}
      {...openAppAction("progress")}
    >
      <SvgWidget svg={ringSvg(pct, ringSize)} style={{ width: ringSize, height: ringSize }} />
      <TextWidget
        text={`${Math.round(pct * 100)}%`}
        style={{
          fontSize: bucket === "small" ? 14 : bucket === "medium" ? 18 : 22,
          color: COLORS.text,
          fontWeight: "bold",
          marginTop: bucket === "small" ? -ringSize * 0.55 : -ringSize * 0.5,
        }}
      />
    </FlexWidget>
  );
}

export function TasksWidget({
  habits,
  widgetInfo,
}: {
  habits: Habit[];
  widgetInfo: WidgetInfo;
}) {
  const bucket = sizeBucket(widgetInfo);
  const maxRows = bucket === "small" ? 3 : bucket === "medium" ? 5 : 8;
  const visible = habits.slice(0, maxRows);
  const fontSize = bucket === "small" ? 12 : bucket === "medium" ? 14 : 16;

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: COLORS.bg,
        padding: 12,
        flexDirection: "column",
        borderRadius: 24,
      }}
      {...openAppAction("tasks")}
    >
      <TextWidget
        text="Today"
        style={{ fontSize: fontSize + 4, color: COLORS.text, fontWeight: "bold", marginBottom: 6 }}
      />
      {visible.map((h) => (
        <FlexWidget
          key={h.id}
          style={{ flexDirection: "row", alignItems: "center", marginVertical: 3 }}
          clickAction="TOGGLE_HABIT"
          clickActionData={{ habitId: h.id }}
        >
          <FlexWidget
            style={{
              width: fontSize,
              height: fontSize,
              borderRadius: 4,
              backgroundColor: h.done ? COLORS.accent : "transparent",
              borderColor: h.done ? COLORS.accent : COLORS.subtext,
              borderWidth: h.done ? 0 : 2,
              marginRight: 8,
            }}
          />
          <TextWidget
            text={h.name}
            style={{ fontSize, color: h.done ? COLORS.subtext : COLORS.text }}
          />
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}

export function CombinedWidget({
  pct,
  habits,
  widgetInfo,
}: {
  pct: number;
  habits: Habit[];
  widgetInfo: WidgetInfo;
}) {
  const bucket = sizeBucket(widgetInfo);
  const ringSize = bucket === "small" ? 56 : bucket === "medium" ? 72 : 90;
  const maxRows = bucket === "small" ? 2 : bucket === "medium" ? 3 : 4;
  const fontSize = bucket === "small" ? 11 : bucket === "medium" ? 13 : 15;

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: COLORS.bg,
        flexDirection: "row",
        padding: 12,
        borderRadius: 24,
      }}
      {...openAppAction("combined")}
    >
      <FlexWidget style={{ justifyContent: "center", alignItems: "center", marginRight: 12 }}>
        <SvgWidget svg={ringSvg(pct, ringSize)} style={{ width: ringSize, height: ringSize }} />
        <TextWidget
          text={`${Math.round(pct * 100)}%`}
          style={{ fontSize: fontSize + 1, color: COLORS.text, fontWeight: "bold", marginTop: -ringSize * 0.5 }}
        />
      </FlexWidget>
      <FlexWidget style={{ flexDirection: "column", flex: 1, justifyContent: "center" }}>
        {habits.slice(0, maxRows).map((h) => (
          <FlexWidget
            key={h.id}
            style={{ flexDirection: "row", alignItems: "center", marginVertical: 2 }}
            clickAction="TOGGLE_HABIT"
            clickActionData={{ habitId: h.id }}
          >
            <FlexWidget
              style={{
                width: fontSize,
                height: fontSize,
                borderRadius: 3,
                backgroundColor: h.done ? COLORS.accent : "transparent",
                borderColor: h.done ? COLORS.accent : COLORS.subtext,
                borderWidth: h.done ? 0 : 2,
                marginRight: 6,
              }}
            />
            <TextWidget text={h.name} style={{ fontSize, color: h.done ? COLORS.subtext : COLORS.text }} />
          </FlexWidget>
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}

export function HeatmapWidget({
  levels,
  widgetInfo,
}: {
  levels: number[][];
  widgetInfo: WidgetInfo;
}) {
  const bucket = sizeBucket(widgetInfo);
  const cellSize = bucket === "small" ? 8 : bucket === "medium" ? 10 : 12;
  const gap = cellSize * 0.25;
  const shades = [COLORS.accentDim, "#965A2A", "#C85A28", COLORS.accent];

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: COLORS.bg,
        padding: 10,
        flexDirection: "column",
        borderRadius: 24,
      }}
    >
      {levels.map((row, ri) => (
        <FlexWidget key={ri} style={{ flexDirection: "row", marginBottom: gap }}>
          {row.map((lvl, ci) => (
            <FlexWidget
              key={ci}
              style={{
                width: cellSize,
                height: cellSize,
                marginRight: gap,
                borderRadius: cellSize * 0.2,
                backgroundColor: shades[Math.max(0, Math.min(3, lvl))],
              }}
            />
          ))}
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}
