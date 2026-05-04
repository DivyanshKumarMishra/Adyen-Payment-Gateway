import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { handleRedirectResult, signInWithSAML, signInWithEmail, registerWithEmail, signOut as firebaseSignOut } from "../firebase/auth";
import { API } from "../constants/api";

export interface SessionUser {
  uid: string;
  email: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  sessionExpired: boolean;
  signInWithSSO: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSession = useCallback((expired = false) => {
    if (expiryTimer.current) {
      clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }
    fetch(API.auth.logout, { method: "POST", credentials: "include" }).catch(() => {});
    firebaseSignOut().catch(() => {});
    setUser(null);
    setSessionExpired(expired);
  }, []);

  const scheduleExpiry = useCallback((expiresAt: string) => {
    if (expiryTimer.current) clearTimeout(expiryTimer.current);
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) {
      clearSession(true);
      return;
    }
    expiryTimer.current = setTimeout(() => clearSession(true), ms);
  }, [clearSession]);

  useEffect(() => {
    handleRedirectResult().catch(console.error);

    fetch(API.auth.me, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          scheduleExpiry(data.expiresAt);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => {
      if (expiryTimer.current) clearTimeout(expiryTimer.current);
    };
  }, [scheduleExpiry]);

  async function signInWithPassword(email: string, password: string) {
    const idToken = await signInWithEmail(email, password);
    const res = await fetch(API.auth.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) throw new Error("Login failed");
    const data = await res.json();
    setSessionExpired(false);
    setUser(data.user);
    scheduleExpiry(data.expiresAt);
  }

  async function register(email: string, password: string) {
    await registerWithEmail(email, password);
    await firebaseSignOut();
  }

  async function signOut() {
    clearSession(false);
  }

  return (
    <AuthContext.Provider value={{ user, loading, sessionExpired, signInWithSSO: signInWithSAML, signInWithPassword, register, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
