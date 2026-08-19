export type AudioBridgeState = {
  sfxEnabled: boolean;
  fxEnabled: boolean;
  volume: number;
};

declare global {
  interface Window {
    AcousticCore?: {
      setSfxEnabled?: (enabled: boolean) => void;
      setSfxVolume?: (volume: number) => void;
      setFxEnabled?: (enabled: boolean) => void;
      playSuccess?: () => void;
      playWarning?: () => void;
      playTrade?: () => void;
      playAlert?: () => void;
    };
    FXEngine?: new () => {
      init?: () => void;
      flash?: (color: string, duration?: number) => void;
      winEffect?: () => void;
      lossEffect?: () => void;
    };
    fxEngine?: {
      init?: () => void;
      flash?: (color: string, duration?: number) => void;
      winEffect?: () => void;
      lossEffect?: () => void;
    };
  }
}

export function playAudioCue(type: "success" | "warning" | "trade" | "alert") {
  if (typeof window === "undefined") return;
  try {
    const core = window.AcousticCore;
    if (!core) return;
    if (type === "success" && typeof core.playSuccess === "function") core.playSuccess();
    else if (type === "warning" && typeof core.playWarning === "function") core.playWarning();
    else if (type === "trade" && typeof core.playTrade === "function") core.playTrade();
    else if (type === "alert" && typeof core.playAlert === "function") core.playAlert();
  } catch (err) {
    console.warn("Audio cue playback failed:", err);
  }
}

export function triggerVisualFx(type: "win" | "loss" | "flash", color = "rgba(0,219,233,0.15)") {
  if (typeof window === "undefined") return;
  try {
    const fx = window.fxEngine || (window.FXEngine ? new window.FXEngine() : null);
    if (!fx) return;
    if (typeof fx.init === "function") fx.init();
    if (type === "win" && typeof fx.winEffect === "function") fx.winEffect();
    else if (type === "loss" && typeof fx.lossEffect === "function") fx.lossEffect();
    else if (typeof fx.flash === "function") fx.flash(color);
  } catch (err) {
    console.warn("Visual FX trigger failed:", err);
  }
}

export function setAudioEngineEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.AcousticCore?.setSfxEnabled?.(enabled);
    if (window.fxEngine && "enabled" in window.fxEngine) (window.fxEngine as any).enabled = enabled;
  } catch (err) {
    console.warn("Failed to set audio enabled state:", err);
  }
}

export function setAudioEngineVolume(volume: number) {
  if (typeof window === "undefined") return;
  try {
    window.AcousticCore?.setSfxVolume?.(volume);
  } catch (err) {
    console.warn("Failed to set audio volume:", err);
  }
}
