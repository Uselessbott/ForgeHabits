import 'expo-router/entry';
import { registerWidgetTaskHandler, FlexWidget, TextWidget } from 'react-native-android-widget';

let tapCount = 0;

registerWidgetTaskHandler(async ({ widgetName, renderWidget, widgetAction, clickAction }: any) => {
  if (!widgetName.startsWith('ForgeHabits')) return;

  if (widgetAction === 'WIDGET_CLICK' && clickAction === 'BUMP') {
    tapCount++;
  }

  await renderWidget(
    <FlexWidget
      clickAction="BUMP"
      style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: '#00aa00',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
      }}
    >
      <TextWidget
        text="TAP ME"
        style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff' }}
      />
      <TextWidget
        text={`taps: ${tapCount}`}
        style={{ fontSize: 24, color: '#ffffff', marginTop: 8 }}
      />
    </FlexWidget>
  );
});
