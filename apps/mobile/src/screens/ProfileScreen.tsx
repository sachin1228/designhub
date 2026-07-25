import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Profile, apiGetProfile, apiUpdateProfile, apiLogout } from "../lib/api";
import { deleteToken } from "../lib/auth";
import { RootStackParamList } from "../navigation";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await apiGetProfile();
      setProfile(data);
      setName(data.user.name);
      setBio(data.profile.bio ?? "");
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to load profile.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    try {
      await apiUpdateProfile({ name: name.trim(), bio: bio.trim() });
      await load();
      setEditing(false);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          try {
            await apiLogout();
          } catch {}
          await deleteToken();
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load profile.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => load()}>
          <Text style={styles.btnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
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
    >
      {/* Avatar */}
      <View style={styles.avatarSection}>
        {profile.profile.avatar_url ? (
          <Image
            source={{ uri: profile.profile.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarLetter}>
              {profile.user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.nameDisplay}>{profile.user.name}</Text>
        <Text style={styles.emailDisplay}>{profile.user.email}</Text>
        {profile.profile.experience_level && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{profile.profile.experience_level}</Text>
          </View>
        )}
      </View>

      {/* Interests */}
      {profile.userInterests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.tags}>
            {profile.userInterests.map((i) => (
              <View key={i.id} style={styles.tag}>
                <Text style={styles.tagText}>{i.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Edit section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>About</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={name}
              onChangeText={setName}
              placeholderTextColor="#6b7280"
            />
            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Bio</Text>
            <TextInput
              style={[styles.fieldInput, { minHeight: 80, textAlignVertical: "top" }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself…"
              placeholderTextColor="#6b7280"
              multiline
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setName(profile.user.name);
                  setBio(profile.profile.bio ?? "");
                  setEditing(false);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.bioText}>
            {profile.profile.bio || "No bio yet."}
          </Text>
        )}
      </View>

      {/* Meta */}
      <Text style={styles.meta}>
        Member since{" "}
        {new Date(profile.user.created_at).toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        })}
      </Text>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  content: { paddingBottom: 40 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f0f",
  },
  errorText: { color: "#f87171", marginBottom: 16 },
  btn: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnText: { color: "#fff", fontWeight: "600" },
  avatarSection: { alignItems: "center", paddingTop: 36, paddingBottom: 24 },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 14 },
  avatarFallback: {
    backgroundColor: "#1e1b4b",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: { color: "#a5b4fc", fontSize: 36, fontWeight: "700" },
  nameDisplay: { fontSize: 22, fontWeight: "700", color: "#f3f4f6" },
  emailDisplay: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  badge: {
    marginTop: 10,
    backgroundColor: "#1e1b4b",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: { color: "#a5b4fc", fontSize: 12, fontWeight: "600" },
  section: {
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: "#1c1c1c",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 },
  editLink: { color: "#6366f1", fontSize: 14, fontWeight: "500" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: "#1e1b4b",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: { color: "#a5b4fc", fontSize: 13 },
  bioText: { fontSize: 15, color: "#d1d5db", lineHeight: 22 },
  fieldLabel: { fontSize: 13, color: "#9ca3af", marginBottom: 6 },
  fieldInput: {
    backgroundColor: "#0f0f0f",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#f3f4f6",
  },
  editActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#2d2d2d",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelBtnText: { color: "#9ca3af", fontWeight: "500" },
  saveBtn: {
    flex: 1,
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "600" },
  meta: {
    fontSize: 13,
    color: "#4b5563",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  logoutBtn: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: { color: "#f87171", fontWeight: "600", fontSize: 15 },
});
