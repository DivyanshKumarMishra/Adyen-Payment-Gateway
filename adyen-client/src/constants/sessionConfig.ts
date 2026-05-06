// TEST VALUES — restore before production
export const HEARTBEAT_MS      =  5 * 1000;  // every 5s  | prod: 60 * 1000
export const WARNING_BUFFER_MS = 15 * 1000;  // warn 15s before expiry | prod: 2 * 60 * 1000

export const WARNING_COUNTDOWN_S = WARNING_BUFFER_MS / 1000;
