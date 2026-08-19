import { describe, expect, it, vi } from "vitest";
import { playAudioCue, setAudioEngineEnabled, setAudioEngineVolume, triggerVisualFx } from "./audioBridge";

describe("audio bridge helper", () => {
  it("safely handles missing window audio globals without throwing", () => {
    expect(() => playAudioCue("success")).not.toThrow();
    expect(() => triggerVisualFx("win")).not.toThrow();
    expect(() => setAudioEngineEnabled(true)).not.toThrow();
    expect(() => setAudioEngineVolume(0.5)).not.toThrow();
  });

  it("invokes mock acoustic core and fx methods when present", () => {
    const playSuccess = vi.fn();
    const flash = vi.fn();
    const win = { AcousticCore: { playSuccess, setSfxVolume: vi.fn() }, fxEngine: { flash } };
    vi.stubGlobal("window", win);

    playAudioCue("success");
    expect(playSuccess).toHaveBeenCalled();

    triggerVisualFx("flash", "rgba(0,0,0,0.5)");
    expect(flash).toHaveBeenCalledWith("rgba(0,0,0,0.5)");

    vi.unstubAllGlobals();
  });
});
