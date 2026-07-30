import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import { loginRequest } from "./api";

const SESSION_KEY = "draft_session_token";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthState {
  /** true while we are checking SecureStore on startup */
  loading: boolean;
  /** the raw JWT, null when logged out */
  token: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ loading: true, token: null });

  // On mount, restore persisted session.
  useEffect(() => {
    SecureStore.getItemAsync(SESSION_KEY)
      .then((token) => setState({ loading: false, token: token ?? null }))
      .catch(() => setState({ loading: false, token: null }));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token } = await loginRequest(email, password);
    await SecureStore.setItemAsync(SESSION_KEY, token);
    setState({ loading: false, token });
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    setState({ loading: false, token: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
