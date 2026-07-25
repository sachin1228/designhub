import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CommunitiesStackParamList } from "../navigation";
import { Message, apiGetMessages, apiSendMessage, apiMarkRead } from "../lib/api";
import { supabase } from "../lib/supabase";
import { getToken } from "../lib/auth";

// Decode JWT payload without verifying (we just need userId).
// Uses atob which is available in React Native's Hermes engine.
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const part = token.split(".")[1];
    // base64url → base64
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

type Props = NativeStackScreenProps<CommunitiesStackParamList, "Chat">;

function MessageBubble({
  msg,
  isOwn,
}: {
  msg: Message;
  isOwn: boolean;
}) {
  return (
    <View style={[styles.msgRow, isOwn && styles.msgRowOwn]}>
      {!isOwn && (
        <View style={styles.msgAvatar}>
          {msg.user.avatar_url ? (
            <Image
              source={{ uri: msg.user.avatar_url }}
              style={styles.avatarImg}
            />
          ) : (
            <View style={[styles.avatarImg, styles.avatarFallback]}>
              <Text style={styles.avatarLetter}>
                {msg.user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      )}
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn && (
          <Text style={styles.bubbleName}>{msg.user.name}</Text>
        )}
        {msg.reply_preview && (
          <View style={styles.replyPreview}>
            <Text style={styles.replyName}>{msg.reply_preview.user.name}</Text>
            <Text style={styles.replyContent} numberOfLines={1}>
              {msg.reply_preview.content}
            </Text>
          </View>
        )}
        {msg.image_url ? (
          <Image
            source={{ uri: msg.image_url }}
            style={styles.msgImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>
            {msg.content}
          </Text>
        )}
        <Text style={[styles.bubbleTime, isOwn && styles.bubbleTimeOwn]}>
          {new Date(msg.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen({ route }: Props) {
  const { communityId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const flatRef = useRef<FlatList>(null);

  // Get current user id from token
  useEffect(() => {
    getToken().then((token) => {
      if (token) {
        const payload = decodeJwtPayload(token);
        setCurrentUserId(payload?.userId ?? null);
      }
    });
  }, []);

  const loadMessages = useCallback(
    async (before?: string) => {
      try {
        const { messages: msgs, hasMore: more } = await apiGetMessages(
          communityId,
          before
        );
        if (before) {
          setMessages((prev) => [...prev, ...msgs]);
        } else {
          setMessages(msgs.slice().reverse());
        }
        setHasMore(more);
      } catch (e: any) {
        Alert.alert("Error", e.message ?? "Failed to load messages.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [communityId]
  );

  // Initial load + mark read
  useEffect(() => {
    loadMessages();
    apiMarkRead(communityId).catch(() => {});
  }, [loadMessages, communityId]);

  // Supabase realtime
  useEffect(() => {
    const channel = supabase
      .channel(`community:${communityId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_messages",
          filter: `community_id=eq.${communityId}`,
        },
        (payload) => {
          const newRow = payload.new as any;
          // Build a minimal Message — full hydration (reactions, reply_preview)
          // happens on next full reload. This is good enough for live feel.
          const optimisticMsg: Message = {
            id: newRow.id,
            content: newRow.content ?? "",
            created_at: newRow.created_at,
            user_id: newRow.user_id,
            image_url: newRow.image_url ?? null,
            reply_to_id: newRow.reply_to_id ?? null,
            user: { name: "...", avatar_url: null },
            reactions: [],
            reply_preview: null,
          };
          setMessages((prev) => {
            if (prev.find((m) => m.id === optimisticMsg.id)) return prev;
            return [optimisticMsg, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    try {
      await apiSendMessage(communityId, trimmed);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to send message.");
      setText(trimmed); // restore on failure
    } finally {
      setSending(false);
    }
  }

  function loadOlder() {
    if (!hasMore || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    const oldest = messages[messages.length - 1];
    loadMessages(oldest.created_at);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <MessageBubble
            msg={item}
            isOwn={!!currentUserId && item.user_id === currentUserId}
          />
        )}
        inverted
        contentContainerStyle={styles.msgList}
        onEndReached={loadOlder}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              size="small"
              color="#6366f1"
              style={{ marginVertical: 8 }}
            />
          ) : null
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Message…"
          placeholderTextColor="#6b7280"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={2000}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendBtnText}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f0f",
  },
  msgList: { paddingHorizontal: 12, paddingVertical: 8 },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 4,
  },
  msgRowOwn: { flexDirection: "row-reverse" },
  msgAvatar: { marginRight: 8, marginBottom: 2 },
  avatarImg: { width: 32, height: 32, borderRadius: 16 },
  avatarFallback: {
    backgroundColor: "#1e1b4b",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: { color: "#a5b4fc", fontSize: 14, fontWeight: "700" },
  bubble: {
    maxWidth: "72%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleOwn: {
    backgroundColor: "#6366f1",
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: "#1c1c1c",
    borderBottomLeftRadius: 4,
  },
  bubbleName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#a5b4fc",
    marginBottom: 3,
  },
  replyPreview: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderLeftWidth: 3,
    borderLeftColor: "#6366f1",
    borderRadius: 6,
    padding: 6,
    marginBottom: 6,
  },
  replyName: { fontSize: 11, fontWeight: "600", color: "#a5b4fc" },
  replyContent: { fontSize: 12, color: "#9ca3af" },
  bubbleText: { fontSize: 15, color: "#f3f4f6", lineHeight: 20 },
  bubbleTextOwn: { color: "#ffffff" },
  bubbleTime: {
    fontSize: 10,
    color: "#6b7280",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  bubbleTimeOwn: { color: "rgba(255,255,255,0.6)" },
  msgImage: {
    width: 200,
    height: 160,
    borderRadius: 10,
    marginVertical: 4,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#1c1c1c",
    backgroundColor: "#0f0f0f",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#1c1c1c",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#f3f4f6",
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: "#fff", fontSize: 20, fontWeight: "700", marginTop: -2 },
});
