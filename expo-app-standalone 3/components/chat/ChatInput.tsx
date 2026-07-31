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
  /** Called when the user taps Send. imageUri is set when an image is pending. */
  onSend: (text: string, pendingImage?: PendingImage) => void;
  onTypingChange: (text: string) => void;
  /** True while the parent is uploading / sending — disables the send button. */
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
    // Request media library permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setPendingImage({
      uri: asset.uri,
      mimeType: asset.mimeType ?? 'image/jpeg',
    });
  }

  const canSend = (!!text.trim() || !!pendingImage) && !disabled;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      {/* Reply banner */}
      {replyTo && (
        <View style={[styles.replyBanner, { backgroundColor: colors.subtle, borderLeftColor: colors.primary }]}>
          <View style={styles.replyInfo}>
            <Text style={[styles.replyLabel, { color: colors.primary }]}>
              Replying to {replyTo.users?.name ?? 'message'}
            </Text>
            <Text style={[styles.replyPreview, { color: colors.mutedForeground }]} numberOfLines={1}>
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
          <Image
            source={{ uri: pendingImage.uri }}
            style={styles.imagePreview}
            resizeMode="cover"
          />
          <Text style={[styles.imageReady, { color: colors.mutedForeground }]}>
            Image ready to send
          </Text>
          <Pressable onPress={() => setPendingImage(null)} hitSlop={8}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>
      )}

      {/* Input row */}
      <View style={styles.inputRow}>
        {/* Image picker button */}
        <Pressable
          onPress={handlePickImage}
          disabled={disabled}
          hitSlop={4}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: pressed ? colors.subtle : 'transparent' },
          ]}
        >
          <Feather
            name="image"
            size={20}
            color={pendingImage ? colors.primary : colors.mutedForeground}
          />
        </Pressable>

        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              backgroundColor: colors.subtle,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          placeholder="Message…"
          placeholderTextColor={colors.mutedForeground}
          value={text}
          onChangeText={handleChangeText}
          multiline
          maxLength={2000}
          returnKeyType="default"
          editable={!disabled}
        />

        {/* Send / loading button */}
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={({ pressed }) => [
            styles.sendBtn,
            {
              backgroundColor: !canSend
                ? colors.subtle
                : pressed
                  ? colors.primaryHover
                  : colors.primary,
            },
          ]}
        >
          {disabled ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Feather
              name="send"
              size={18}
              color={!canSend ? colors.mutedForeground : colors.primaryForeground}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 8,
  },
  replyInfo: {
    flex: 1,
    gap: 2,
  },
  replyLabel: {
    fontSize: 12,
    fontFamily: 'Geist_600SemiBold',
  },
  replyPreview: {
    fontSize: 12,
    fontFamily: 'Geist_400Regular',
  },
  imageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  imagePreview: {
    width: 48,
    height: 48,
    borderRadius: 8,
    flexShrink: 0,
  },
  imageReady: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Geist_400Regular',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 2,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    fontFamily: 'Geist_400Regular',
    maxHeight: 120,
    lineHeight: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
