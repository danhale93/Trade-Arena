const STORAGE_KEY = "trade_arena_mm_session_meta_v1";

export interface SessionMeta {
  connected: boolean;
  expiresAt: number | null;
  lastValidatedAt: string;
}

export function saveLocalSessionMeta(meta: { connected: boolean; token?: string | null }) {
  try {
    let expiresAt: number | null = null;
    if (meta.token) {
      const parts = meta.token.trim().split(".");
      if (parts.length === 3) {
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const payload = JSON.parse(jsonPayload);
        if (payload && typeof payload.exp === "number") {
          expiresAt = payload.exp * 1000;
        }
      }
    }
    if (!expiresAt) {
      expiresAt = Date.now() + 30 * 24 * 3600 * 1000; // 30 day default
    }
    const data: SessionMeta = {
      connected: meta.connected,
      expiresAt,
      lastValidatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function getLocalSessionMeta(): SessionMeta | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionMeta;
    if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearLocalSessionMeta() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
