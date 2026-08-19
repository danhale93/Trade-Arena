export type AudioHealth = "READY" | "BLOCKED" | "UNAVAILABLE";

export type AudioHealthModel = {
  status: AudioHealth;
  label: string;
  detail: string;
  canRetry: boolean;
};

type AudioContextLike = {
  state?: string;
  resume?: () => Promise<void>;
};

type SfxEngineLike = {
  ctx?: AudioContextLike | null;
  initialized?: boolean;
  muted?: boolean;
  setMuted?: (muted: boolean) => void;
  setVolume?: (volume: number) => void;
  win?: () => Promise<void>;
  loss?: () => Promise<void>;
  stopLoss?: () => Promise<void>;
  takeProfit?: () => Promise<void>;
  tradeOpen?: () => Promise<void>;
};

declare global {
  interface Window {
    ACOUSTIC?: {
      toggleSFX?: () => void;
      onWin?: (botId?: number, pnl?: number) => void;
      onLoss?: (botId?: number, pnl?: number, isStopLoss?: boolean) => void;
      onTradeOpen?: (botId?: number, token?: string, method?: string) => void;
      onTakeProfit?: (botId?: number) => void;
      getConfig?: () => { sfx?: { enabled?: boolean; volume?: number } };
    };
    SFX?: SfxEngineLike;
    FX?: {
      init?: () => void;
      flash?: (color: string, duration?: number) => void;
      winEffect?: () => void;
      lossEffect?: () => void;
      enable?: () => void;
      disable?: () => void;
    };
    fxEngine?: {
      init?: () => void;
      flash?: (color: string, duration?: number) => void;
      winEffect?: () => void;
      lossEffect?: () => void;
      enabled?: boolean;
    };
    AudioContext?: new () => AudioContextLike;
    webkitAudioContext?: new () => AudioContextLike;
  }
}

export function getAudioHealth(): AudioHealthModel {
  if (typeof window === "undefined") {
    return { status: "UNAVAILABLE", label: "UNAVAILABLE", detail: "Audio is only available in a browser.", canRetry: false };
  }
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  const sfx = window.SFX;
  if (!AudioContextCtor || !sfx) {
    return { status: "UNAVAILABLE", label: "UNAVAILABLE", detail: "Browser audio support or the sound engine is unavailable.", canRetry: false };
  }
  if (sfx.ctx?.state === "suspended" || !sfx.initialized) {
    return { status: "BLOCKED", label: "BLOCKED", detail: "Click retry or interact with the page to allow browser audio.", canRetry: true };
  }
  if (sfx.ctx?.state && sfx.ctx.state !== "running") {
    return { status: "BLOCKED", label: "BLOCKED", detail: `Browser AudioContext is ${sfx.ctx.state}.`, canRetry: true };
  }
  return { status: "READY", label: "READY", detail: "Audio playback is available.", canRetry: true };
}

export async function retryAudioEngine(): Promise<AudioHealthModel> {
  if (typeof window === "undefined") return getAudioHealth();
  try {
    const sfx = window.SFX;
    if (!sfx) return getAudioHealth();
    if (!sfx.initialized && window.AudioContext) {
      sfx.ctx = new window.AudioContext();
      sfx.initialized = true;
    }
    if (sfx.ctx?.state === "suspended") await sfx.ctx.resume?.();
  } catch (err) {
    console.warn("Browser blocked audio playback:", err);
  }
  return getAudioHealth();
}

export function playAudioCue(type: "success" | "warning" | "trade" | "alert") {
  if (typeof window === "undefined" || !window.SFX) return;
  try {
    const sfx = window.SFX;
    if (type === "success") void sfx.takeProfit?.();
    else if (type === "warning" || type === "alert") void sfx.stopLoss?.();
    else void sfx.tradeOpen?.();
  } catch (err) {
    console.warn("Audio cue playback failed:", err);
  }
}

export function triggerVisualFx(type: "win" | "loss" | "flash", color = "rgba(0,219,233,0.15)") {
  if (typeof window === "undefined") return;
  try {
    const fx = window.fxEngine || window.FX;
    if (!fx) return;
    fx.init?.();
    if (type === "win") fx.winEffect?.();
    else if (type === "loss") fx.lossEffect?.();
    else fx.flash?.(color);
  } catch (err) {
    console.warn("Visual FX trigger failed:", err);
  }
}

export function setAudioEngineEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (window.SFX?.setMuted) window.SFX.setMuted(!enabled);
    const config = window.ACOUSTIC?.getConfig?.();
    if (config?.sfx && config.sfx.enabled !== enabled) window.ACOUSTIC?.toggleSFX?.();
    if (window.fxEngine && typeof window.fxEngine.enabled === "boolean") window.fxEngine.enabled = enabled;
    if (enabled) window.FX?.enable?.();
    else window.FX?.disable?.();
  } catch (err) {
    console.warn("Failed to set audio enabled state:", err);
  }
}

export function setAudioEngineVolume(volume: number) {
  if (typeof window === "undefined") return;
  try {
    window.SFX?.setVolume?.(volume);
  } catch (err) {
    console.warn("Failed to set audio volume:", err);
  }
}
