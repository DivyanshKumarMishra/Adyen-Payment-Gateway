import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { handleRedirectResult, signInWithSAML, signInWithEmail, registerWithEmail, signOut as firebaseSignOut } from "../firebase/auth";
import { API } from "../constants/api";

const IDLE_TIMEOUT_MS   = 10 * 60 * 1000;
const WARNING_AT_MS     =  8 * 60 * 1000;
const HEARTBEAT_MS      = 60 * 1000;
const ACTIVITY_EVENTS   = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"] as const;

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
  const [user, setUser]                 = useState<SessionUser | null>(null);
  const [loading, setLoading]           = useState(true);
  const [sessionExpired, setExpired]    = useState(false);
  const [showWarning, setShowWarning]   = useState(false);

  const sseRef          = useRef<EventSource | null>(null);
  const warningTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimer  = useRef<ReturnType<typeof setInterval> | null>(null);
  const isActiveRef     = useRef(false);

  // ── Activity tracking ───────────────────────────────────────────────
  function resetIdleTimers() {
    isActiveRef.current = true;

    if (warningTimer.current)  clearTimeout(warningTimer.current);
    if (logoutTimer.current)   clearTimeout(logoutTimer.current);
    setShowWarning(false);

    warningTimer.current = setTimeout(() => setShowWarning(true), WARNING_AT_MS);
    logoutTimer.current  = setTimeout(() => performLogout(true), IDLE_TIMEOUT_MS);
  }

  function startActivityTracking() {
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, resetIdleTimers, { passive: true }));
    resetIdleTimers();

    heartbeatTimer.current = setInterval(() => {
      if (!isActiveRef.current) return;
      isActiveRef.current = false;
      fetch(API.auth.heartbeat, { method: "POST", credentials: "include" }).catch(() => {});
    }, HEARTBEAT_MS);
  }

  function stopActivityTracking() {
    ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetIdleTimers));
    if (warningTimer.current)   clearTimeout(warningTimer.current);
    if (logoutTimer.current)    clearTimeout(logoutTimer.current);
    if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
  }

  // ── SSE ─────────────────────────────────────────────────────────────
  function openSSE() {
    if (sseRef.current) sseRef.current.close();
    const es = new EventSource(API.auth.sessionExpired, { withCredentials: true });
    es.addEventListener("session-expired", () => {
      console.log("[Auth] Session expired — invalidating and redirecting to login");
      es.close();
      sseRef.current = null;
      fetch(API.auth.logout, { method: "POST", credentials: "include" }).catch(() => {});
      firebaseSignOut().catch(() => {});
      stopActivityTracking();
      setUser(null);
      setExpired(true);
    });
    sseRef.current = es;
  }

  function closeSSE() {
    if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
  }

  // ── Session start / stop ────────────────────────────────────────────
  function startSession(sessionUser: SessionUser) {
    setUser(sessionUser);
    setExpired(false);
    setShowWarning(false);
    openSSE();
    startActivityTracking();
  }

  function performLogout(expired = false) {
    closeSSE();
    stopActivityTracking();
    fetch(API.auth.logout, { method: "POST", credentials: "include" }).catch(() => {});
    firebaseSignOut().catch(() => {});
    setUser(null);
    setExpired(expired);
    setShowWarning(false);
  }

  // ── Mount ────────────────────────────────────────────────────────────
  useEffect(() => {
    handleRedirectResult().catch(console.error);

    fetch(API.auth.me, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.user) startSession(data.user); })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => { closeSSE(); stopActivityTracking(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth actions ─────────────────────────────────────────────────────
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
    startSession(data.user);
  }

  async function register(email: string, password: string) {
    await registerWithEmail(email, password);
    await firebaseSignOut();
  }

  async function signOut() {
    performLogout(false);
  }

  function dismissWarning() {
    setShowWarning(false);
    resetIdleTimers();
    fetch(API.auth.heartbeat, { method: "POST", credentials: "include" }).catch(() => {});
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
