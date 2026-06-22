import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useHabits } from '@/context/HabitsContext';

const SUGGESTED_EMOJIS = [
  '💪', '📚', '💰', '🧠', '🎥', '🏃', '🧘', '🥗', '😴',
  '💧', '📝', '🎯', '🎨', '🌱', '❤️', '🔥', '⚡', '🏆',
];

export default function CategoryFormScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const { categories, createCategory, updateCategory } = useHabits();

  const existing = categoryId ? categories.find(c => c.id === categoryId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? '🎯');

  const topInset = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomInset = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  function handleSave() {
    if (!name.trim()) return;
    if (existing) {
      updateCategory(existing.id, { name: name.trim(), emoji });
    } else {
      createCategory({ name: name.trim(), emoji });
    }
    router.back();
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 16, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {existing ? 'Edit Category' : 'New Category'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: name.trim() ? colors.primary : colors.border }]}
          activeOpacity={0.8}
          disabled={!name.trim()}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomInset + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Preview */}
        <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.previewEmoji}>{emoji}</Text>
          <Text style={[styles.previewName, { color: name ? colors.foreground : colors.mutedForeground }]}>
            {name || 'Category name'}
          </Text>
        </View>

        {/* Emoji Grid */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>ICON</Text>
        <View style={styles.emojiGrid}>
          {SUGGESTED_EMOJIS.map(e => (
            <TouchableOpacity
              key={e}
              onPress={() => setEmoji(e)}
              style={[
                styles.emojiBtn,
                {
                  backgroundColor: emoji === e ? colors.primary + '22' : colors.card,
                  borderColor: emoji === e ? colors.primary : colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.emojiText}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Name Input */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>NAME</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Fitness, Learning, Finance…"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.nameInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
          autoFocus={!existing}
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    marginBottom: 28,
  },
  previewEmoji: { fontSize: 30 },
  previewName: { fontSize: 20, fontFamily: 'Inter_600SemiBold' },
  label: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.2, marginBottom: 12 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 24 },
  nameInput: {
    fontSize: 17,
    fontFamily: 'Inter_500Medium',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
