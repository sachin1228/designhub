import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";

// ─── Inner layout: redirect based on auth state ───────────────────────────────

function RootLayoutNav() {
  const { loading, token } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!token && !inAuthGroup) {
      // Not logged in → send to login
      router.replace("/(auth)/login");
    } else if (token && inAuthGroup) {
      // Logged in → send to app
      router.replace("/(app)");
    }
  }, [loading, token, segments]);

  return <Slot />;
}

// ─── Root layout: wrap with providers ────────────────────────────────────────

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
