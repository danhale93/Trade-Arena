const STORAGE_KEY = "trade_arena_audio_preferences_v1";

export type AudioPreferences = {
  enabled: boolean;
  volume: number;
};

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  enabled: true,
  volume: 0.5,
};

function normalizeVolume(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) return DEFAULT_AUDIO_PREFERENCES.volume;
  return Math.min(1, Math.max(0, numberValue));
}

export function normalizeAudioPreferences(value: unknown): AudioPreferences {
  if (!value || typeof value !== "object") return { ...DEFAULT_AUDIO_PREFERENCES };
  const candidate = value as Partial<AudioPreferences>;
  return {
    enabled: typeof candidate.enabled === "boolean" ? candidate.enabled : DEFAULT_AUDIO_PREFERENCES.enabled,
    volume: normalizeVolume(candidate.volume),
  };
}

export function getAudioPreferences(): AudioPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AUDIO_PREFERENCES };
    return normalizeAudioPreferences(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_AUDIO_PREFERENCES };
  }
}

export function saveAudioPreferences(preferences: Partial<AudioPreferences>) {
  const normalized = normalizeAudioPreferences({ ...getAudioPreferences(), ...preferences });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Storage may be unavailable in private browsing or restricted webviews.
  }
  return normalized;
}

export function clearAudioPreferences() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}
