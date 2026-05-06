import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { handleRedirectResult, signInWithSAML, signInWithEmail, registerWithEmail, signOut as firebaseSignOut } from "../firebase/auth";
import { API } from "../constants/api";
import { useActivityTracking } from "../hooks/useActivityTracking";
import { useFetch, setUnauthorizedHandler } from "../hooks/useFetch";

export interface SessionUser {
  uid: string;
  email: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  sessionExpired: boolean;
  showWarning: boolean;
  dismissWarning: () => void;
  signInWithSSO: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { execute } = useFetch();

  const [user, setUser]               = useState<SessionUser | null>(null);
  const [loading, setLoading]         = useState(true);
  const [sessionExpired, setExpired]  = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const activity = useActivityTracking({
    onWarning: () => setShowWarning(true),
    onLogout:  async () => { await performLogout(true); },
    isPaused:  showWarning,
  });

  const performLogout = useCallback(async (expired = false) => {
    activity.stop();
    await execute(API.auth.logout, { method: "POST", skipAuthCheck: true });
    await firebaseSignOut();
    setUser(null);
    setExpired(expired);
    setShowWarning(false);
  // activity.stop and execute are stable refs — omitting to avoid circular dep with useActivityTracking
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Register global 401 handler — any protected fetch across the app triggers logout
  useEffect(() => {
    setUnauthorizedHandler(async () => { await performLogout(true); });
  }, [performLogout]);

  function startSession(sessionUser: SessionUser) {
    setUser(sessionUser);
    setExpired(false);
    setShowWarning(false);
    activity.start();
  }

  useEffect(() => {
    handleRedirectResult().catch(console.error);

    const init = async () => {
      // skipAuthCheck — 401 here just means no active session, not an error
      const data = await execute<{ user: SessionUser }>(API.auth.me, { skipAuthCheck: true });
      if (data?.user) startSession(data.user);
      setLoading(false);
    };

    init().catch(console.error);
    return () => activity.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signInWithPassword(email: string, password: string) {
    const idToken = await signInWithEmail(email, password);
    // skipAuthCheck — no session cookie yet at login time
    const data = await execute<{ user: SessionUser }>(API.auth.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      skipAuthCheck: true,
    });
    if (!data?.user) throw new Error("Login failed");
    startSession(data.user);
  }

  async function register(email: string, password: string) {
    await registerWithEmail(email, password);
    await firebaseSignOut();
  }

  async function signOut() {
    await performLogout(false);
  }

  async function dismissWarning() {
    setShowWarning(false);
    activity.resetIdleTimers();
    await execute(API.auth.heartbeat, { method: "POST" });
  }

  return (
    <AuthContext.Provider value={{
      user, loading, sessionExpired, showWarning, dismissWarning,
      signInWithSSO: signInWithSAML, signInWithPassword, register, signOut,
    }}>
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
