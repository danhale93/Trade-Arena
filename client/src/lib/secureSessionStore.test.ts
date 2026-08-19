import { describe, it, expect, beforeEach } from "vitest";
import { saveLocalSessionMeta, getLocalSessionMeta, clearLocalSessionMeta } from "./secureSessionStore";

describe("secureSessionStore", () => {
  beforeEach(() => {
    if (typeof globalThis.localStorage !== "undefined") {
      globalThis.localStorage.clear();
    } else {
      const store: Record<string, string> = {};
      (globalThis as any).localStorage = {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { Object.keys(store).forEach(k => delete store[k]); },
      };
    }
  });

  it("saves and retrieves non-sensitive session metadata", () => {
    saveLocalSessionMeta({ connected: true });
    const meta = getLocalSessionMeta();
    expect(meta).not.toBeNull();
    expect(meta?.connected).toBe(true);
    expect(meta?.expiresAt).toBeTypeOf("number");
  });

  it("clears metadata correctly", () => {
    saveLocalSessionMeta({ connected: true });
    clearLocalSessionMeta();
    expect(getLocalSessionMeta()).toBeNull();
  });
});
