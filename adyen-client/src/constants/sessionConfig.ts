// TEST VALUES — restore before production
export const IDLE_TIMEOUT_MS = 60 * 1000;  // 60s      | prod: 10 * 60 * 1000
export const WARNING_AT_MS   = 45 * 1000;  // 45s      | prod:  8 * 60 * 1000
export const HEARTBEAT_MS    =  5 * 1000;  // every 5s | prod:      60 * 1000

export const WARNING_COUNTDOWN_S = (IDLE_TIMEOUT_MS - WARNING_AT_MS) / 1000;
