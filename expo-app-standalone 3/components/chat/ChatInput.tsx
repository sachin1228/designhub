import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { Message } from '@/lib/communities';
import * as ImagePicker from 'expo-image-picker';

export interface PendingImage {
  uri: string;
  mimeType: string;
}

interface Props {
  replyTo: Message | null;
  onCancelReply: () => void;
  onSend: (text: string, pendingImage?: PendingImage) => void;
  onTypingChange: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ replyTo, onCancelReply, onSend, onTypingChange, disabled }: Props) {
  const colors = useColors();
  const [text, setText] = useState('');
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const inputRef = useRef<TextInput>(null);

  function handleChangeText(val: string) {
    setText(val);
    onTypingChange(val);
  }

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed && !pendingImage) return;
    onSend(trimmed, pendingImage ?? undefined);
    setText('');
    setPendingImage(null);
    onTypingChange('');
  }

  async function handlePickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setPendingImage({ uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' });
  }

  const canSend = (!!text.trim() || !!pendingImage) && !disabled;

  return (
    // Fix #4: transparent root — no border-top, no background, floating look
    <View style={styles.root}>
      {/* Reply banner */}
      {replyTo && (
        <View style={[styles.replyBanner, { backgroundColor: colors.subtle, borderLeftColor: colors.primary }]}>
          <View style={styles.replyInfo}>
            <Text style={[styles.replyLabel, { color: colors.primary }]}>
              Replying to {replyTo.users?.name ?? 'message'}
            </Text>
            <Text style={[styles.replyText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {replyTo.content ?? '📷 Image'}
            </Text>
          </View>
          <Pressable onPress={onCancelReply} hitSlop={8}>
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>
      )}

      {/* Pending image preview strip */}
      {pendingImage && (
        <View style={[styles.imageBanner, { backgroundColor: colors.subtle, borderColor: colors.border }]}>
          <Image source={{ uri: pendingImage.uri }} style={styles.imageThumb} resizeMode="cover" />
          <Text style={[styles.imageReady, { color: colors.mutedForeground }]}>
            Image ready to send
          </Text>
          <Pressable onPress={() => setPendingImage(null)} hitSlop={8}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>
      )}

      {/* Fix #4: input row — image button outside, floating pill contains text + send */}
      <View style={styles.inputRow}>
        {/* Image picker — sits outside the pill, to the left */}
        <Pressable
          onPress={handlePickImage}
          disabled={disabled}
          hitSlop={6}
          style={({ pressed }) => [
            styles.mediaBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather
            name="image"
            size={22}
            color={pendingImage ? colors.primary : colors.mutedForeground}
          />
        </Pressable>

        {/* Fix #4: floating rounded pill — text input + send button inside */}
        <View
          style={[
            styles.pill,
            {
              backgroundColor: colors.card,
              shadowColor: '#000',
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            style={[styles.textInput, { color: colors.foreground }]}
            placeholder="Message…"
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={handleChangeText}
            multiline
            maxLength={2000}
            returnKeyType="default"
            editable={!disabled}
          />

          {/* Send button inside the pill */}
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: !canSend
                  ? 'transparent'
                  : pressed
                    ? colors.primaryHover
                    : colors.primary,
                opacity: !canSend ? 0.4 : 1,
              },
            ]}
          >
            {disabled ? (
              <ActivityIndicator size="small" color={canSend ? colors.primaryForeground : colors.mutedForeground} />
            ) : (
              <Feather
                name="send"
                size={16}
                color={!canSend ? colors.mutedForeground : colors.primaryForeground}
              />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Fix #4: no border-top, no background — floating appearance
  root: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 6,
  },

  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 8,
  },
  replyInfo: { flex: 1, gap: 2 },
  replyLabel: { fontSize: 12, fontFamily: 'Geist_600SemiBold' },
  replyText: { fontSize: 12, fontFamily: 'Geist_400Regular' },

  imageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  imageThumb: { width: 48, height: 48, borderRadius: 8, flexShrink: 0 },
  imageReady: { flex: 1, fontSize: 12, fontFamily: 'Geist_400Regular' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },

  mediaBtn: {
    width: 32,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 4,
  },

  // Fix #4: floating pill — card background + shadow, send button inside
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 22,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 6,
    // Shadow matches web's shadow-md
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Geist_400Regular',
    maxHeight: 120,
    lineHeight: 20,
    paddingTop: 4,
    paddingBottom: 4,
    // Transparent — pill provides the background
    backgroundColor: 'transparent',
  },

  // Send button sits inside the pill on the right
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 1,
  },
});
