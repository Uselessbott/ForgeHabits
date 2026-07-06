import 'expo-router/entry';
import { registerWidgetTaskHandler, FlexWidget, TextWidget } from 'react-native-android-widget';

// Maximally minimal diagnostic handler: no AsyncStorage, no async work,
// no click handling — just render static hardcoded content synchronously.
// If this still shows blank/transparent, the problem is in the render
// pipeline itself, not in our app logic.
registerWidgetTaskHandler(async ({ widgetName, renderWidget }) => {
  if (!widgetName.startsWith('ForgeHabits')) return;

  await renderWidget(
    <FlexWidget
      style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: '#ff00ff',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
      }}
    >
      <TextWidget
        text="TEST WORKING"
        style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff' }}
      />
      <TextWidget
        text={widgetName}
        style={{ fontSize: 12, color: '#ffffff', marginTop: 8 }}
      />
    </FlexWidget>
  );
});
