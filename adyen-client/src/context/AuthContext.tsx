import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { handleRedirectResult, signInWithSAML, signInWithEmail, registerWithEmail, signOut as firebaseSignOut } from "../firebase/auth";
import { API } from "../constants/api";
import { useActivityTracking } from "../hooks/useActivityTracking";
import { useFetch, setUnauthorizedHandler } from "../hooks/useFetch";

export interface SessionUser {
  uid: string;
  email: string;
}

interface SessionData {
  user: SessionUser;
  idleExpiresAt: string;
  absoluteExpiresAt: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  sessionExpired: boolean;
  showWarning: boolean;
  dismissWarning: () => Promise<void>;
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

  // absoluteExpiresAt is needed in heartbeat interval — keep in ref to avoid stale closures
  const absoluteExpiresAtRef = useRef<string>("");

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
  // activity.stop and execute are stable — omitting to avoid circular dep
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setUnauthorizedHandler(async () => { await performLogout(true); });
  }, [performLogout]);

  function startSession({ user: sessionUser, idleExpiresAt, absoluteExpiresAt }: SessionData) {
    absoluteExpiresAtRef.current = absoluteExpiresAt;
    setUser(sessionUser);
    setExpired(false);
    setShowWarning(false);
    activity.start(idleExpiresAt, absoluteExpiresAt);
  }

  useEffect(() => {
    handleRedirectResult().catch(console.error);

    const init = async () => {
      const data = await execute<SessionData>(API.auth.me, { skipAuthCheck: true });
      if (data?.user) startSession(data);
      setLoading(false);
    };

    init().catch(console.error);
    return () => activity.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signInWithPassword(email: string, password: string) {
    const idToken = await signInWithEmail(email, password);
    const data = await execute<SessionData>(API.auth.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      skipAuthCheck: true,
    });
    if (!data?.user) throw new Error("Login failed");
    startSession(data);
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
    // Force a heartbeat — server returns fresh idleExpiresAt to resync timers
    const res = await execute<{ ok: boolean; idleExpiresAt: string }>(
      API.auth.heartbeat, { method: "POST" }
    );
    if (res?.ok && res.idleExpiresAt) {
      activity.updateIdleExpiry(res.idleExpiresAt, absoluteExpiresAtRef.current);
    }
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
