import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAudioPreferences,
  DEFAULT_AUDIO_PREFERENCES,
  getAudioPreferences,
  normalizeAudioPreferences,
  saveAudioPreferences,
} from "./audioPreferences";

describe("audio preferences", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    });
  });

  it("returns defaults when no preference has been saved", () => {
    expect(getAudioPreferences()).toEqual(DEFAULT_AUDIO_PREFERENCES);
  });

  it("saves and restores enabled state and volume", () => {
    expect(saveAudioPreferences({ enabled: false, volume: 0.75 })).toEqual({ enabled: false, volume: 0.75 });
    expect(getAudioPreferences()).toEqual({ enabled: false, volume: 0.75 });
  });

  it("clamps invalid volume values and preserves a valid enabled flag", () => {
    expect(normalizeAudioPreferences({ enabled: true, volume: 4 })).toEqual({ enabled: true, volume: 1 });
    expect(normalizeAudioPreferences({ enabled: false, volume: -1 })).toEqual({ enabled: false, volume: 0 });
    expect(normalizeAudioPreferences({ enabled: "yes", volume: "bad" })).toEqual(DEFAULT_AUDIO_PREFERENCES);
  });

  it("falls back safely for malformed localStorage and supports clearing", () => {
    localStorage.setItem("trade_arena_audio_preferences_v1", "not-json");
    expect(getAudioPreferences()).toEqual(DEFAULT_AUDIO_PREFERENCES);
    saveAudioPreferences({ enabled: false });
    clearAudioPreferences();
    expect(getAudioPreferences()).toEqual(DEFAULT_AUDIO_PREFERENCES);
  });
});
