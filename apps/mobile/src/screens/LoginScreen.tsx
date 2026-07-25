import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation";
import { apiLogin } from "../lib/api";
import { saveToken } from "../lib/auth";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const { token } = await apiLogin(email.trim(), password);
      await saveToken(token);
      navigation.reset({ index: 0, routes: [{ name: "App" }] });
    } catch (err: any) {
      Alert.alert("Login failed", err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>drafthub</Text>
          <Text style={styles.tagline}>A home for designers</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />
            <TouchableOpacity
              style={styles.showBtn}
              onPress={() => setShowPassword((v) => !v)}
            >
              <Text style={styles.showBtnText}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Sign in</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
  },
  header: {
    marginBottom: 48,
  },
  logo: {
    fontSize: 36,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 6,
  },
  form: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#d1d5db",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1c1c1c",
    borderWidth: 1,
    borderColor: "#2d2d2d",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#ffffff",
    marginBottom: 0,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  showBtn: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  showBtnText: {
    color: "#6366f1",
    fontSize: 14,
    fontWeight: "500",
  },
  loginBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 28,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
