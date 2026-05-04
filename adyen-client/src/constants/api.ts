const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export const API = {
  auth: {
    login: `${API_BASE}/api/auth/login`,
    logout: `${API_BASE}/api/auth/logout`,
    me: `${API_BASE}/api/auth/me`,
  },
  adyen: {
    base: `${API_BASE}/api/adyen`,
    sessions: `${API_BASE}/api/adyen/sessions`,
    webhooks: `${API_BASE}/api/adyen/webhooks`,
  },
};
