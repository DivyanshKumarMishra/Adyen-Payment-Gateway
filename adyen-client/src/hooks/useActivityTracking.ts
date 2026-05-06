import { useRef, useCallback, useEffect } from "react";
import { API } from "../constants/api";
import { ACTIVITY_EVENTS } from "../constants/activityEvents";
import { HEARTBEAT_MS, WARNING_BUFFER_MS } from "../constants/sessionConfig";
import { useFetch } from "./useFetch";

interface Options {
  onWarning: () => void;
  onLogout: () => Promise<void>;
  isPaused: boolean;
}

interface HeartbeatResponse {
  ok: boolean;
  idleExpiresAt: string;
  absoluteExpiresAt: string;
}

export function useActivityTracking({ onWarning, onLogout, isPaused }: Options) {
  const { execute } = useFetch();

  const onWarningRef = useRef(onWarning);
  const onLogoutRef  = useRef(onLogout);
  useEffect(() => {
    onWarningRef.current = onWarning;
    onLogoutRef.current  = onLogout;
  }, [onWarning, onLogout]);

  const isPausedRef = useRef(isPaused);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  const warningTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isActiveRef    = useRef(false);

  const scheduleTimers = useCallback((idleExpiresAt: string, absoluteExpiresAt: string) => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (logoutTimer.current)  clearTimeout(logoutTimer.current);

    const idleMs     = new Date(idleExpiresAt).getTime()     - Date.now();
    const absoluteMs = new Date(absoluteExpiresAt).getTime() - Date.now();

    if (isNaN(idleMs) || isNaN(absoluteMs)) {
      console.error("[Activity] Invalid expiry timestamps from server", { idleExpiresAt, absoluteExpiresAt });
      return;
    }

    const expiryMs   = Math.min(idleMs, absoluteMs);
    const warningMs  = expiryMs - WARNING_BUFFER_MS;
    const constraint = idleMs < absoluteMs ? "idle" : "absolute";

    console.log(`[Activity] Timers set — expiry in ${Math.round(expiryMs / 1000)}s (${constraint}), warning in ${Math.round(warningMs / 1000)}s`);

    if (warningMs > 0) {
      warningTimer.current = setTimeout(() => {
        console.log("[Activity] Warning threshold reached — showing modal");
        onWarningRef.current();
      }, warningMs);
    } else {
      console.log("[Activity] Absolute expiry imminent — showing modal immediately");
      onWarningRef.current();
    }

    logoutTimer.current = setTimeout(async () => {
      console.log("[Activity] Session expired — logging out");
      await onLogoutRef.current();
    }, Math.max(expiryMs, 0));
  }, []);

  // Called on dismissWarning — uses fresh server timestamps to resync timers
  const updateExpiry = useCallback((idleExpiresAt: string, absoluteExpiresAt: string) => {
    if (isPausedRef.current) return;
    console.log(`[Activity] Expiry updated from server — idle: ${idleExpiresAt}, absolute: ${absoluteExpiresAt}`);
    scheduleTimers(idleExpiresAt, absoluteExpiresAt);
  }, [scheduleTimers]);

  const markActive = useCallback(() => {
    if (isPausedRef.current) return;
    isActiveRef.current = true;
  }, []);

  const start = useCallback((idleExpiresAt: string, absoluteExpiresAt: string) => {
    console.log("[Activity] Tracking started — listening for", ACTIVITY_EVENTS.length, "events");
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, markActive, { passive: true }));
    scheduleTimers(idleExpiresAt, absoluteExpiresAt);

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
      const res = await execute<HeartbeatResponse>(API.auth.heartbeat, { method: "POST" });
      if (res?.ok && res.idleExpiresAt && res.absoluteExpiresAt) {
        console.log("[Heartbeat] Server responded ok — resyncing timers");
        scheduleTimers(res.idleExpiresAt, res.absoluteExpiresAt);
      }
    }, HEARTBEAT_MS);
  }, [execute, markActive, scheduleTimers]);

  const stop = useCallback(() => {
    console.log("[Activity] Tracking stopped — removing listeners and clearing timers");
    ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, markActive));
    if (warningTimer.current)   clearTimeout(warningTimer.current);
    if (logoutTimer.current)    clearTimeout(logoutTimer.current);
    if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
  }, [markActive]);

  return { start, stop, updateExpiry };
}
