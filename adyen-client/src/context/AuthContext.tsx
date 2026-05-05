import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
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
  const sseRef = useRef<EventSource | null>(null);

  function openSSE() {
    if (sseRef.current) sseRef.current.close();

    const es = new EventSource(API.auth.sessionExpired, { withCredentials: true });

    es.addEventListener("session-expired", () => {
      console.log("[Auth] Session expired — invalidating and redirecting to login");
      es.close();
      sseRef.current = null;
      fetch(API.auth.logout, { method: "POST", credentials: "include" }).catch(() => {});
      firebaseSignOut().catch(() => {});
      setUser(null);
      setSessionExpired(true);
    });

    sseRef.current = es;
  }

  function closeSSE() {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
  }

  useEffect(() => {
    handleRedirectResult().catch(console.error);

    fetch(API.auth.me, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          openSSE();
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => closeSSE();
  }, []);

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
    openSSE();
  }

  async function register(email: string, password: string) {
    await registerWithEmail(email, password);
    await firebaseSignOut();
  }

  async function signOut() {
    closeSSE();
    fetch(API.auth.logout, { method: "POST", credentials: "include" }).catch(() => {});
    firebaseSignOut().catch(() => {});
    setUser(null);
    setSessionExpired(false);
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
