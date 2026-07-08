import React from 'react';
import { FlexWidget, TextWidget, ListWidget } from 'react-native-android-widget';

type HabitItem = {
  id: string;
  name: string;
  completed: boolean;
};

type HistoryDay = {
  date: string;
  pct: number;
  hasData: boolean;
};

type Props = {
  completed?: number;
  total?: number;
  remaining?: number;
  streak?: number;
  habits?: HabitItem[];
  widgetType?: 'progress' | 'tasks' | 'combined' | 'heatmap';
  history?: HistoryDay[];
  width?: number;
  height?: number;
};

// Buckets based on props.widgetInfo.width/height (dp) from the task handler.
// Calls that don't have live dimensions (e.g. HabitsContext refreshWidget)
// fall back to 'large' via the defaults below.
function sizeBucket(width: number, height: number): 'small' | 'medium' | 'large' {
  if (width < 140 && height < 140) return 'small';
  if (width < 200) return 'medium';
  return 'large';
}

const BG = '#080808';
const ACCENT = '#FF6B35';
const ACCENT_DIM = '#5A2D19';
const TEXT = '#F0F0F0';
const SUBTEXT = '#969696';

function EmptyWidget() {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: BG,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
      }}
    >
      <TextWidget text="ForgeHabits" style={{ fontSize: 16, color: TEXT }} />
      <TextWidget
        text="Add some habits!"
        style={{ fontSize: 12, color: SUBTEXT, marginTop: 6 }}
      />
    </FlexWidget>
  );
}

function heatmapColor(day: HistoryDay): string {
  if (!day.hasData) return '#1c1c1c';
  if (day.pct <= 0) return ACCENT_DIM;
  if (day.pct < 0.34) return '#8A4526';
  if (day.pct < 0.67) return '#C2552B';
  return ACCENT;
}

function Checkbox({ done, size = 16 }: { done: boolean; size?: number }) {
  return (
    <FlexWidget
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.25,
        backgroundColor: done ? ACCENT : 'transparent',
        borderColor: done ? ACCENT : SUBTEXT,
        borderWidth: done ? 0 : 2,
        marginRight: 8,
      }}
    />
  );
}

export function ForgeHabitsWidget(props: Props) {
  const { completed = 0, total = 0, habits = [], streak = 0, widgetType = 'combined', history = [], width = 250, height = 180 } = props;
  const bucket = sizeBucket(width, height);

  if (widgetType === 'heatmap') {
    const weeks: HistoryDay[][] = [];
    for (let i = 0; i < history.length; i += 7) {
      weeks.push(history.slice(i, i + 7));
    }

    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          width: 'match_parent',
          height: 'match_parent',
          backgroundColor: BG,
          borderRadius: 24,
          padding: 12,
          flexDirection: 'column',
        }}
      >
        <TextWidget
          text={`${streak} day streak`}
          style={{ fontSize: 12, fontWeight: 'bold', color: TEXT, marginBottom: 6 }}
        />
        <FlexWidget style={{ flexDirection: 'row' }}>
          {weeks.map((week, wi) => (
            <FlexWidget key={`w${wi}`} style={{ flexDirection: 'column', marginRight: 3 }}>
              {week.map((day) => (
                <FlexWidget
                  key={day.date}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    backgroundColor: heatmapColor(day),
                    marginBottom: 3,
                  }}
                />
              ))}
            </FlexWidget>
          ))}
        </FlexWidget>
      </FlexWidget>
    );
  }

  if (total === 0) {
    return <EmptyWidget />;
  }

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (widgetType === 'progress') {
    const ringSize = bucket === 'small' ? 48 : bucket === 'medium' ? 56 : 64;
    const pctFontSize = bucket === 'small' ? 13 : bucket === 'medium' ? 14 : 16;
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          width: 'match_parent',
          height: 'match_parent',
          backgroundColor: BG,
          borderRadius: 24,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 10,
        }}
      >
        <FlexWidget
          style={{
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            backgroundColor: BG,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: Math.max(4, ringSize * 0.09),
            borderColor: ACCENT,
          }}
        >
          <TextWidget text={`${percentage}%`} style={{ fontSize: pctFontSize, fontWeight: 'bold', color: TEXT }} />
        </FlexWidget>
        <TextWidget text={`${completed}/${total} habits`} style={{ fontSize: 11, color: SUBTEXT, marginTop: 6 }} />
        {bucket !== 'small' && (
          <TextWidget text={`${streak} day streak`} style={{ fontSize: 10, color: ACCENT, marginTop: 2 }} />
        )}
      </FlexWidget>
    );
  }

  if (widgetType === 'tasks') {
    return (
      <FlexWidget
        style={{
          width: 'match_parent',
          height: 'match_parent',
          backgroundColor: BG,
          borderRadius: 24,
          padding: 12,
          flexDirection: 'column',
        }}
      >
        <TextWidget
          text={`Today (${completed}/${total})`}
          style={{ fontSize: bucket === 'small' ? 11 : 13, fontWeight: 'bold', color: TEXT, marginBottom: 6 }}
        />
        <ListWidget style={{ flex: 1, width: 'match_parent' }}>
          {habits.map((habit) => (
            <FlexWidget
              key={habit.id}
              clickAction="OPEN_APP"
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, width: 'match_parent' }}
            >
              <Checkbox done={habit.completed} size={bucket === 'small' ? 13 : 16} />
              <TextWidget text={habit.name} style={{ fontSize: bucket === 'small' ? 11 : 12, color: habit.completed ? SUBTEXT : TEXT }} />
            </FlexWidget>
          ))}
        </ListWidget>
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: BG,
        borderRadius: 24,
        padding: 12,
        flexDirection: 'column',
      }}
    >
      <FlexWidget clickAction="OPEN_APP" style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <FlexWidget
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: BG,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 5,
            borderColor: ACCENT,
          }}
        >
          <TextWidget text={`${percentage}%`} style={{ fontSize: 12, fontWeight: 'bold', color: TEXT }} />
        </FlexWidget>
        <FlexWidget style={{ flexDirection: 'column', marginLeft: 10 }}>
          <TextWidget text={`${completed}/${total} done`} style={{ fontSize: 13, color: TEXT }} />
          <TextWidget text={`${streak} day streak`} style={{ fontSize: 11, color: ACCENT }} />
        </FlexWidget>
      </FlexWidget>

      <ListWidget style={{ flex: 1, width: 'match_parent' }}>
        {habits.map((habit) => (
          <FlexWidget
            key={habit.id}
            clickAction="OPEN_APP"
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 3, width: 'match_parent' }}
          >
            <Checkbox done={habit.completed} size={14} />
            <TextWidget text={habit.name} style={{ fontSize: 12, color: habit.completed ? SUBTEXT : TEXT }} />
          </FlexWidget>
        ))}
      </ListWidget>
    </FlexWidget>
  );
}
