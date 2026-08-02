import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  KeyboardAvoidingView as KeyboardControllerAvoidingView,
  KeyboardEvents,
} from 'react-native-keyboard-controller';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useTypingPresence } from '@/hooks/useTypingPresence';
import { useAuth } from '@/context/AuthContext';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ImageViewer } from '@/components/chat/ImageViewer';
import { ChatInput, PendingImage } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { MessageContextBar } from '@/components/chat/MessageContextBar';
import {
  toggleReaction,
  deleteMessage,
  Message,
} from '@/lib/communities';
import { useSendMessage } from '@/hooks/useSendMessage';
import { communityStore } from '@/lib/communityStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CommunityChat() {
  const { id, name, image } = useLocalSearchParams<{ id: string; name: string; image?: string }>();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [headerHeight, setHeaderHeight] = useState(0);

  // Track this as the active community so useCommunities won't increment
  // unread_count for incoming messages while we're looking at this chat.
  useEffect(() => {
    communityStore.activeCommunityId = id;
    return () => {
      communityStore.activeCommunityId = null;
    };
  }, [id]);

  const {
    messages,
    setMessages,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    updateReactions,
    softDeleteMessage,
  } = useChatMessages(id);

  const { typingLabel, onInputChange, stopTyping } = useTypingPresence(id);

  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [viewingImageUri, setViewingImageUri] = useState<string | null>(null);

  // ── Action-header animation ────────────────────────────────────────────────
  // Fades in the action bar and fades out the normal header title when a
  // message is selected. Uses Animated.Value driven by selectedMessage.
  const actionBarOpacity = useRef(new Animated.Value(0)).current;
  const normalHeaderOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const toAction = selectedMessage !== null;
    Animated.parallel([
      Animated.timing(actionBarOpacity, {
        toValue: toAction ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(normalHeaderOpacity, {
        toValue: toAction ? 0 : 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selectedMessage]);

  const handleImagePress = useCallback((uri: string) => {
    setViewingImageUri(uri);
  }, []);

  const listRef = useRef<FlatList>(null);

  const isAtBottom = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    lastMessageIdRef.current = messages[messages.length - 1]?.id ?? null;
  }, [messages]);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 10 });
  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ item: Message }> }) => {
      const lastId = lastMessageIdRef.current;
      if (!lastId) return;
      isAtBottom.current = viewableItems.some((vi) => vi.item.id === lastId);
    }
  );

  const scrollToLatest = useCallback((animated = true) => {
    listRef.current?.scrollToEnd({ animated });
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = KeyboardEvents.addListener('keyboardDidShow', () => {
      if (isAtBottom.current) scrollToLatest(true);
    });
    return () => subscription.remove();
  }, [scrollToLatest]);

  const { handleSend: _handleSend, handleCancel, handleRetry } = useSendMessage({
    communityId: id,
    currentUser: {
      id: user?.id ?? '',
      name: user?.name ?? 'You',
      avatar_url: user?.avatar_url ?? null,
    },
    setMessages,
    scrollToLatest,
    stopTyping,
  });

  const handleSend = useCallback(
    (text: string, pendingImage?: PendingImage) => {
      _handleSend(text, pendingImage, replyTo);
      setReplyTo(null);
    },
    [_handleSend, replyTo]
  );

  const handleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        const reactions = await toggleReaction(id, messageId, emoji);
        updateReactions(messageId, reactions);
      } catch {
        // silent
      }
    },
    [id, updateReactions]
  );

  const handleDelete = useCallback(
    async (messageId: string) => {
      // Close context bar first
      setSelectedMessage(null);
      // Show delete confirmation
      setTimeout(() => {
        Alert.alert(
          'Delete message?',
          'This will delete the message for everyone in this chat.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete for everyone',
              style: 'destructive',
              onPress: async () => {
                softDeleteMessage(messageId);
                try {
                  await deleteMessage(id, messageId);
                } catch {
                  // Realtime UPDATE will reconcile if this fails
                }
              },
            },
          ]
        );
      }, 200);
    },
    [id, softDeleteMessage]
  );

  // Long-press: store the selected message + fire haptic
  const handleLongPress = useCallback((msg: Message) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMessage(msg);
  }, []);

  const dismissSelection = useCallback(() => {
    setSelectedMessage(null);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const isSameAuthor =
        !!prevMessage &&
        prevMessage.user_id === item.user_id &&
        !prevMessage.deleted_at &&
        !item.deleted_at;

      return (
        <MessageBubble
          message={item}
          isOwn={item.user_id === user?.id}
          isSameAuthor={isSameAuthor}
          isSelected={selectedMessage?.id === item.id}
          onLongPress={handleLongPress}
          onReactionPress={handleReaction}
          onImagePress={handleImagePress}
          currentUserId={user?.id ?? ''}
          onCancel={handleCancel}
          onRetry={handleRetry}
        />
      );
    },
    [
      user?.id,
      selectedMessage?.id,
      handleLongPress,
      handleReaction,
      handleImagePress,
      handleCancel,
      handleRetry,
      messages,
    ]
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) loadMore();
  }, [hasMore, isLoadingMore, loadMore]);

  const communityName = name ? decodeURIComponent(name) : 'Chat';
  const communityImage = image ? decodeURIComponent(image) : null;

  // ── Bottom content: context bar (selection) OR normal input ───────────────
  const bottomContent = selectedMessage ? (
    <MessageContextBar
      message={selectedMessage}
      isOwn={selectedMessage.user_id === user?.id}
      onReact={handleReaction}
      onReply={() => {
        setReplyTo(selectedMessage);
        setSelectedMessage(null);
      }}
      onDelete={() => handleDelete(selectedMessage.id)}
      onDismiss={dismissSelection}
    />
  ) : (
    <View onLayout={() => { if (isAtBottom.current) scrollToLatest(false); }}>
      <TypingIndicator label={typingLabel} />
      <ChatInput
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onSend={handleSend}
        onTypingChange={onInputChange}
      />
    </View>
  );

  const chatContent = (
    <View style={styles.flex}>
      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {!isLoading && error && (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        </View>
      )}

      {!isLoading && (
        <Pressable style={styles.flex} onPress={selectedMessage ? dismissSelection : undefined}>
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={[styles.messagesList, { paddingBottom: 8 }]}
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            onViewableItemsChanged={handleViewableItemsChanged.current}
            viewabilityConfig={viewabilityConfig.current}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.2}
            // Disable scroll-to-end when in selection mode so the user can
            // read context around the highlighted message.
            onContentSizeChange={() => {
              if (!selectedMessage && isAtBottom.current) scrollToLatest(false);
            }}
            ListHeaderComponent={
              isLoadingMore ? (
                <View style={styles.loadMoreSpinner}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Feather name="message-circle" size={36} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No messages yet. Say hello!
                </Text>
              </View>
            }
          />
        </Pressable>
      )}

      {bottomContent}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        style={[
          styles.header,
          {
            backgroundColor: selectedMessage
              ? colors.card          // slightly lifted when in selection mode
              : colors.background,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        {/* ── Normal header (community name + back) ── */}
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.headerInner, { opacity: normalHeaderOpacity }]}
          pointerEvents={selectedMessage ? 'none' : 'auto'}
        >
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
            <Feather name="arrow-left" size={26} color={colors.foreground} />
          </Pressable>

          <View style={styles.headerCenter}>
            {communityImage ? (
              <Image
                source={{ uri: communityImage }}
                style={[styles.headerAvatar, { borderColor: colors.border }]}
              />
            ) : (
              <View
                style={[
                  styles.headerAvatar,
                  styles.headerAvatarFallback,
                  { backgroundColor: colors.primarySoft },
                ]}
              >
                <Text style={[styles.headerAvatarText, { color: colors.primary }]}>
                  {communityName.slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            <Text
              style={[styles.headerTitle, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {communityName}
            </Text>
          </View>

          <View style={{ width: 36 }} />
        </Animated.View>

        {/* ── Action header (shown when message selected) ── */}
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.headerInner, { opacity: actionBarOpacity }]}
          pointerEvents={selectedMessage ? 'auto' : 'none'}
        >
          {/* Close / deselect */}
          <Pressable onPress={dismissSelection} hitSlop={8} style={styles.backBtn}>
            <Feather name="x" size={24} color={colors.foreground} />
          </Pressable>

          {/* "1 selected" label */}
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              1 selected
            </Text>
          </View>

          {/* Context actions — right side */}
          <View style={styles.actionIcons}>
            {/* Reply */}
            {!selectedMessage?.deleted_at && (
              <Pressable
                hitSlop={8}
                style={({ pressed }) => [
                  styles.actionIcon,
                  pressed && { backgroundColor: colors.subtle },
                ]}
                onPress={() => {
                  if (!selectedMessage) return;
                  setReplyTo(selectedMessage);
                  setSelectedMessage(null);
                }}
              >
                <Feather name="corner-up-left" size={20} color={colors.foreground} />
              </Pressable>
            )}

            {/* Delete — own messages only */}
            {selectedMessage && selectedMessage.user_id === user?.id && !selectedMessage.deleted_at && (
              <Pressable
                hitSlop={8}
                style={({ pressed }) => [
                  styles.actionIcon,
                  pressed && { backgroundColor: `${colors.destructive}18` },
                ]}
                onPress={() => selectedMessage && handleDelete(selectedMessage.id)}
              >
                <Feather name="trash-2" size={20} color={colors.destructive} />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Spacer so the header has the right height whether normal or action */}
        <View style={styles.headerSpacer} />
      </View>

      {Platform.OS === 'android' ? (
        <KeyboardControllerAvoidingView style={styles.flex} behavior="height">
          {chatContent}
        </KeyboardControllerAvoidingView>
      ) : (
        <RNKeyboardAvoidingView
          style={styles.flex}
          behavior="padding"
          keyboardVerticalOffset={headerHeight}
        >
          {chatContent}
        </RNKeyboardAvoidingView>
      )}

      {/* Bottom safe-area strip */}
      <View style={{ height: insets.bottom, backgroundColor: colors.background }} />

      {/* Full-screen image viewer */}
      <ImageViewer
        uri={viewingImageUri}
        onClose={() => setViewingImageUri(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  // Invisible row that gives the header its height — the two Animated.Views
  // are absolutely positioned on top of each other inside it.
  headerSpacer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,            // matches back button + avatar height
    gap: 8,
  },
  // Both the normal header and the action header share this base layout
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    // vertically align contents to the bottom of the padded header area
    justifyContent: 'space-between',
    // Extend down to cover the headerSpacer + paddingBottom
    bottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 0,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
  },
  headerAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: 15,
    fontFamily: 'Geist_600SemiBold',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Geist_600SemiBold',
    flexShrink: 1,
  },
  // Right-side icons in the action header
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  actionIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Geist_400Regular',
    textAlign: 'center',
  },
  loadMoreSpinner: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  messagesList: {
    flexGrow: 1,
    paddingTop: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Geist_400Regular',
    textAlign: 'center',
    marginTop: 8,
  },
});
