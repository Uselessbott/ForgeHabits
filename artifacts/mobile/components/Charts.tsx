import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Rect, Line, Text as SvgText, Path, Circle, Defs, LinearGradient, Stop, G,
} from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

// ─────────────────────────────────────────────────────────────────
// 7-Day Bar Chart
// ─────────────────────────────────────────────────────────────────
interface BarDay {
  label: string;   // e.g. "Mon"
  pct: number;     // 0-100
  isToday: boolean;
  hasHabits: boolean;
}

interface WeeklyBarChartProps {
  data: BarDay[];
  height?: number;
}

export function WeeklyBarChart({ data, height = 160 }: WeeklyBarChartProps) {
  const colors = useColors();
  const paddingH = 12;
  const paddingTop = 12;
  const paddingBottom = 36;
  const chartH = height - paddingTop - paddingBottom;
  const width = 320;
  const barCount = data.length;
  const gap = 8;
  const barW = (width - paddingH * 2 - gap * (barCount - 1)) / barCount;

  function barColor(pct: number, hasHabits: boolean, isToday: boolean): string {
    if (!hasHabits) return colors.border;
    if (isToday && pct === 0) return colors.primary + '44';
    if (pct === 0) return colors.destructive + '66';
    if (pct < 50) return colors.warning + 'CC';
    if (pct < 100) return colors.primary + 'CC';
    return colors.success;
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={width} height={height} style={{ overflow: 'visible' }}>
        {/* Horizontal guide lines */}
        {[0, 25, 50, 75, 100].map(pct => {
          const y = paddingTop + chartH - (pct / 100) * chartH;
          return (
            <G key={pct}>
              <Line
                x1={paddingH}
                y1={y}
                x2={width - paddingH}
                y2={y}
                stroke={colors.border}
                strokeWidth={0.5}
                strokeDasharray={pct === 0 ? '0' : '3,3'}
              />
              {pct > 0 && (
                <SvgText
                  x={paddingH - 4}
                  y={y + 4}
                  fontSize={9}
                  fill={colors.mutedForeground}
                  textAnchor="end"
                >
                  {pct}
                </SvgText>
              )}
            </G>
          );
        })}

        {/* Bars */}
        {data.map((day, i) => {
          const x = paddingH + i * (barW + gap);
          const barH = Math.max(4, (day.pct / 100) * chartH);
          const y = paddingTop + chartH - barH;
          const fill = barColor(day.pct, day.hasHabits, day.isToday);

          return (
            <G key={i}>
              {/* Bar background (empty track) */}
              <Rect
                x={x}
                y={paddingTop}
                width={barW}
                height={chartH}
                rx={6}
                fill={colors.border + '44'}
              />
              {/* Bar fill */}
              <Rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={6}
                fill={fill}
              />
              {/* Today indicator */}
              {day.isToday && (
                <Rect
                  x={x}
                  y={paddingTop + chartH + 6}
                  width={barW}
                  height={3}
                  rx={1.5}
                  fill={colors.primary}
                />
              )}
              {/* Day label */}
              <SvgText
                x={x + barW / 2}
                y={paddingTop + chartH + 24}
                fontSize={11}
                fontWeight={day.isToday ? 'bold' : 'normal'}
                fill={day.isToday ? colors.primary : colors.mutedForeground}
                textAnchor="middle"
              >
                {day.label}
              </SvgText>
              {/* % label on top of bar if space */}
              {day.hasHabits && day.pct > 0 && (
                <SvgText
                  x={x + barW / 2}
                  y={y - 4}
                  fontSize={9}
                  fill={colors.mutedForeground}
                  textAnchor="middle"
                >
                  {day.pct}%
                </SvgText>
              )}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Monthly Line Chart
// ─────────────────────────────────────────────────────────────────
interface LinePoint {
  day: number;
  pct: number;
  hasHabits: boolean;
}

interface MonthlyLineChartProps {
  data: LinePoint[];
  height?: number;
}

export function MonthlyLineChart({ data, height = 140 }: MonthlyLineChartProps) {
  const colors = useColors();
  const paddingH = 24;
  const paddingTop = 12;
  const paddingBottom = 28;
  const chartH = height - paddingTop - paddingBottom;
  const width = 320;
  const chartW = width - paddingH * 2;
  const activeData = data.filter(d => d.hasHabits);

  if (activeData.length === 0) return null;

  const maxDay = data[data.length - 1]?.day ?? 1;

  function xPos(day: number): number {
    return paddingH + ((day - 1) / Math.max(1, maxDay - 1)) * chartW;
  }
  function yPos(pct: number): number {
    return paddingTop + chartH - (pct / 100) * chartH;
  }

  // Build path
  const pathPoints = activeData.map(d => `${xPos(d.day)},${yPos(d.pct)}`);
  const linePath = `M ${pathPoints.join(' L ')}`;

  // Area fill path (close to bottom)
  const firstX = xPos(activeData[0].day);
  const lastX = xPos(activeData[activeData.length - 1].day);
  const areaPath = `M ${firstX},${yPos(activeData[0].pct)} L ${pathPoints.slice(1).join(' L ')} L ${lastX},${paddingTop + chartH} L ${firstX},${paddingTop + chartH} Z`;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={width} height={height} style={{ overflow: 'visible' }}>
        <Defs>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.primary} stopOpacity={0.3} />
            <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Guide lines */}
        {[0, 50, 100].map(pct => (
          <G key={pct}>
            <Line
              x1={paddingH}
              y1={yPos(pct)}
              x2={width - paddingH}
              y2={yPos(pct)}
              stroke={colors.border}
              strokeWidth={0.5}
              strokeDasharray={pct === 0 ? '0' : '3,3'}
            />
            <SvgText
              x={paddingH - 4}
              y={yPos(pct) + 4}
              fontSize={9}
              fill={colors.mutedForeground}
              textAnchor="end"
            >
              {pct}
            </SvgText>
          </G>
        ))}

        {/* Area fill */}
        <Path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <Path d={linePath} stroke={colors.primary} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {activeData.map((d, i) => (
          <Circle
            key={i}
            cx={xPos(d.day)}
            cy={yPos(d.pct)}
            r={3}
            fill={d.pct === 100 ? colors.success : d.pct > 0 ? colors.primary : colors.destructive}
            stroke={colors.background}
            strokeWidth={1}
          />
        ))}

        {/* X-axis day labels (every 5 days) */}
        {[1, 5, 10, 15, 20, 25, maxDay].map(d => {
          if (d > maxDay) return null;
          return (
            <SvgText
              key={d}
              x={xPos(d)}
              y={height - 6}
              fontSize={9}
              fill={colors.mutedForeground}
              textAnchor="middle"
            >
              {d}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Streak Bar (horizontal)
// ─────────────────────────────────────────────────────────────────
interface StreakBarProps {
  label: string;
  emoji: string;
  value: number;
  max: number;
  color: string;
}

export function StreakBar({ label, emoji, value, max, color }: StreakBarProps) {
  const colors = useColors();
  const pct = max > 0 ? Math.min(1, value / max) : 0;

  return (
    <View style={sbStyles.row}>
      <Text style={sbStyles.emoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <View style={sbStyles.labelRow}>
          <Text style={[sbStyles.label, { color: colors.foreground }]} numberOfLines={1}>{label}</Text>
          <Text style={[sbStyles.val, { color: color }]}>🔥 {value}</Text>
        </View>
        <View style={[sbStyles.track, { backgroundColor: colors.border }]}>
          <View style={[sbStyles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
}

const sbStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  emoji: { fontSize: 20, width: 28, textAlign: 'center' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1 },
  val: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});

// ─────────────────────────────────────────────────────────────────
// Day-of-week Heatmap (which weekdays you complete most)
// ─────────────────────────────────────────────────────────────────
interface DayOfWeekData {
  label: string;
  pct: number;
  count: number;
}

interface DayOfWeekChartProps {
  data: DayOfWeekData[];
}

export function DayOfWeekChart({ data }: DayOfWeekChartProps) {
  const colors = useColors();
  const width = 320;
  const paddingH = 24;
  const barH = 28;
  const gap = 6;
  const chartW = width - paddingH * 2 - 30;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={width} height={data.length * (barH + gap) + 8} style={{ overflow: 'visible' }}>
        {data.map((d, i) => {
          const y = i * (barH + gap);
          const fillW = Math.max(4, (d.pct / 100) * chartW);
          const barColor =
            d.pct >= 80 ? colors.success
            : d.pct >= 50 ? colors.primary
            : d.pct >= 20 ? colors.warning
            : colors.destructive + '88';

          return (
            <G key={i}>
              <SvgText
                x={paddingH - 4}
                y={y + barH / 2 + 5}
                fontSize={11}
                fill={colors.mutedForeground}
                textAnchor="end"
              >
                {d.label.slice(0, 3)}
              </SvgText>
              <Rect
                x={paddingH}
                y={y}
                width={chartW}
                height={barH}
                rx={6}
                fill={colors.border + '44'}
              />
              <Rect
                x={paddingH}
                y={y}
                width={fillW}
                height={barH}
                rx={6}
                fill={barColor}
              />
              <SvgText
                x={paddingH + chartW + 8}
                y={y + barH / 2 + 5}
                fontSize={11}
                fill={colors.mutedForeground}
                textAnchor="start"
              >
                {d.pct}%
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
