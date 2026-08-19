import { describe, expect, it, vi } from "vitest";
import { getAudioHealth, playAudioCue, retryAudioEngine, setAudioEngineEnabled, setAudioEngineVolume, triggerVisualFx } from "./audioBridge";

describe("audio bridge helper", () => {
  it("safely handles missing window audio globals without throwing", () => {
    expect(() => playAudioCue("success")).not.toThrow();
    expect(() => triggerVisualFx("win")).not.toThrow();
    expect(() => setAudioEngineEnabled(true)).not.toThrow();
    expect(() => setAudioEngineVolume(0.5)).not.toThrow();
  });

  it("reports unavailable when browser audio globals are missing", () => {
    expect(getAudioHealth()).toMatchObject({ status: "UNAVAILABLE", canRetry: false });
  });

  it("reports blocked and becomes ready after a successful user-gesture retry", async () => {
    const resume = vi.fn().mockResolvedValue(undefined);
    const context = { state: "suspended", resume };
    const AudioContext = vi.fn(() => context);
    vi.stubGlobal("window", { AudioContext, SFX: { ctx: context, initialized: true } });

    expect(getAudioHealth()).toMatchObject({ status: "BLOCKED", canRetry: true });
    context.state = "running";
    expect(await retryAudioEngine()).toMatchObject({ status: "READY", canRetry: true });
    expect(getAudioHealth().status).toBe("READY");

    vi.unstubAllGlobals();
  });

  it("invokes mock SFX and FX methods when present", () => {
    const takeProfit = vi.fn();
    const flash = vi.fn();
    const win = { SFX: { takeProfit }, FX: { flash } };
    vi.stubGlobal("window", win);

    playAudioCue("success");
    expect(takeProfit).toHaveBeenCalled();

    triggerVisualFx("flash", "rgba(0,0,0,0.5)");
    expect(flash).toHaveBeenCalledWith("rgba(0,0,0,0.5)");

    vi.unstubAllGlobals();
  });
});
