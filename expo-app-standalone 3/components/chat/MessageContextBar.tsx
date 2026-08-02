/**
 * MessageContextBar
 *
 * WhatsApp-style bottom bar that replaces the chat input when a message is
 * long-pressed. Shows a quick-emoji reaction row at the top and action
 * buttons (Reply, Copy, Delete) below it. Slides up with a spring animation.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Message } from '@/lib/communities';

// Quick-react emoji set (WhatsApp-inspired)
const QUICK_EMOJIS = ['❤️', '👍', '😂', '😮', '🔥', '😢', '🙏', '👏'];

interface Props {
  message: Message;
  isOwn: boolean;
  onReact: (messageId: string, emoji: string) => void;
  onReply: () => void;
  onDelete: () => void;
  onDismiss: () => void;
}

export function MessageContextBar({
  message,
  isOwn,
  onReact,
  onReply,
  onDelete,
  onDismiss,
}: Props) {
  const colors = useColors();

  // Slide up from below on mount
  const slideY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, {
        toValue: 0,
        damping: 22,
        stiffness: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isDeleted = !!message.deleted_at;
  const hasText = !!message.content && !isDeleted;

  async function handleCopy() {
    if (!message.content) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({ message: message.content });
    } catch {
      // user cancelled share — ignore
    }
    onDismiss();
  }

  async function handleReact(emoji: string) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReact(message.id, emoji);
    onDismiss();
  }

  async function handleReply() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReply();
    onDismiss();
  }

  async function handleDelete() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete();
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          transform: [{ translateY: slideY }],
          opacity,
        },
      ]}
    >
      {/* ── Quick-emoji row ───────────────────────────────────────── */}
      {!isDeleted && (
        <View style={[styles.emojiRow, { borderBottomColor: colors.border }]}>
          {QUICK_EMOJIS.map((emoji) => (
            <EmojiButton
              key={emoji}
              emoji={emoji}
              subtleColor={colors.subtle}
              onPress={() => handleReact(emoji)}
            />
          ))}
        </View>
      )}

      {/* ── Action buttons ────────────────────────────────────────── */}
      <View style={styles.actionsRow}>
        {!isDeleted && (
          <ActionButton
            icon="corner-up-left"
            label="Reply"
            color={colors.foreground}
            subtleColor={colors.subtle}
            onPress={handleReply}
          />
        )}
        {hasText && (
          <ActionButton
            icon="copy"
            label="Copy"
            color={colors.foreground}
            subtleColor={colors.subtle}
            onPress={handleCopy}
          />
        )}
        {isOwn && !isDeleted && (
          <ActionButton
            icon="trash-2"
            label="Delete"
            color={colors.destructive}
            subtleColor={`${colors.destructive}18`}
            onPress={handleDelete}
          />
        )}
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EmojiButton({
  emoji,
  subtleColor,
  onPress,
}: {
  emoji: string;
  subtleColor: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, { toValue: 1.3, damping: 12, stiffness: 400, useNativeDriver: true }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, damping: 12, stiffness: 300, useNativeDriver: true }).start();
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={6}
      style={({ pressed }) => [
        styles.emojiBtn,
        pressed && { backgroundColor: subtleColor },
      ]}
    >
      <Animated.Text style={[styles.emoji, { transform: [{ scale }] }]}>
        {emoji}
      </Animated.Text>
    </Pressable>
  );
}

function ActionButton({
  icon,
  label,
  color,
  subtleColor,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  subtleColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        pressed && { backgroundColor: subtleColor },
      ]}
    >
      <Feather name={icon as any} size={21} color={color} />
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    // Subtle elevation so it lifts above the list
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },

  // Emoji row
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  emojiBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 26,
  },

  // Action buttons
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 5,
    borderRadius: 10,
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: 'Geist_500Medium',
  },
});
