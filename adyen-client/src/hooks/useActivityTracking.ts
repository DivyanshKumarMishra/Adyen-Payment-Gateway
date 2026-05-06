import { useRef, useCallback, useEffect } from "react";
import { API } from "../constants/api";
import { ACTIVITY_EVENTS } from "../constants/activityEvents";
import { IDLE_TIMEOUT_MS, WARNING_AT_MS, HEARTBEAT_MS } from "../constants/sessionConfig";
import { useFetch } from "./useFetch";

interface Options {
  onWarning: () => void;
  onLogout: () => Promise<void>;
  isPaused: boolean; // when true (warning modal visible), idle timers and heartbeat are frozen
}

export function useActivityTracking({ onWarning, onLogout, isPaused }: Options) {
  const { execute } = useFetch();

  const onWarningRef = useRef(onWarning);
  const onLogoutRef  = useRef(onLogout);
  useEffect(() => {
    onWarningRef.current = onWarning;
    onLogoutRef.current  = onLogout;
  }, [onWarning, onLogout]);

  const isPausedRef    = useRef(isPaused);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  const warningTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isActiveRef    = useRef(false);

  const resetIdleTimers = useCallback(() => {
    if (isPausedRef.current) return;

    isActiveRef.current = true;
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (logoutTimer.current)  clearTimeout(logoutTimer.current);

    warningTimer.current = setTimeout(() => {
      console.log("[Activity] Idle warning threshold reached — showing warning modal");
      onWarningRef.current();
    }, WARNING_AT_MS);

    logoutTimer.current = setTimeout(async () => {
      console.log("[Activity] Idle timeout reached — logging out");
      await onLogoutRef.current();
    }, IDLE_TIMEOUT_MS);
  }, []);

  const start = useCallback(() => {
    console.log("[Activity] Tracking started — listening for", ACTIVITY_EVENTS.length, "events");
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, resetIdleTimers, { passive: true }));
    resetIdleTimers();

    heartbeatTimer.current = setInterval(async () => {
      if (isPausedRef.current) {
        console.log("[Heartbeat] Paused — warning modal is visible");
        return;
      }
      if (!isActiveRef.current) {
        console.log("[Heartbeat] Skipped — no activity since last tick");
        return;
      }
      isActiveRef.current = false;
      console.log("[Heartbeat] User was active — sending heartbeat to server");
      const res = await execute<{ ok: boolean }>(API.auth.heartbeat, { method: "POST" });
      console.log("[Heartbeat] Server responded:", res?.ok ? "ok" : "failed or 401");
    }, HEARTBEAT_MS);
  }, [execute, resetIdleTimers]);

  const stop = useCallback(() => {
    console.log("[Activity] Tracking stopped — removing listeners and clearing timers");
    ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetIdleTimers));
    if (warningTimer.current)   clearTimeout(warningTimer.current);
    if (logoutTimer.current)    clearTimeout(logoutTimer.current);
    if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
  }, [resetIdleTimers]);

  return { start, stop, resetIdleTimers };
}
