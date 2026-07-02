import React from 'react';
import { View, Text } from 'react-native';
import { Widget } from 'react-native-android-widget';

interface ProgressWidgetProps {
  completed: number;
  total: number;
}

export function ProgressWidget({ completed, total }: ProgressWidgetProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Widget>
      <View style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
      }}>
        {/* Circular progress - using simple text for now */}
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#16213e',
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 4,
          borderColor: percentage > 50 ? '#4CAF50' : '#FF9800',
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#ffffff',
          }}>
            {percentage}%
          </Text>
        </View>
        <Text style={{
          marginTop: 8,
          fontSize: 14,
          color: '#8888aa',
        }}>
          {completed}/{total} habits
        </Text>
      </View>
    </Widget>
  );
}
