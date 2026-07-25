import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { Community, apiGetCommunities } from "../lib/api";
import { CommunitiesStackParamList, AppTabParamList } from "../navigation";

type Props = CompositeScreenProps<
  NativeStackScreenProps<CommunitiesStackParamList, "CommunitiesList">,
  BottomTabScreenProps<AppTabParamList>
>;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function CommunityRow({
  item,
  onPress,
}: {
  item: Community;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarWrap}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {item.message_count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {item.message_count > 99 ? "99+" : item.message_count}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.infoTop}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          {item.last_message && (
            <Text style={styles.time}>
              {timeAgo(item.last_message.created_at)}
            </Text>
          )}
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {item.last_message
            ? `${item.last_message.user.name}: ${item.last_message.content}`
            : `${item.member_count} members`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function CommunitiesScreen({ navigation }: Props) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const { communities } = await apiGetCommunities();
      setCommunities(communities);
    } catch (e: any) {
      setError(e.message ?? "Failed to load communities.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={communities}
      keyExtractor={(c) => c.id}
      renderItem={({ item }) => (
        <CommunityRow
          item={item}
          onPress={() =>
            (navigation as any).navigate("Chat", {
              communityId: item.id,
              communityName: item.name,
            })
          }
        />
      )}
      style={styles.list}
      contentContainerStyle={
        communities.length === 0 ? styles.emptyContainer : undefined
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>No communities yet.</Text>
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load(true);
          }}
          tintColor="#6366f1"
        />
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f0f",
    padding: 24,
  },
  errorText: {
    color: "#f87171",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: "#fff", fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#0f0f0f",
  },
  avatarWrap: { position: "relative", marginRight: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    backgroundColor: "#1e1b4b",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#a5b4fc", fontSize: 20, fontWeight: "700" },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#6366f1",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  info: { flex: 1 },
  infoTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f3f4f6",
    flex: 1,
    marginRight: 8,
  },
  time: { fontSize: 12, color: "#6b7280" },
  preview: { fontSize: 13, color: "#6b7280" },
  separator: { height: 1, backgroundColor: "#1c1c1c", marginLeft: 78 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#6b7280", fontSize: 15 },
});
