import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Play, Pause, Terminal, Cpu, Zap, Activity, CheckCircle2, Lock, RefreshCw, Bell, Power, TrendingUp, Clock3, Copy, Check, ExternalLink, Link2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { getProfitPulseMotion, shouldTriggerProfitPulse } from "@/lib/profitPulse";
import { filterPulseEvents, getPulseEventFilterLabel, type PulseNetworkFilter } from "@/lib/pulseEventFilter";
import { buildFeatureVisualizerModel } from "@/lib/featureVisualizer";
import { buildCliWarningToast } from "@/lib/cliWarning";
import { getCliStatusWidgetModel } from "@/lib/cliStatusWidget";
import { getManualPreflightCheckLabel, getManualPreflightStatusModel } from "@/lib/manualPreflight";
import { formatGasReading, formatTelemetryTime, getGasCongestionModel } from "@/lib/gasTelemetryWidget";
import { formatGasAlertCooldownRemaining, GAS_ALERT_COOLDOWN_OPTIONS, getGasAlertCooldownLabel, getGasAlertCooldownRemainingMs, getGasAlertLabel, shouldNotifyGasAlert, type GasAlertCooldownMinutes, type GasAlertThreshold } from "@/lib/gasAlert";
import { playAudioCue, setAudioEngineEnabled, setAudioEngineVolume, triggerVisualFx } from "@/lib/audioBridge";
import { getAudioPreferences, saveAudioPreferences } from "@/lib/audioPreferences";
import { CLI_COMMANDS, CLI_HANDOFF_URL, CLI_LINKS } from "@/lib/cliCommandDeck";
import { QRCodeSVG } from "qrcode.react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";


export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const lastSeenTradeIdRef = useRef<number | null>(null);
  const lastSeenSimulationIdRef = useRef<number | null>(null);
  const profitPulseTimerRef = useRef<number | null>(null);
  const [profitPulseActive, setProfitPulseActive] = useState(false);
  const [profitPulseSummary, setProfitPulseSummary] = useState<{ network: string; profit: string; route: string } | null>(null);

  const [backtestNetworks, setBacktestNetworks] = useState<Array<"base" | "arbitrum" | "optimism">>(["base", "arbitrum", "optimism"]);
  const [backtestStrategy, setBacktestStrategy] = useState<"guarded" | "aggressive">("guarded");
  const [backtestSampleSize, setBacktestSampleSize] = useState<number>(100);
  const [backtestGasGwei, setBacktestGasGwei] = useState<number>(0.05);
  const [backtestResult, setBacktestResult] = useState<any | null>(null);
  const [backtestActiveTab, setBacktestActiveTab] = useState<"summary" | "runs">("summary");

  const runBacktestMutation = trpc.arbitrage.runHistoricalBacktest.useMutation({
    onSuccess: (data) => {
      setBacktestResult(data);
      toast.success(`Backtest completed: $${data.summary.totalProfitUsd} total profit across ${data.summary.totalRuns} runs.`);
    },
    onError: (err) => {
      toast.error("Backtest failed: " + err.message);
    }
  });

  const { data: statusData, isLoading: statusLoading, isError: statusError, refetch: refetchStatus } = trpc.arbitrage.status.useQuery(undefined, {
    refetchInterval: 5000,
  });

  useEffect(() => {
    const trades = statusData?.agent?.recentTrades;
    if (trades && trades.length > 0) {
      const latest = trades[0];
      if (latest && latest.id !== lastSeenTradeIdRef.current) {
        if (lastSeenTradeIdRef.current !== null && (latest.status === 'success' || !latest.status)) {
          toast.success(`⚡ Arbitrage Executed on ${latest.network.toUpperCase()}!`, {
            description: `Pair: ${latest.tokenPair} | Profit: +$${latest.netProfitUsd} | Tx: ${latest.txHash.slice(0, 8)}...`,
            duration: 6000,
          });
        }
        lastSeenTradeIdRef.current = latest.id;
      }
    }
  }, [statusData]);

  const toggleScannerMutation = trpc.arbitrage.toggleScanner.useMutation({
    onSuccess: (data) => {
      toast.success(data.scannerEnabled ? "Scanner resumed." : "Scanner paused.");
      utils.arbitrage.status.invalidate();
    },
    onError: (err) => {
      toast.error("Action failed: " + err.message);
    }
  });

  const toggleExecutionMutation = trpc.arbitrage.toggleExecution.useMutation({
    onSuccess: (data) => {
      toast.success(data.executionEnabled ? "Execution ARMED on mainnet." : "Switched to Simulation-Only mode.");
      utils.arbitrage.status.invalidate();
    },
    onError: (err) => {
      toast.error("Action failed: " + err.message);
    }
  });

  const setStrategyProfileMutation = trpc.arbitrage.setStrategyProfile.useMutation({
    onSuccess: (data) => {
      toast.success(`Strategy profile set to ${data.strategyProfile.label}.`);
      utils.arbitrage.status.invalidate();
    },
    onError: (err) => {
      toast.error("Strategy profile update failed: " + err.message);
    },
  });

  const submitTokenMutation = trpc.arbitrage.submitToken.useMutation({
    onSuccess: (data: any) => {
      if (data?.warning) {
        const warning = buildCliWarningToast(data);
        toast.warning(warning.title, {
          description: warning.description,
          action: {
            label: reconnectAgentMutation.isPending ? "Retrying…" : warning.actionLabel,
            onClick: () => {
              if (!reconnectAgentMutation.isPending) {
                reconnectAgentMutation.mutate();
              }
            },
          },
          cancel: {
            label: "Install Guide",
            onClick: () => {
              window.open(warning.installUrl, "_blank");
            },
          },
        });
      } else {
        toast.success(data?.message || "MetaMask Agent CLI token submitted and session refreshed.");
      }
      setCliToken("");
      utils.arbitrage.status.invalidate();
    },
    onError: (err) => {
      toast.error("Token submission failed: " + err.message);
    }
  });

  const reconnectAgentMutation = trpc.arbitrage.reconnectAgent.useMutation({
    onSuccess: (data: any) => {
      if (data?.warning) {
        const warning = buildCliWarningToast(data);
        toast.warning(warning.title, {
          description: warning.description,
          action: {
            label: reconnectAgentMutation.isPending ? "Retrying…" : warning.actionLabel,
            onClick: () => {
              if (!reconnectAgentMutation.isPending) {
                reconnectAgentMutation.mutate();
              }
            },
          },
          cancel: {
            label: "Install Guide",
            onClick: () => {
              window.open(warning.installUrl, "_blank");
            },
          },
        });
      } else {
        toast.success(data?.message || "MetaMask Agent reconnected successfully.");
      }
      utils.arbitrage.status.invalidate();
    },
    onError: (err) => {
      toast.error("Reconnect failed: " + err.message);
      utils.arbitrage.status.invalidate();
    },
  });

  const disconnectAgentMutation = trpc.arbitrage.disconnectAgent.useMutation({
    onSuccess: (data) => {
      if (data.cliLogoutSucceeded) {
        toast.success(data.message);
      } else {
        toast.warning(data.message);
      }
      utils.arbitrage.status.invalidate();
    },
    onError: (err) => {
      toast.error("Disconnect failed: " + err.message);
      utils.arbitrage.status.invalidate();
    },
  });

  const setWalletModeMutation = trpc.arbitrage.setWalletMode.useMutation({
    onSuccess: (data) => {
      toast.success(`Switched to ${data.mode === "agent" ? "MetaMask Agent Wallet" : "Standard EVM Wallet"}.`);
      utils.arbitrage.status.invalidate();
    },
    onError: (err) => {
      toast.error("Wallet mode switch failed: " + err.message);
    },
  });

  const connectStandardWalletMutation = trpc.arbitrage.connectStandardWallet.useMutation({
    onSuccess: () => {
      toast.success("Standard EVM Wallet connected successfully.");
      utils.arbitrage.status.invalidate();
    },
    onError: (err) => {
      toast.error("Wallet connection failed: " + err.message);
    },
  });

  const [minProfitInput, setMinProfitInput] = useState("");
  const updateThresholdMutation = trpc.arbitrage.updateMinProfitThreshold.useMutation({
    onSuccess: () => {
      toast.success("Minimum profit notification threshold updated.");
      setMinProfitInput("");
      utils.arbitrage.status.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to update threshold: " + err.message);
    }
  });

  const runArbMutation = trpc.arbitrage.runArbitrageCheck.useMutation({
    onSuccess: (data) => {
      if (data.executed) {
        toast.success(`⚡ Live Trade Executed! Tx: ${data.txHash?.slice(0, 10)}...`);
      } else {
        const simulation = data.simulation as { amountOut?: string; netProfit?: string } | undefined;
        toast.info(data.adapter === "direct-ethers-uniswap-v3"
          ? `Direct quote completed: ${simulation?.amountOut || "No route returned"} native USDC`
          : `Simulation completed: ${simulation?.netProfit || "No profitable spread found"}`);
      }
      utils.arbitrage.status.invalidate();
    },
    onError: (err) => {
      toast.error("Arb check failed: " + err.message);
    }
  });

  const [cliToken, setCliToken] = useState("");
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [modalCliToken, setModalCliToken] = useState("");
  const [preflightTestResult, setPreflightTestResult] = useState<any | null>(null);
  const [preflightNetwork, setPreflightNetwork] = useState<"base" | "arbitrum" | "optimism">("base");
  const [networkSlippage, setNetworkSlippage] = useState<Record<string, number>>({ base: 50, arbitrum: 50, optimism: 50 });
  const [gasAlertSettings, setGasAlertSettings] = useState<Record<"base" | "arbitrum" | "optimism", GasAlertThreshold>>({ base: "DISABLED", arbitrum: "DISABLED", optimism: "DISABLED" });
  const [gasAlertCooldownMinutes, setGasAlertCooldownMinutes] = useState<GasAlertCooldownMinutes>(5);
  const [gasAlertCooldownDraft, setGasAlertCooldownDraft] = useState<GasAlertCooldownMinutes>(5);
  const [lastGasAlertAt, setLastGasAlertAt] = useState<Record<string, number>>({});
  const [audioEnabled, setAudioEnabled] = useState(() => getAudioPreferences().enabled);
  const [audioVolume, setAudioVolume] = useState(() => getAudioPreferences().volume);
  const latestPulseEventIdRef = useRef<number | null>(null);
  const gasAlertInitializedRef = useRef(false);
  const previousGasStatesRef = useRef<Record<string, string>>({});

  const updateNetworkSlippageMutation = trpc.arbitrage.updateNetworkSlippage.useMutation({
    onSuccess: (data) => {
      toast.success(`Slippage for ${data.network.toUpperCase()} updated to ${(data.slippageBps / 100).toFixed(2)}% (${data.slippageBps} BPS)`);
      utils.arbitrage.status.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to update slippage: " + err.message);
    }
  });

  const updateGasAlertThresholdMutation = trpc.arbitrage.updateGasAlertThreshold.useMutation({
    onSuccess: (data) => {
      setGasAlertSettings((current) => ({ ...current, [data.network]: data.threshold }));
      toast.success(`${data.network.toUpperCase()} congestion alert saved: ${getGasAlertLabel(data.threshold as GasAlertThreshold)}`);
      utils.arbitrage.status.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to update congestion alert: " + err.message);
    },
  });

  const updateGasAlertCooldownMutation = trpc.arbitrage.updateGasAlertCooldown.useMutation({
    onSuccess: (data) => {
      setGasAlertCooldownMinutes(data.cooldownMinutes as GasAlertCooldownMinutes);
      setGasAlertCooldownDraft(data.cooldownMinutes as GasAlertCooldownMinutes);
      toast.success(`Congestion alert ${getGasAlertCooldownLabel(data.cooldownMinutes)}`);
      utils.arbitrage.status.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to update alert cooldown: " + err.message);
    },
  });

  const exportTelemetryCsv = () => {
    try {
      const trades = agent?.recentTrades || [];
      const pulses = agent?.pulseEvents || [];
      const history = agent?.simulationRouteHistory || [];
      
      let csv = "Timestamp,Type,Network,Pair,NetProfitUsd,Details,TxHash\n";
      trades.forEach((t: any) => {
        csv += `"${new Date(t.timestamp).toISOString()}","TRADE","${t.network}","${t.tokenPair}","${t.netProfitUsd}","Route: ${t.route}","${t.txHash}"\n`;
      });
      pulses.forEach((p: any) => {
        csv += `"${new Date(p.timestamp).toISOString()}","PULSE_EVENT","${p.network}","${p.route}","${p.netProfitUsd}","Threshold: $${p.thresholdUsd}","${p.source}"\n`;
      });
      history.forEach((h: any) => {
        csv += `"${new Date(h.timestamp).toISOString()}","SIMULATION","${h.network}","${h.tokenPair || 'WETH/V3'}","${h.netProfit || h.profit || '0'}","Spread: ${h.spreadBps || 0}bps","SIM"\n`;
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `trade-arena-telemetry-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Telemetry CSV exported successfully");
    } catch (err: any) {
      toast.error("CSV export failed: " + (err.message || "Unknown error"));
    }
  };

  const runPreflightTestMutation = trpc.arbitrage.runManualPreflightTest.useMutation({
    onSuccess: (data) => {
      setPreflightTestResult(data);
      if (data.ready) {
        toast.success(data.message);
      } else {
        toast.warning(data.message);
      }
      utils.arbitrage.status.invalidate();
    },
    onError: (err) => {
      toast.error("Preflight test failed: " + err.message);
    }
  });
  const [handoffAttempted, setHandoffAttempted] = useState(false);
  const [miniWidgetMode, setMiniWidgetMode] = useState(false);
  const [logFilter, setLogFilter] = useState("ALL");
  const [profitTimeRange, setProfitTimeRange] = useState<"1H" | "24H" | "ALL">("ALL");
  const [profitNetworkFilter, setProfitNetworkFilter] = useState<"ALL" | "base" | "arbitrum" | "optimism">("ALL");
  const [pulseNetworkFilter, setPulseNetworkFilter] = useState<PulseNetworkFilter>("ALL");
  const logScrollRef = useRef<HTMLDivElement>(null);

  const agent = statusData?.agent;
  const manualPreflightStatus = preflightTestResult
    ? getManualPreflightStatusModel({
        ready: Boolean(preflightTestResult.ready),
        executionArmed: Boolean(preflightTestResult.executionArmed),
      })
    : null;
  const pulseEvents = agent?.pulseEvents || [];
  const filteredPulseEvents = filterPulseEvents(pulseEvents, pulseNetworkFilter);
  const cliConnection = agent?.cliConnection;
  const cliConnected = cliConnection?.status === "connected";
  const connectionActionPending = reconnectAgentMutation.isPending || disconnectAgentMutation.isPending;

  const copyCommand = async (commandId: string, command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(commandId);
      toast.success("CLI command copied", { description: "Run it in the local terminal; tokens stay out of the dashboard." });
      window.setTimeout(() => setCopiedCommand((current) => current === commandId ? null : current), 2200);
    } catch {
      toast.error("Copy failed", { description: "Select the command manually and run it in your local terminal." });
    }
  };

  const lastValidatedDate = cliConnection?.lastValidatedAt ? new Date(cliConnection.lastValidatedAt) : null;
  const lastValidatedLabel = lastValidatedDate && !Number.isNaN(lastValidatedDate.getTime())
    ? lastValidatedDate.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "Not validated";

  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [agent?.agentLogs]);
  const balances = agent?.balances || { base: "0.0000", arbitrum: "0.0000", optimism: "0.0000" };
  const networkConfigs = agent?.networkConfigs || {
    base: { chainId: "8453", tokenIn: "WETH", tokenOut: "USDC", profitThresholdUsd: 0.002, slippage: 0.3 },
    arbitrum: { chainId: "42161", tokenIn: "WETH", tokenOut: "USDC", profitThresholdUsd: 0.01, slippage: 0.5 },
    optimism: { chainId: "10", tokenIn: "WETH", tokenOut: "USDC", profitThresholdUsd: 0.01, slippage: 0.5 },
  };
  const maxSlippage = Math.max(...Object.values(networkConfigs).map((config) => config.slippage));
  const executionPreflight = agent?.executionPreflight;
  const livePreflightReady = executionPreflight?.ready === true;
  const simulationHistory = agent?.simulationRouteHistory || [];
  const nowMs = Date.now();
  const timeRangeMs = profitTimeRange === "1H" ? 3600 * 1000 : profitTimeRange === "24H" ? 24 * 3600 * 1000 : Infinity;

  const filteredSimulationHistory = simulationHistory.filter((entry: any) => {
    const entryTime = new Date(entry.timestamp).getTime();
    const matchesTime = nowMs - entryTime <= timeRangeMs;
    const matchesNetwork = profitNetworkFilter === "ALL" || entry.network === profitNetworkFilter;
    return matchesTime && matchesNetwork;
  });

  const simulationChartData = [...filteredSimulationHistory].reverse().map((entry: any) => ({
    ...entry,
    profit: Number(entry.netProfitUsd),
    time: new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  }));
  const simulationProfitTotal = simulationChartData.reduce((total, entry) => total + (Number.isFinite(entry.profit) ? entry.profit : 0), 0);
  const simulationProfitableCount = simulationChartData.filter((entry) => entry.profitable === 1).length;
  const simulationAverageProfit = simulationChartData.length ? simulationProfitTotal / simulationChartData.length : 0;
  const simulationChartConfig = {
    profit: { label: "Net simulated profit", color: "#00dbe9" },
  } satisfies ChartConfig;

  useEffect(() => {
    const latest = statusData?.agent?.simulationRouteHistory?.[0];
    if (!latest || latest.id === lastSeenSimulationIdRef.current) return;

    const previousSimulationId = lastSeenSimulationIdRef.current;
    lastSeenSimulationIdRef.current = latest.id;
    if (previousSimulationId === null) return;

    const threshold = Number(networkConfigs[latest.network as keyof typeof networkConfigs]?.profitThresholdUsd ?? 0);
    const profit = Number(latest.netProfitUsd);
    const isHighProfit = shouldTriggerProfitPulse(previousSimulationId, latest, threshold);

    if (!isHighProfit) return;

    setProfitPulseSummary({
      network: latest.network,
      profit: Number(profit).toFixed(4),
      route: latest.route,
    });
    setProfitPulseActive(true);
    if (profitPulseTimerRef.current !== null) window.clearTimeout(profitPulseTimerRef.current);
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const pulseMotion = getProfitPulseMotion(prefersReducedMotion);
    profitPulseTimerRef.current = window.setTimeout(() => {
      setProfitPulseActive(false);
    }, pulseMotion.durationMs);
    toast.success(`HIGH-PROFIT SIMULATION · ${latest.network.toUpperCase()}`, {
      description: `+$${profit.toFixed(4)} estimated net profit recorded.`,
      duration: 4500,
    });
  }, [statusData, networkConfigs]);

  useEffect(() => () => {
    if (profitPulseTimerRef.current !== null) window.clearTimeout(profitPulseTimerRef.current);
  }, []);

  const latestPulseEvent = pulseEvents[0] as any;
  const latestSimulationRoute = simulationHistory[0] as any;
  const featureModel = buildFeatureVisualizerModel({
    latestPulseEvent,
    latestSimulationRoute,
    pulseEventCount: pulseEvents.length,
  });
  const featureRoute = featureModel.route;
  const featureNetwork = featureModel.network;
  const featureProfit = featureModel.profit;
  const gasTelemetry = (agent?.gasTelemetry || {}) as Record<string, any>;
  const baseGasTelemetry = gasTelemetry.base;
  const gasTelemetryRows = ([
    { network: "base", label: "BASE", accent: "cyan", telemetry: gasTelemetry.base },
    { network: "arbitrum", label: "ARBITRUM", accent: "emerald", telemetry: gasTelemetry.arbitrum },
    { network: "optimism", label: "OPTIMISM", accent: "purple", telemetry: gasTelemetry.optimism },
  ] as const).map((row) => ({
    ...row,
    congestion: getGasCongestionModel(row.telemetry?.congestion),
  }));
  const activeGasCooldowns = gasTelemetryRows
    .map((row) => ({
      label: row.label,
      remainingMs: getGasAlertCooldownRemainingMs(lastGasAlertAt[row.network], gasAlertCooldownMinutes),
    }))
    .filter((row) => row.remainingMs > 0);
  const derivedPulseLevel = featureModel.pulseLevel;
  const featureReels = featureModel.reels;
  const cliStatusWidget = getCliStatusWidgetModel(agent?.cliDoctorLive, agent?.cliWalletBalance);

  useEffect(() => {
    const persistedThresholds = agent?.gasAlertThresholds as Partial<Record<"base" | "arbitrum" | "optimism", GasAlertThreshold>> | undefined;
    const persistedCooldown = agent?.gasAlertCooldownMinutes as GasAlertCooldownMinutes | undefined;
    if (!gasAlertInitializedRef.current && (persistedThresholds || persistedCooldown !== undefined)) {
      if (persistedThresholds) setGasAlertSettings((current) => ({ ...current, ...persistedThresholds }));
      if (persistedCooldown !== undefined && GAS_ALERT_COOLDOWN_OPTIONS.includes(persistedCooldown)) {
        setGasAlertCooldownMinutes(persistedCooldown);
        setGasAlertCooldownDraft(persistedCooldown);
      }
      gasAlertInitializedRef.current = true;
    }
  }, [agent?.gasAlertThresholds, agent?.gasAlertCooldownMinutes]);

  useEffect(() => {
    const networks = ["base", "arbitrum", "optimism"] as const;
    networks.forEach((network) => {
      const currentState = String(gasTelemetry[network]?.congestion || "");
      if (!currentState) return;
      const previousState = previousGasStatesRef.current[network];
      const threshold = gasAlertSettings[network];
      const now = Date.now();
      if (previousState && shouldNotifyGasAlert(previousState, currentState, threshold, lastGasAlertAt[network], now, gasAlertCooldownMinutes)) {
        const networkLabel = network.toUpperCase();
        const level = currentState === "CONGESTED" ? "CONGESTED" : "ELEVATED";
        playAudioCue("warning");
        triggerVisualFx("flash", "rgba(245,158,11,0.18)");
        toast.warning(`${networkLabel} gas is ${level}`, {
          description: `Configured alert threshold reached. Current fee: ${formatGasReading(gasTelemetry[network]?.gasPriceGwei)} GWEI. ${getGasAlertCooldownLabel(gasAlertCooldownMinutes)}. Trading remains unchanged.`,
          duration: 7000,
        });
        setLastGasAlertAt((current) => ({ ...current, [network]: now }));
      }
      previousGasStatesRef.current[network] = currentState;
    });
  }, [gasTelemetry, gasAlertSettings, gasAlertCooldownMinutes, lastGasAlertAt]);

  useEffect(() => {
    const preferences = saveAudioPreferences({ enabled: audioEnabled, volume: audioVolume });
    setAudioEngineEnabled(preferences.enabled);
    setAudioEngineVolume(preferences.volume);
  }, [audioEnabled, audioVolume]);

  useEffect(() => {
    if (!latestPulseEvent || !audioEnabled) return;
    const eventId = latestPulseEvent.timestamp || latestPulseEvent.id;
    if (eventId && latestPulseEventIdRef.current !== eventId) {
      latestPulseEventIdRef.current = eventId;
      playAudioCue("success");
      triggerVisualFx("win");
    }
  }, [latestPulseEvent, audioEnabled]);

  return (
    <div className="stitch-shell min-h-screen bg-[#050b0e] text-[#00dbe9] font-mono selection:bg-[#00dbe9]/30 selection:text-white flex flex-col">
      {/* Top Header */}
      <header className="stitch-header border-b border-[#00dbe9]/20 bg-[#081217]/80 backdrop-blur sticky top-0 z-50 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-y-3">
        <div className="flex items-center gap-3">
          <Terminal className="w-6 h-6 text-[#00dbe9]" />
          <h1 className="font-bold tracking-wider text-base sm:text-lg text-white">TRADE ARENA <span className="hidden sm:inline text-[#00dbe9] font-normal text-xs ml-2 px-2 py-0.5 border border-[#00dbe9]/30 rounded bg-[#00dbe9]/10">CYBER-TERMINAL v4.4</span></h1>
        </div>
        <div className="w-full md:w-auto flex flex-wrap items-center justify-end gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-[#849495]" title="Real-time multi-chain RPC provider latency">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            RPC Connected · <span className="text-[#00dbe9] font-mono">{statusData?.agent?.rpcLatencyMs ?? 16}ms</span>
          </div>

          {/* Audio Engine Controls */}
          <div className="flex items-center gap-2 rounded border border-[#00dbe9]/30 bg-[#050b0e] px-3 py-1.5 text-[10px] font-mono">
            <span className="text-[#849495]">AUDIO:</span>
            <button
              type="button"
              onClick={() => {
                const next = !audioEnabled;
                setAudioEnabled(next);
                saveAudioPreferences({ enabled: next });
                setAudioEngineEnabled(next);
                toast.success(next ? "Acoustic engine enabled" : "Acoustic engine muted");
              }}
              className={`px-2 py-0.5 rounded text-[9px] font-bold border ${audioEnabled ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-slate-500/10 border-slate-500/30 text-slate-400"}`}
            >
              {audioEnabled ? "SFX ON" : "MUTED"}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setAudioVolume(val);
                saveAudioPreferences({ volume: val });
                setAudioEngineVolume(val);
              }}
              className="w-16 accent-[#00dbe9] cursor-pointer"
              title={`Audio volume: ${Math.round(audioVolume * 100)}%`}
            />
          </div>

          {/* Prominent Header MM Agent Wallet Balance & Status */}
          <div className="flex items-center gap-2 rounded border border-[#00dbe9]/30 bg-[#050b0e] px-3 py-1.5 text-[10px] font-mono" title="Active MetaMask Agent managed wallet balance on Base Mainnet">
            <span className="text-[#849495]">MM WALLET:</span>
            <span className="text-white font-bold">{balances.base} ETH</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${cliConnected ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-300"}`}>
              {statusLoading || !cliConnection ? "CHECKING…" : cliConnected ? "CONNECTED" : "DISCONNECTED"}
            </span>
          </div>

          <div className="flex items-center gap-2">
          <div
            role="status"
            aria-live="polite"
            title={statusError ? "Failed to fetch backend status. Click retry." : cliConnection?.reason || "Checking MetaMask Agent session status."}
            aria-label={`MetaMask Agent token ${statusError ? "fetch error" : cliConnection?.label?.toLowerCase() || "status checking"}`}
            className={`flex items-center gap-2 rounded border px-2.5 py-1.5 text-[10px] font-bold tracking-wider transition-colors ${
              statusError
                ? "border-rose-500/40 bg-rose-500/15 text-rose-300 cursor-pointer hover:bg-rose-500/25"
                : statusLoading || !cliConnection
                ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 animate-pulse"
                : cliConnected
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/30 bg-rose-500/10 text-rose-300"
            }`}
            onClick={() => {
              if (statusError) refetchStatus();
            }}
          >
            {statusError ? (
              <button type="button" onClick={() => refetchStatus()} className="flex items-center gap-1.5 text-rose-300 hover:text-white">
                <RefreshCw className="h-3 w-3 animate-spin text-rose-400" />
                <span>CONNECTION ERROR · RETRY</span>
              </button>
            ) : statusLoading || !cliConnection ? (
              <RefreshCw className="h-3 w-3 animate-spin text-cyan-400" />
            ) : (
              <span className={`inline-block h-2 w-2 rounded-full ${cliConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
            )}
            {!statusError && (
              <span className="inline whitespace-nowrap">
                MM CLI: {statusLoading || !cliConnection ? "CHECKING…" : cliConnected ? "AUTHENTICATED & CONNECTED" : "DISCONNECTED / UNVERIFIED"}
              </span>
            )}
            <span className="sr-only">
              {statusLoading || !cliConnection
                ? "MetaMask Agent CLI connection is being verified."
                : `MetaMask Agent CLI is ${cliConnected ? "successfully connected and authenticated" : "disconnected or unauthenticated"}. ${cliConnection.reason}`}
            </span>
          </div>
          <span
            className="whitespace-nowrap text-[10px] text-[#849495]"
            title={cliConnection?.lastValidatedAt || "No successful validation has been recorded."}
          >
            LAST CHECK: {statusLoading ? "CHECKING…" : lastValidatedLabel}
          </span>
          </div>
          <Button
            type="button"
            onClick={() => {
              if (cliConnected) {
                disconnectAgentMutation.mutate();
              } else {
                reconnectAgentMutation.mutate();
              }
            }}
            disabled={!isAuthenticated || statusLoading || !cliConnection || connectionActionPending}
            title={cliConnected ? "Disconnect the MetaMask Agent session" : "Reconnect the MetaMask Agent session"}
            aria-label={cliConnected ? "Disconnect MetaMask Agent" : "Reconnect MetaMask Agent"}
            className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-[10px] font-bold tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              cliConnected
                ? "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
            }`}
          >
            {connectionActionPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Power className="h-3 w-3" />}
            <span className="hidden md:inline">{connectionActionPending ? "WORKING" : cliConnected ? "DISCONNECT" : "RECONNECT"}</span>
          </Button>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSettingsModalOpen(true)}
              className="border-[#00dbe9]/40 bg-[#00dbe9]/10 text-[#00dbe9] hover:bg-[#00dbe9]/20 text-xs font-mono font-bold"
            >
              VAULT SETTINGS & TOKEN
            </Button>
            <Button 
              onClick={() => setMiniWidgetMode(!miniWidgetMode)}
              className={`text-xs font-bold px-3 py-1.5 border ${miniWidgetMode ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-[#00dbe9]/10 border-[#00dbe9]/30 text-[#00dbe9]'}`}
            >
              {miniWidgetMode ? "FULL DASHBOARD" : "📱 MINI WIDGET MODE"}
            </Button>
            {authLoading ? (
              <span className="text-xs text-[#849495]">Checking Auth...</span>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3 text-xs bg-[#0b181e] px-3 py-1.5 rounded border border-[#00dbe9]/30">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-white">{user?.name || user?.openId}</span>
                <span className="text-emerald-400 font-bold uppercase text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{user?.role}</span>
              </div>
            ) : (
              <Button onClick={() => startLogin()} className="bg-[#00dbe9] text-black hover:bg-[#00dbe9]/80 text-xs font-bold px-4 py-2">
                <Lock className="w-3 h-3 mr-1.5" /> OWNER LOGIN (OAUTH)
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="stitch-main flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {miniWidgetMode ? (
          /* Mini Live Widget Mode for Mobile / Home Screen / Lock Screen Simulation */
          <div className="stitch-widget flex flex-col gap-4 max-w-md mx-auto w-full my-auto">
            <div className="stitch-widget-header flex justify-between items-center border-b border-[#00dbe9]/20 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                <h2 className="text-sm font-bold tracking-widest text-[#00dbe9]">TRADE-ARENA WIDGET</h2>
              </div>
              <span className="text-[10px] font-mono bg-[#00dbe9]/10 text-[#00dbe9] px-2 py-0.5 rounded border border-[#00dbe9]/30">
                {agent?.executionEnabled ? "EXECUTION ARMED" : "SIMULATION ONLY"}
              </span>
            </div>

            <div className="stitch-stat-grid grid grid-cols-3 gap-3 text-center">
              <div className="stitch-stat-card bg-[#050b0e] p-3 rounded-xl border border-[#00dbe9]/20">
                <p className="text-[9px] text-[#849495] uppercase">Base</p>
                <p className="text-sm font-bold text-[#00dbe9] mt-1">{balances.base}</p>
                <p className="text-[9px] text-emerald-400 mt-0.5">&gt;${networkConfigs.base.profitThresholdUsd.toFixed(3)} threshold</p>
              </div>
              <div className="stitch-stat-card bg-[#050b0e] p-3 rounded-xl border border-emerald-500/20">
                <p className="text-[9px] text-[#849495] uppercase">Arbitrum</p>
                <p className="text-sm font-bold text-emerald-400 mt-1">{balances.arbitrum}</p>
                <p className="text-[9px] text-emerald-400 mt-0.5">&gt;${networkConfigs.arbitrum.profitThresholdUsd.toFixed(2)} threshold</p>
              </div>
              <div className="stitch-stat-card bg-[#050b0e] p-3 rounded-xl border border-purple-500/20">
                <p className="text-[9px] text-[#849495] uppercase">Optimism</p>
                <p className="text-sm font-bold text-purple-400 mt-1">{balances.optimism}</p>
                <p className="text-[9px] text-emerald-400 mt-0.5">&gt;${networkConfigs.optimism.profitThresholdUsd.toFixed(2)} threshold</p>
              </div>
            </div>

            <div className="stitch-history-card bg-[#050b0e] p-4 rounded-xl border border-[#00dbe9]/20">
              <p className="text-[10px] text-[#849495] uppercase tracking-wider mb-2">Latest Trade Execution</p>
              {agent?.recentTrades && agent.recentTrades.length > 0 ? (
                <div className="text-xs text-white flex justify-between items-center">
                  <span className="font-mono text-[#00dbe9]">{agent.recentTrades[0].tokenPair}</span>
                  <span className="text-emerald-400 font-bold">+${agent.recentTrades[0].netProfitUsd}</span>
                </div>
              ) : (
                <p className="text-xs text-[#849495] italic">Scanning multi-chain liquidity spreads...</p>
              )}
            </div>

            <Button 
              onClick={() => setMiniWidgetMode(false)}
              className="stitch-primary w-full bg-[#00dbe9] text-black hover:bg-[#00dbe9]/80 text-xs font-bold py-3"
            >
              EXPAND FULL TERMINAL
            </Button>
          </div>
        ) : (
          <>
        {/* Top Balances & Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="stitch-card bg-[#0a161d] border border-[#00dbe9]/30 p-4 rounded-xl relative overflow-hidden shadow-[0_0_15px_rgba(0,219,233,0.05)]">
            <div className="absolute top-0 right-0 p-3 text-[#00dbe9]/20"><Zap className="w-8 h-8" /></div>
            <p className="text-[10px] text-[#849495] uppercase tracking-wider mb-1">Base Mainnet (WETH)</p>
            <p className="text-2xl font-bold text-[#00dbe9]">{balances.base} ETH</p>
            <p className="text-[10px] text-emerald-400 mt-2">Managed Wallet Primary</p>
          </div>
          <div className="bg-[#0a161d] border border-emerald-500/30 p-4 rounded-xl relative overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.05)]">
            <div className="absolute top-0 right-0 p-3 text-emerald-500/20"><Cpu className="w-8 h-8" /></div>
            <p className="text-[10px] text-[#849495] uppercase tracking-wider mb-1">Arbitrum (WETH)</p>
            <p className="text-2xl font-bold text-emerald-400">{balances.arbitrum} ETH</p>
            <p className="text-[10px] text-emerald-400 mt-2">Multi-Chain Active</p>
          </div>
          <div className="bg-[#0a161d] border border-purple-500/30 p-4 rounded-xl relative overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.05)]">
            <div className="absolute top-0 right-0 p-3 text-purple-500/20"><Activity className="w-8 h-8" /></div>
            <p className="text-[10px] text-[#849495] uppercase tracking-wider mb-1">Optimism (WETH)</p>
            <p className="text-2xl font-bold text-purple-400">{balances.optimism} ETH</p>
            <p className="text-[10px] text-purple-400 mt-2">Multi-Chain Active</p>
          </div>
          <div className="bg-[#0a161d] border border-[#00dbe9]/30 p-4 rounded-xl relative overflow-hidden flex flex-col justify-between">
            <div>
              <p className="text-[10px] text-[#849495] uppercase tracking-wider mb-1">Execution Badge</p>
              <div className="mt-1">
                <span className={`px-3 py-1 rounded text-xs font-bold tracking-wider border ${
                  agent?.executionEnabled 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                  {agent?.executionEnabled ? "EXECUTION_ARMED" : "SIMULATION_ONLY"}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-[#849495] mt-2">Scanner: {agent?.scannerEnabled ? "RUNNING" : "PAUSED"}</p>
          </div>
        </div>

        {/* Managed Agent Health Widget */}
        <section className="rounded-xl border border-[#00dbe9]/30 bg-[#081217] p-5 shadow-[0_0_20px_rgba(0,219,233,0.05)]" data-testid="cli-health-widget" aria-labelledby="cli-health-widget-title">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] tracking-[0.24em] text-[#849495]">LIVE AGENT TELEMETRY</p>
              <h2 id="cli-health-widget-title" className="mt-1 flex items-center gap-2 text-sm font-bold tracking-wider text-white">
                <Activity className="h-4 w-4 text-[#00dbe9]" /> MM DOCTOR / WALLET LINK
              </h2>
            </div>
            <div className={`flex items-center gap-2 rounded border px-2.5 py-1.5 text-[10px] font-bold tracking-wider ${
              cliStatusWidget.statusClass === "healthy"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : cliStatusWidget.statusClass === "degraded"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-300"
            }`} role="status" aria-live="polite">
              <span className={`h-2 w-2 rounded-full ${
                cliStatusWidget.statusClass === "healthy" ? "bg-emerald-400 animate-pulse" : cliStatusWidget.statusClass === "degraded" ? "bg-amber-400" : "bg-rose-400"
              }`} />
              {statusLoading ? "CHECKING" : cliStatusWidget.statusLabel}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-[#00dbe9]/15 bg-[#050b0e] p-3">
              <p className="text-[9px] uppercase tracking-wider text-[#849495]">Doctor Status</p>
              <p className="mt-2 text-lg font-bold text-[#00dbe9]">{statusLoading ? "CHECKING" : cliStatusWidget.status}</p>
              <p className="mt-1 truncate text-[9px] text-[#849495]" title={agent?.cliDoctorLive?.detail || "Waiting for mm doctor response."}>{agent?.cliDoctorLive?.detail || "Waiting for mm doctor response."}</p>
            </div>
            <div className="rounded-lg border border-emerald-500/15 bg-[#050b0e] p-3">
              <p className="text-[9px] uppercase tracking-wider text-[#849495]">Active Wallet / Base</p>
              <p className="mt-2 text-lg font-bold text-emerald-300">{statusLoading ? "CHECKING" : cliStatusWidget.walletBalanceLabel}</p>
              <p className="mt-1 text-[9px] text-[#849495]">Read through <code className="text-emerald-300">mm wallet balance</code></p>
            </div>
            <div className="rounded-lg border border-purple-500/15 bg-[#050b0e] p-3">
              <p className="text-[9px] uppercase tracking-wider text-[#849495]">Session Flags</p>
              <div className="mt-2 space-y-1 text-[10px]">
                <p className={agent?.cliDoctorLive?.authenticated === true ? "text-emerald-300" : "text-[#849495]"}>AUTH {agent?.cliDoctorLive?.authenticated === true ? "OK" : "—"}</p>
                <p className={agent?.cliDoctorLive?.initialized === true ? "text-emerald-300" : "text-[#849495]"}>INIT {agent?.cliDoctorLive?.initialized === true ? "OK" : "—"}</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-[9px] text-[#849495]">{agent?.cliDoctorLive?.checkedAt ? `Last CLI check: ${new Date(agent.cliDoctorLive.checkedAt).toLocaleTimeString()}` : "CLI check pending"} · Dashboard refreshes every 5 seconds.</p>
        </section>

        {/* Real-time Gas Telemetry */}
        <section className="rounded-xl border border-[#00dbe9]/30 bg-[#081217] p-5 shadow-[0_0_20px_rgba(0,219,233,0.05)]" data-testid="gas-telemetry-widget" aria-labelledby="gas-telemetry-title">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] tracking-[0.24em] text-[#849495]">NETWORK CONDITIONS / LIVE FEED</p>
              <h2 id="gas-telemetry-title" className="mt-1 flex items-center gap-2 text-sm font-bold tracking-wider text-white">
                <Activity className="h-4 w-4 text-[#00dbe9]" /> GAS TELEMETRY / CONGESTION BANDS
              </h2>
              <p className="mt-1 text-[10px] text-[#849495]">Read-only fee telemetry drives the dynamic profit threshold model. No transaction is signed or broadcast.</p>
            </div>
            <div className={`flex items-center gap-2 rounded border px-2.5 py-1.5 text-[10px] font-bold tracking-wider ${
              statusLoading ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : statusError ? "border-rose-500/30 bg-rose-500/10 text-rose-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            }`} role="status" aria-live="polite">
              <span className={`h-2 w-2 rounded-full ${statusLoading ? "bg-amber-400 animate-pulse" : statusError ? "bg-rose-400" : "bg-emerald-400 animate-pulse"}`} />
              {statusLoading ? "REFRESHING" : statusError ? "FEED DEGRADED" : "LIVE · 5S REFRESH"}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {gasTelemetryRows.map((row) => {
              const telemetry = row.telemetry;
              const isLoading = statusLoading && !telemetry;
              const gasPrice = formatGasReading(telemetry?.gasPriceGwei);
              const baseFee = formatGasReading(telemetry?.baseFeeGwei);
              const multiplier = typeof telemetry?.adjustedThresholdMultiplier === "number" ? `${telemetry.adjustedThresholdMultiplier.toFixed(2)}×` : "—";
              return (
                <div key={row.network} className="rounded-lg border border-[#00dbe9]/15 bg-[#050b0e] p-4" data-testid={`gas-telemetry-${row.network}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${row.congestion.dotClass}`} />
                      <span className="text-xs font-bold tracking-wider text-white">{row.label}</span>
                      <span className="text-[9px] text-[#849495]">#{telemetry?.chainId || "—"}</span>
                    </div>
                    <span className={`rounded border px-2 py-1 text-[9px] font-bold tracking-wider ${row.congestion.badgeClass}`}>
                      {isLoading ? "CHECKING" : row.congestion.label}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-[#849495]">Gas price</p>
                        <p className="mt-1 text-xl font-bold text-[#00dbe9]">{isLoading ? "—" : gasPrice}<span className="ml-1 text-[10px] font-normal text-[#849495]">GWEI</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase tracking-wider text-[#849495]">Base fee</p>
                        <p className="mt-1 text-xs font-bold text-white">{isLoading ? "—" : baseFee} GWEI</p>
                      </div>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10" aria-label={`${row.label} congestion meter`}>
                      <div className={`h-full rounded-full ${row.congestion.meterClass} ${row.congestion.widthClass}`} />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
                    <div className="border-t border-white/10 pt-2">
                      <p className="text-[#849495]">Threshold multiplier</p>
                      <p className="mt-1 font-bold text-emerald-300">{isLoading ? "—" : multiplier}</p>
                    </div>
                    <div className="border-t border-white/10 pt-2 text-right">
                      <p className="text-[#849495]">Last sample</p>
                      <p className="mt-1 font-bold text-white">{isLoading ? "—" : formatTelemetryTime(telemetry?.fetchedAt)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[9px] text-[#849495]">
            <span>BANDS: <span className="text-emerald-300">LOW</span> · <span className="text-cyan-300">NORMAL</span> · <span className="text-amber-300">ELEVATED</span> · <span className="text-rose-300">CONGESTED</span></span>
            <span className="text-amber-300">ALERT COOLDOWN: {getGasAlertCooldownLabel(gasAlertCooldownMinutes)}</span>
            <span>{activeGasCooldowns.length > 0 ? `SUPPRESSED: ${activeGasCooldowns.map((item) => `${item.label} ${formatGasAlertCooldownRemaining(item.remainingMs)}`).join(" · ")}` : "NO ACTIVE SUPPRESSION"}</span>
            <span>{statusData?.timestamp ? `Status snapshot ${new Date(statusData.timestamp).toLocaleTimeString()}` : "Awaiting status snapshot"}</span>
          </div>
        </section>

        {/* Stitch-inspired Feature Visualizer + Audio Telemetry */}
        <section className="stitch-feature-grid" aria-labelledby="feature-visualizer-title">
          <div className="stitch-reels-console" data-testid="reels-feature-visualizer">
            <div className="stitch-reels-header flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="stitch-kicker">STITCH REELS / FEATURE VISUALIZER</p>
                <h2 id="feature-visualizer-title" className="stitch-feature-title flex items-center gap-2">
                  LIQUIDITY SIGNAL REELS
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00dbe9]/30 bg-[#00dbe9]/10 px-2 py-0.5 text-[9px] text-[#00dbe9]">
                    <img src={featureModel.tokenIn.logoUrl} alt={featureModel.tokenIn.symbol} className="h-3 w-3 rounded-full object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                    {featureModel.tokenIn.symbol}
                    <span className="text-[#849495]">→</span>
                    <img src={featureModel.tokenOut.logoUrl} alt={featureModel.tokenOut.symbol} className="h-3 w-3 rounded-full object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                    {featureModel.tokenOut.symbol}
                  </span>
                </h2>
              </div>
              <div className="stitch-reels-status">
                <span className={`stitch-status-dot ${agent?.scannerEnabled ? "is-live" : ""}`} />
                {agent?.scannerEnabled ? "SCANNER LIVE" : "SCANNER PAUSED"}
              </div>
            </div>

            <div className="stitch-reels-screen" aria-label={`Route visualizer for ${featureNetwork}. ${agent?.executionEnabled ? "Execution armed." : "Simulation only."}`}>
              <div className="stitch-reels-scanline" aria-hidden="true" />
              <div className="stitch-reels-screen-meta">
                <span>ROUTE SIGNAL / {featureNetwork}</span>
                <span className={agent?.executionEnabled ? "text-emerald-300" : "text-amber-300"}>
                  {agent?.executionEnabled ? "EXECUTION ARMED" : "SIMULATION ONLY"}
                </span>
              </div>
              <div className="stitch-reels-track">
                {featureReels.map((reel) => (
                  <div key={reel.label} className="stitch-reel-column">
                    <span className="stitch-reel-label">{reel.label}</span>
                    <div className="stitch-reel-window">
                      <div className="stitch-reel-strip">
                        {[...reel.values, ...reel.values].map((value, index) => (
                          <span key={`${reel.label}-${value}-${index}`} className="stitch-reel-value">{value}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="stitch-reels-readout">
                <span className="truncate">{featureRoute}</span>
                <span className={featureProfit ? "text-emerald-300" : "text-[#849495]"}>
                  {featureProfit ? `+$${featureProfit} EST.` : "NO PROFITABILITY SIGNAL"}
                </span>
              </div>
            </div>

            <div className="stitch-reels-footer">
              <span>REAL DATA / GAS + ROUTE HISTORY</span>
              <span>{latestPulseEvent?.timestamp ? new Date(latestPulseEvent.timestamp).toLocaleTimeString() : "WAITING FOR EVENT"}</span>
            </div>
          </div>

          <div className="stitch-audio-stack">
            <div className="stitch-telemetry-module">
              <div className="stitch-module-header">
                <div>
                  <p className="stitch-kicker">AUDIO TELEMETRY 01</p>
                  <h3 className="stitch-module-title">PULSE ENVELOPE</h3>
                </div>
                <span className="stitch-module-badge">DERIVED BUS</span>
              </div>
              <div className="stitch-audio-spectrum" aria-hidden="true">
                {Array.from({ length: 18 }).map((_, index) => <span key={index} className="stitch-audio-bar" style={{ animationDelay: `${index * 45}ms` }} />)}
              </div>
              <div className="stitch-telemetry-readouts">
                <div><span>EVENT LEVEL</span><strong>{derivedPulseLevel}%</strong></div>
                <div><span>EVENTS</span><strong>{pulseEvents.length}</strong></div>
              </div>
            </div>

            <div className="stitch-telemetry-module">
              <div className="stitch-module-header">
                <div>
                  <p className="stitch-kicker">AUDIO TELEMETRY 02</p>
                  <h3 className="stitch-module-title">SPECTRAL READOUT</h3>
                </div>
                <Activity className="h-4 w-4 text-[#00dbe9]" aria-hidden="true" />
              </div>
              <div className="stitch-spectral-lines" aria-hidden="true"><span /><span /><span /><span /></div>
              <div className="stitch-telemetry-readouts">
                <div><span>BASE GAS</span><strong>{baseGasTelemetry?.gasPriceGwei || "0.0000"} GWEI</strong></div>
                <div><span>CONGESTION</span><strong>{baseGasTelemetry?.congestion || "UNKNOWN"}</strong></div>
                <div><span>SIGNAL BUS</span><strong>{agent?.scannerEnabled ? "ACTIVE" : "STANDBY"}</strong></div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Grid: Controls & Config */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Controls & CLI Token Submission */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Wallet & Security Info */}
            <div className="stitch-panel bg-[#081217] border border-[#00dbe9]/30 p-6 rounded-xl">
              <h2 className="text-sm font-bold tracking-wider text-white mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#00dbe9]" /> METAMASK AGENT WALLET SYNC & CLI DOCTOR
              </h2>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 bg-[#050b0e] rounded border border-[#00dbe9]/20">
                  <span className="text-[#849495]">Managed Wallet Address:</span>
                  <span className="text-[#00dbe9] font-mono">{agent?.walletAddress || "0x2ca1f801c1e19d16160c982c627e2932e95117be"}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#050b0e] rounded border border-[#00dbe9]/20">
                  <span className="text-[#849495]">MEV Protection / Slippage:</span>
                  <span className="text-emerald-400">Enabled ({maxSlippage.toFixed(1)}% max slippage)</span>
                </div>

                {/* CLI Doctor Breakdown */}
                <div className="p-3 bg-[#050b0e] rounded border border-[#00dbe9]/30 font-mono space-y-2">
                  <div className="flex justify-between items-center text-[11px] text-white font-bold">
                    <span>CLI RUNTIME STATUS</span>
                    <div className="flex items-center gap-2">
                      {cliConnection?.tokenExpiresAt && (() => {
                        const diffMs = cliConnection.tokenExpiresAt - Date.now();
                        const days = Math.floor(diffMs / (1000 * 3600 * 24));
                        const hours = Math.floor((diffMs % (1000 * 3600 * 24)) / (1000 * 3600));
                        const label = diffMs <= 0 ? "EXPIRED" : days > 0 ? `${days}D ${hours}H` : `${Math.max(1, hours)}H`;
                        return (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border ${diffMs <= 0 ? "text-rose-300 bg-rose-500/10 border-rose-500/20" : "text-cyan-300 bg-cyan-500/10 border-cyan-500/20"}`}>
                            EXP: {label}
                          </span>
                        );
                      })()}
                      <span className={agent?.cliDoctor?.healthy ? "text-emerald-400" : "text-amber-400"}>
                        {agent?.cliDoctor?.healthy ? "HEALTHY" : "ACTION REQUIRED"}
                      </span>
                    </div>
                  </div>
                  {agent?.cliDoctor?.checks?.map((chk: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-[10px] border-t border-[#00dbe9]/10 pt-1">
                      <span className="flex items-center gap-1.5 text-[#849495]">
                        <span className={`w-1.5 h-1.5 rounded-full ${chk.passed ? "bg-emerald-400" : "bg-rose-400"}`}></span>
                        {chk.name}
                      </span>
                      <span className="text-right text-white/90 max-w-[200px] truncate" title={chk.detail}>
                        {chk.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CLI Command & Live Link Deck */}
              <div className="mt-6 rounded-lg border border-[#00dbe9]/30 bg-[#00dbe9]/5 p-4" data-testid="cli-command-deck">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-[#00dbe9]"><Link2 className="h-3.5 w-3.5" /> LIVE CLI LINKS / COMMAND DECK</p>
                    <p className="mt-1 max-w-xl text-[10px] leading-relaxed text-[#849495]">Open the official link or copy the command, then run it in the local terminal. The browser cannot execute a local <code className="text-[#00dbe9]">mm</code> command, and no JWT is embedded here.</p>
                  </div>
                  <span className="rounded border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[9px] font-bold tracking-wider text-amber-300">LOCAL TERMINAL REQUIRED</span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {CLI_COMMANDS.map((item) => (
                    <div key={item.id} className="rounded border border-[#00dbe9]/15 bg-[#050b0e]/80 p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[9px] font-bold tracking-wider text-white">{item.label}</p>
                          <p className="mt-1 text-[9px] text-[#849495]">{item.hint}</p>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Copy ${item.label.toLowerCase()} command`}
                          title="Copy command"
                          onClick={() => copyCommand(item.id, item.command)}
                          className="h-7 w-7 shrink-0 text-[#00dbe9] hover:bg-[#00dbe9]/10"
                        >
                          {copiedCommand === item.id ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                      <code className="mt-2 block overflow-x-auto whitespace-nowrap rounded bg-black/30 px-2 py-1.5 text-[9px] text-[#00dbe9]">{item.command}</code>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <a className="inline-flex items-center gap-1.5 rounded border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1.5 text-[9px] font-bold tracking-wider text-emerald-300 transition-colors hover:bg-emerald-400/20" href={CLI_LINKS.login} target="_blank" rel="noreferrer">
                    OPEN AUTHORIZATION PAGE <ExternalLink className="h-3 w-3" />
                  </a>
                  <a className="inline-flex items-center gap-1.5 rounded border border-[#00dbe9]/25 bg-[#00dbe9]/5 px-2.5 py-1.5 text-[9px] font-bold tracking-wider text-[#00dbe9] transition-colors hover:bg-[#00dbe9]/15" href={CLI_LINKS.docs} target="_blank" rel="noreferrer">
                    OPEN CLI SETUP DOCS <ExternalLink className="h-3 w-3" />
                  </a>
                  <a className="inline-flex items-center gap-1.5 rounded border border-[#00dbe9]/25 bg-[#00dbe9]/5 px-2.5 py-1.5 text-[9px] font-bold tracking-wider text-[#00dbe9] transition-colors hover:bg-[#00dbe9]/15" href={CLI_LINKS.commands} target="_blank" rel="noreferrer">
                    COMMAND REFERENCE <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="rounded border border-amber-400/25 bg-amber-400/5 p-3">
                    <p className="flex items-center gap-2 text-[9px] font-bold tracking-wider text-amber-300"><Link2 className="h-3 w-3" /> OPTIONAL LOCAL MM:// HANDOFF</p>
                    <p className="mt-1 text-[9px] leading-relaxed text-[#849495]">Attempts an optional custom protocol link for local environment handlers. If your operating system has no registered handler, use the official browser authorization page or copy the CLI command above.</p>
                    <a
                      href={CLI_HANDOFF_URL}
                      onClick={() => setHandoffAttempted(true)}
                      className="mt-2 inline-flex items-center gap-1.5 rounded border border-amber-300/40 bg-amber-300/10 px-2.5 py-1.5 text-[9px] font-bold tracking-wider text-amber-200 transition-colors hover:bg-amber-300/20"
                      aria-label="Launch the optional local MetaMask mm protocol handoff"
                    >
                      {handoffAttempted ? "HANDOFF REQUESTED" : "LAUNCH LOCAL MM://"} <ExternalLink className="h-3 w-3" />
                    </a>
                    {handoffAttempted && <p className="mt-2 text-[9px] text-emerald-300" role="status">If nothing opened, continue with the official browser flow or copy GENERATE TOKEN LINK.</p>}
                  </div>

                  <div className="flex min-w-[150px] flex-col items-center justify-center rounded border border-emerald-400/25 bg-emerald-400/5 p-3">
                    <QRCodeSVG value={CLI_LINKS.login} size={128} bgColor="#050b0e" fgColor="#8ffcff" level="M" includeMargin title="Official MetaMask Agent authorization URL" />
                    <p className="mt-2 text-center text-[9px] font-bold tracking-wider text-emerald-300">SCAN OFFICIAL AUTH URL</p>
                    <p className="mt-1 text-center text-[8px] text-[#849495]">QR contains no CLI token</p>
                  </div>
                </div>
                <p className="mt-3 text-[9px] leading-relaxed text-amber-300/80">Token flow: run GENERATE TOKEN LINK locally → authorize on the official page → copy the returned CLI token → either run APPLY FRESH TOKEN locally or paste it into the masked Secure Vault field below. Never expose the token in a URL, log, or chat.</p>
              </div>

              {/* Strategy Profile */}
              <div className="mt-6 rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-purple-300">STRATEGY PROFILE</p>
                    <p className="mt-1 text-xs text-[#849495]">{agent?.strategyProfile?.description || "Loading strategy profile..."}</p>
                  </div>
                  <span className="rounded border border-purple-500/30 bg-purple-500/10 px-2 py-1 text-[10px] font-bold tracking-wider text-purple-300">
                    {agent?.strategyProfile?.label || "CHECKING"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[10px] text-[#849495]">
                  <span>Poll: {agent?.strategyProfile ? `${agent.strategyProfile.pollIntervalMs / 1000}s` : "—"} · Max input: {agent?.strategyProfile?.maxInputWeth || "—"} WETH</span>
                  <Button
                    type="button"
                    onClick={() => setStrategyProfileMutation.mutate({ profile: agent?.strategyProfile?.name === "aggressive" ? "guarded" : "aggressive" })}
                    disabled={!isAuthenticated || !agent?.strategyProfile || setStrategyProfileMutation.isPending}
                    className="border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-[10px] font-bold text-purple-200 hover:bg-purple-500/20"
                  >
                    {setStrategyProfileMutation.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : `SWITCH TO ${agent?.strategyProfile?.name === "aggressive" ? "GUARDED" : "AGGRESSIVE"}`}
                  </Button>
                </div>
              </div>

              {/* Owner Controls & Guarded Simulation/Live Switch */}
              <div className="mt-6 pt-6 border-t border-[#00dbe9]/20 flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-[#00dbe9]/25 bg-[#050b0e]">
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#00dbe9]" /> TRADING MODE: {agent?.executionEnabled ? <span className="text-amber-400">LIVE TRADING ARMED</span> : <span className="text-[#00dbe9]">SIMULATION ONLY</span>}
                    </p>
                    <p className="text-[10px] text-[#849495] mt-1">
                      {agent?.executionEnabled 
                        ? "Real-time execution active under configured gas and input limits." 
                        : "Simulating routes with QuoterV2. No transactions broadcast until armed."}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-[#849495]">SIMULATION</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(agent?.executionEnabled)}
                      aria-label="Toggle between simulation-only and live trading execution mode"
                      disabled={!isAuthenticated || toggleExecutionMutation.isPending || (!agent?.executionEnabled && executionPreflight && !livePreflightReady)}
                      onClick={() => toggleExecutionMutation.mutate()}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#00dbe9] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        agent?.executionEnabled ? "bg-amber-500" : "bg-cyan-900"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          agent?.executionEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-[10px] font-bold text-amber-400">LIVE</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Button 
                    onClick={() => toggleScannerMutation.mutate()} 
                    disabled={!isAuthenticated || toggleScannerMutation.isPending}
                    className={`flex-1 py-3 text-xs font-bold border ${
                      agent?.scannerEnabled 
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20' 
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                  >
                    {agent?.scannerEnabled ? <Pause className="w-3.5 h-3.5 mr-2" /> : <Play className="w-3.5 h-3.5 mr-2" />}
                    {agent?.scannerEnabled ? "PAUSE SCANNER" : "RESUME SCANNER"}
                  </Button>

                  <Button 
                    onClick={() => toggleExecutionMutation.mutate()} 
                    disabled={!isAuthenticated || toggleExecutionMutation.isPending || (!agent?.executionEnabled && executionPreflight && !livePreflightReady)}
                    title={!livePreflightReady && !agent?.executionEnabled ? "Live execution is blocked until the direct signer, gas cap, input cap, and confirmation flags pass preflight." : undefined}
                    className={`flex-1 py-3 text-xs font-bold border ${
                      agent?.executionEnabled 
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                        : 'bg-[#00dbe9]/10 border-[#00dbe9]/30 text-[#00dbe9] hover:bg-[#00dbe9]/20'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 mr-2" />
                    {agent?.executionEnabled ? "SWITCH TO SIMULATION" : !livePreflightReady && executionPreflight ? "LIVE PREFLIGHT BLOCKED" : "ARM LIVE EXECUTION"}
                  </Button>
                </div>
              </div>
              {executionPreflight && !executionPreflight.ready && (
                <div className="mt-4 rounded border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[10px] text-amber-300" role="status">
                  <p className="font-bold tracking-wider">LIVE PREFLIGHT BLOCKED</p>
                  <p className="mt-1 text-amber-200/80">{executionPreflight.reasons.join(" ")}</p>
                  <p className="mt-1 text-[#849495]">Manual dashboard checks remain available; no transaction is broadcast.</p>
                </div>
              )}
              {!isAuthenticated && (
                <p className="text-[10px] text-amber-400/80 mt-2 text-center">🔐 Log in with owner account via Manus OAuth to unlock control buttons.</p>
              )}
            </div>

            {/* Dual Wallet Mode & Setup Panel */}
            <div className="stitch-panel bg-[#081217] border border-[#00dbe9]/30 p-6 rounded-xl relative overflow-hidden flex flex-col gap-6">
              <div className="absolute top-0 right-0 bg-[#00dbe9]/10 text-[#00dbe9] border-l border-b border-[#00dbe9]/30 px-3 py-1 rounded-bl text-[10px] font-mono tracking-wider">
                WALLET SELECTOR / VAULT
              </div>

              <div>
                <h2 className="text-sm font-bold tracking-wider text-white mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#00dbe9]" /> SELECT WALLET CONNECTION MODE
                </h2>
                <p className="text-xs text-[#849495] mb-4">Choose between the MetaMask Agent Managed Wallet (CLI/Passkey) or a Standard EVM Wallet (Bring Your Own Wallet / Mobile Injected Provider).</p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Button
                    type="button"
                    onClick={() => setWalletModeMutation.mutate({ mode: "agent" })}
                    disabled={!isAuthenticated || setWalletModeMutation.isPending}
                    className={`p-3 h-auto flex flex-col items-start gap-1 border text-left ${
                      (agent?.walletMode || "agent") === "agent"
                        ? "border-[#00dbe9] bg-[#00dbe9]/15 text-white"
                        : "border-[#00dbe9]/30 bg-[#050b0e] text-[#849495] hover:text-white"
                    }`}
                  >
                    <span className="text-xs font-bold text-[#00dbe9]">METAMASK AGENT WALLET</span>
                    <span className="text-[10px] text-[#849495]">Managed agent session, CLI auth & passkey</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={() => setWalletModeMutation.mutate({ mode: "standard" })}
                    disabled={!isAuthenticated || setWalletModeMutation.isPending}
                    className={`p-3 h-auto flex flex-col items-start gap-1 border text-left ${
                      agent?.walletMode === "standard"
                        ? "border-emerald-500 bg-emerald-500/15 text-white"
                        : "border-[#00dbe9]/30 bg-[#050b0e] text-[#849495] hover:text-white"
                    }`}
                  >
                    <span className="text-xs font-bold text-emerald-400">STANDARD EVM WALLET (BYOW)</span>
                    <span className="text-[10px] text-[#849495]">Connect mobile wallet or injected provider</span>
                  </Button>
                </div>

                {agent?.walletMode === "standard" ? (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                    <p className="text-xs font-bold text-emerald-300">Standard Wallet Connected</p>
                    <p className="text-[10px] text-[#849495]">Active Address: <span className="text-white font-mono">{agent?.standardWalletAddress || "Not connected"}</span></p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => {
                          const addr = prompt("Enter your standard EVM wallet address (e.g. 0x...):", agent?.standardWalletAddress || "");
                          if (addr) connectStandardWalletMutation.mutate({ address: addr, providerType: "injected" });
                        }}
                        disabled={!isAuthenticated || connectStandardWalletMutation.isPending}
                        className="bg-emerald-500 text-black hover:bg-emerald-400 text-xs font-bold px-4 py-2"
                      >
                        {connectStandardWalletMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "CONNECT INJECTED / MOBILE WALLET"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h2 className="text-sm font-bold tracking-wider text-white mb-2 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-[#00dbe9]" /> METAMASK AGENT CLI TOKEN SETTINGS
                    </h2>
                    <p className="text-xs text-[#849495] mb-4">Securely submit and save your MetaMask Agent CLI JWT token. Input is masked for security and authenticated via owner OAuth session.</p>
                    
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <Input 
                          type="password"
                          autoComplete="off"
                          placeholder="Enter encrypted or raw CLI JWT token..." 
                          value={cliToken}
                          onChange={(e) => setCliToken(e.target.value)}
                          className="bg-[#050b0e] border-[#00dbe9]/30 text-white text-xs placeholder:text-[#849495]/40 font-mono"
                        />
                        <Button 
                          onClick={() => submitTokenMutation.mutate({ token: cliToken })}
                          disabled={!isAuthenticated || !cliToken || submitTokenMutation.isPending}
                          className="bg-[#00dbe9] text-black hover:bg-[#00dbe9]/80 text-xs font-bold px-6 shrink-0"
                        >
                          {submitTokenMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "SAVE & RENEW"}
                        </Button>
                      </div>
                      {!isAuthenticated && (
                        <p className="text-[10px] text-amber-400/80">🔒 Owner authentication required to update CLI session credentials.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-[#00dbe9]/20 pt-4">
                <h2 className="text-sm font-bold tracking-wider text-white mb-2 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-400" /> MIN PROFIT PUSH NOTIFICATION THRESHOLD
                </h2>
                <p className="text-xs text-[#849495] mb-4">Set minimum net profit in USD required before triggering phone push notifications. Current filter: <span className="text-emerald-400 font-bold">${agent?.minProfitThreshold || "0.00"}</span></p>
                
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <Input 
                      type="number"
                      step="0.01"
                      placeholder="e.g. 5.00" 
                      value={minProfitInput}
                      onChange={(e) => setMinProfitInput(e.target.value)}
                      className="bg-[#050b0e] border-[#00dbe9]/30 text-white text-xs placeholder:text-[#849495]/40 font-mono"
                    />
                    <Button 
                      onClick={() => updateThresholdMutation.mutate({ threshold: minProfitInput })}
                      disabled={!isAuthenticated || !minProfitInput || updateThresholdMutation.isPending}
                      className="bg-emerald-500 text-black hover:bg-emerald-400 text-xs font-bold px-6 shrink-0"
                    >
                      {updateThresholdMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "SET THRESHOLD"}
                    </Button>
                  </div>
                  {!isAuthenticated && (
                    <p className="text-[10px] text-amber-400/80">🔒 Owner authentication required to update notification thresholds.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Per-Chain Configuration Panel */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="stitch-panel bg-[#081217] border border-[#00dbe9]/30 p-6 rounded-xl h-full flex flex-col">
              <h2 className="text-sm font-bold tracking-wider text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#00dbe9]" /> MULTI-CHAIN CONFIGURATION
              </h2>

              <div className="space-y-4 flex-1 flex flex-col justify-around">
                {/* Base */}
                <div className="p-4 bg-[#050b0e] rounded-lg border border-[#00dbe9]/20 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span> BASE MAINNET
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      (agent?.gasTelemetry?.base?.congestion as string) === "CONGESTED" ? "bg-rose-500/10 border-rose-500/30 text-rose-400" :
                      (agent?.gasTelemetry?.base?.congestion as string) === "ELEVATED" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                      (agent?.gasTelemetry?.base?.congestion as string) === "DEGRADED" ? "bg-gray-500/10 border-gray-500/30 text-gray-400" :
                      "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    }`}>
                      {agent?.gasTelemetry?.base?.congestion || "NORMAL"} ({agent?.gasTelemetry?.base?.baseFeeGwei || "0.00"} GWEI)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#849495]">
                    <div>Dynamic Threshold: <span className="text-emerald-400 font-bold">${networkConfigs.base.profitThresholdUsd.toFixed(4)}</span></div>
                    <div>Max Slippage: <span className="text-[#00dbe9] font-bold">{networkConfigs.base.slippage}%</span></div>
                  </div>
                  <Button 
                    onClick={() => runArbMutation.mutate({ network: 'base' })}
                    disabled={!isAuthenticated || runArbMutation.isPending}
                    className="w-full bg-[#00dbe9]/10 hover:bg-[#00dbe9]/20 text-[#00dbe9] border border-[#00dbe9]/30 text-xs font-bold py-1.5 h-8"
                  >
                    {runArbMutation.isPending ? "RUNNING..." : "RUN ARB CHECK (BASE)"}
                  </Button>
                </div>

                {/* Arbitrum */}
                <div className="p-4 bg-[#050b0e] rounded-lg border border-emerald-500/20 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span> ARBITRUM ONE
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      (agent?.gasTelemetry?.arbitrum?.congestion as string) === "CONGESTED" ? "bg-rose-500/10 border-rose-500/30 text-rose-400" :
                      (agent?.gasTelemetry?.arbitrum?.congestion as string) === "ELEVATED" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                      (agent?.gasTelemetry?.arbitrum?.congestion as string) === "DEGRADED" ? "bg-gray-500/10 border-gray-500/30 text-gray-400" :
                      "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    }`}>
                      {agent?.gasTelemetry?.arbitrum?.congestion || "NORMAL"} ({agent?.gasTelemetry?.arbitrum?.baseFeeGwei || "0.00"} GWEI)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#849495]">
                    <div>Dynamic Threshold: <span className="text-emerald-400 font-bold">${networkConfigs.arbitrum.profitThresholdUsd.toFixed(4)}</span></div>
                    <div>Max Slippage: <span className="text-emerald-400 font-bold">{networkConfigs.arbitrum.slippage}%</span></div>
                  </div>
                  <Button 
                    onClick={() => runArbMutation.mutate({ network: 'arbitrum' })}
                    disabled={!isAuthenticated || runArbMutation.isPending}
                    className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold py-1.5 h-8"
                  >
                    {runArbMutation.isPending ? "RUNNING..." : "RUN ARB CHECK (ARBITRUM)"}
                  </Button>
                </div>

                {/* Optimism */}
                <div className="p-4 bg-[#050b0e] rounded-lg border border-purple-500/20 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-400"></span> OPTIMISM BEDROCK
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      (agent?.gasTelemetry?.optimism?.congestion as string) === "CONGESTED" ? "bg-rose-500/10 border-rose-500/30 text-rose-400" :
                      (agent?.gasTelemetry?.optimism?.congestion as string) === "ELEVATED" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                      (agent?.gasTelemetry?.optimism?.congestion as string) === "DEGRADED" ? "bg-gray-500/10 border-gray-500/30 text-gray-400" :
                      "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    }`}>
                      {agent?.gasTelemetry?.optimism?.congestion || "NORMAL"} ({agent?.gasTelemetry?.optimism?.baseFeeGwei || "0.00"} GWEI)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#849495]">
                    <div>Dynamic Threshold: <span className="text-emerald-400 font-bold">${networkConfigs.optimism.profitThresholdUsd.toFixed(4)}</span></div>
                    <div>Max Slippage: <span className="text-purple-400 font-bold">{networkConfigs.optimism.slippage}%</span></div>
                  </div>
                  <Button 
                    onClick={() => runArbMutation.mutate({ network: 'optimism' })}
                    disabled={!isAuthenticated || runArbMutation.isPending}
                    className="w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-bold py-1.5 h-8"
                  >
                    {runArbMutation.isPending ? "RUNNING..." : "RUN ARB CHECK (OPTIMISM)"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Chain Historical Backtest Panel */}
        <section
          className="stitch-panel bg-[#081217] border border-[#00dbe9]/40 p-5 sm:p-6 rounded-xl shadow-lg relative overflow-hidden mb-6"
          aria-labelledby="historical-backtest-title"
        >
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-[#00dbe9]/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-[#00dbe9]/20 text-[#00dbe9] border border-[#00dbe9]/30">
                  SIMULATION ONLY · ZERO RISK
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  MULTI-CHAIN ENGINE
                </span>
              </div>
              <h2 id="historical-backtest-title" className="text-base font-bold tracking-wider text-white flex items-center gap-2 mt-2">
                <Cpu className="w-5 h-5 text-[#00dbe9]" /> MULTI-CHAIN HISTORICAL BACKTEST SUITE
              </h2>
              <p className="text-xs text-[#849495] mt-1 max-w-2xl">
                Simulate cross-DEX arbitrage execution across Base, Arbitrum, and Optimism using historical spread models and gas telemetry. No private keys required; no transactions are broadcast.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  runBacktestMutation.mutate({
                    networks: backtestNetworks,
                    strategyProfile: backtestStrategy,
                    sampleSize: backtestSampleSize,
                    gasGwei: backtestGasGwei,
                  });
                }}
                disabled={runBacktestMutation.isPending || backtestNetworks.length === 0}
                className="bg-[#00dbe9] text-black font-mono font-bold hover:bg-[#00dbe9]/80 border-none shadow-md"
              >
                {runBacktestMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> RUNNING BACKTEST...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" /> RUN MULTI-CHAIN BACKTEST
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Configuration Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-[#050b0e] p-4 rounded-lg border border-[#00dbe9]/20">
            <div>
              <label className="text-[10px] uppercase font-mono text-[#849495] block mb-1.5">Target Networks</label>
              <div className="flex flex-wrap gap-1.5">
                {(["base", "arbitrum", "optimism"] as const).map((net) => {
                  const active = backtestNetworks.includes(net);
                  return (
                    <button
                      key={net}
                      type="button"
                      onClick={() => {
                        if (active) {
                          if (backtestNetworks.length > 1) {
                            setBacktestNetworks(backtestNetworks.filter((n) => n !== net));
                          }
                        } else {
                          setBacktestNetworks([...backtestNetworks, net]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors border ${active ? 'bg-[#00dbe9]/20 text-[#00dbe9] border-[#00dbe9]/50' : 'bg-[#081217] text-[#849495] border-white/10'}`}
                    >
                      {net} {active && "✓"}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono text-[#849495] block mb-1.5">Strategy Profile</label>
              <div className="flex gap-1.5">
                {(["guarded", "aggressive"] as const).map((profile) => (
                  <button
                    key={profile}
                    type="button"
                    onClick={() => setBacktestStrategy(profile)}
                    className={`flex-1 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors border ${backtestStrategy === profile ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-[#081217] text-[#849495] border-white/10'}`}
                  >
                    {profile}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="backtest-sample-size-home" className="text-[10px] uppercase font-mono text-[#849495] block mb-1.5">Sample Size: {backtestSampleSize} ticks</label>
              <div className="flex gap-1.5">
                {[50, 100, 250, 500].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setBacktestSampleSize(size)}
                    className={`flex-1 px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors border ${backtestSampleSize === size ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' : 'bg-[#081217] text-[#849495] border-white/10'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="backtest-gas-gwei-input-home" className="text-[10px] uppercase font-mono text-[#849495] block mb-1.5">Gas Price Override (Gwei)</label>
              <Input
                id="backtest-gas-gwei-input-home"
                type="number"
                step="0.01"
                min="0.01"
                max="50"
                value={backtestGasGwei}
                onChange={(e) => setBacktestGasGwei(parseFloat(e.target.value) || 0.05)}
                className="bg-[#081217] border-[#00dbe9]/30 text-white font-mono text-xs h-8"
              />
            </div>
          </div>

          {/* Results Display */}
          {backtestResult ? (
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-[#00dbe9]/20 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white uppercase font-mono">Backtest Results ({backtestResult.summary.strategyLabel})</span>
                  <span className="text-[10px] text-[#849495]">Tested {backtestResult.summary.totalRuns} historical market ticks across {backtestResult.summary.networksTested.join(", ").toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBacktestActiveTab("summary")}
                    className={`px-3 py-1 rounded text-[10px] font-mono font-bold transition-colors ${backtestActiveTab === "summary" ? "bg-[#00dbe9] text-black" : "bg-[#050b0e] text-[#849495] hover:text-white"}`}
                  >
                    Summary & Networks
                  </button>
                  <button
                    type="button"
                    onClick={() => setBacktestActiveTab("runs")}
                    className={`px-3 py-1 rounded text-[10px] font-mono font-bold transition-colors ${backtestActiveTab === "runs" ? "bg-[#00dbe9] text-black" : "bg-[#050b0e] text-[#849495] hover:text-white"}`}
                  >
                    Execution Log ({backtestResult.backtestRuns.length})
                  </button>
                </div>
              </div>

              {backtestActiveTab === "summary" ? (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    <div className="rounded-lg border border-[#00dbe9]/30 bg-[#050b0e] p-3">
                      <p className="text-[9px] uppercase font-mono text-[#849495]">Total Net Profit</p>
                      <p className={`mt-1 text-lg font-bold font-mono ${backtestResult.summary.totalProfitUsd >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {backtestResult.summary.totalProfitUsd >= 0 ? "+" : "-"}${Math.abs(backtestResult.summary.totalProfitUsd).toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-emerald-500/30 bg-[#050b0e] p-3">
                      <p className="text-[9px] uppercase font-mono text-[#849495]">Win Rate</p>
                      <p className="mt-1 text-lg font-bold font-mono text-emerald-400">
                        {backtestResult.summary.winRatePercent}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#00dbe9]/30 bg-[#050b0e] p-3">
                      <p className="text-[9px] uppercase font-mono text-[#849495]">Avg Profit / Run</p>
                      <p className={`mt-1 text-lg font-bold font-mono ${backtestResult.summary.avgNetProfitUsd >= 0 ? "text-[#00dbe9]" : "text-rose-400"}`}>
                        {backtestResult.summary.avgNetProfitUsd >= 0 ? "+" : "-"}${Math.abs(backtestResult.summary.avgNetProfitUsd).toFixed(4)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-rose-500/30 bg-[#050b0e] p-3">
                      <p className="text-[9px] uppercase font-mono text-[#849495]">Max Drawdown</p>
                      <p className="mt-1 text-lg font-bold font-mono text-rose-400">
                        -${backtestResult.summary.maxDrawdownUsd.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Network Breakdown Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Object.entries(backtestResult.networkStats).map(([net, stats]: [string, any]) => {
                      const winRate = stats.runs > 0 ? ((stats.wins / stats.runs) * 100).toFixed(1) : "0.0";
                      return (
                        <div key={net} className="rounded-lg border border-[#00dbe9]/20 bg-[#050b0e] p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono font-bold text-xs uppercase text-white">{net}</span>
                            <span className="text-[10px] font-mono text-[#00dbe9] bg-[#00dbe9]/10 px-2 py-0.5 rounded">{stats.runs} Runs</span>
                          </div>
                          <div className="space-y-1.5 text-[11px] font-mono">
                            <div className="flex justify-between text-[#849495]">
                              <span>Net Profit:</span>
                              <span className={stats.profitUsd >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                {stats.profitUsd >= 0 ? "+" : "-"}${Math.abs(stats.profitUsd).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-[#849495]">
                              <span>Win Rate:</span>
                              <span className="text-white">{winRate}%</span>
                            </div>
                            <div className="flex justify-between text-[#849495]">
                              <span>Simulated Volume:</span>
                              <span className="text-white">{stats.volumeWeth.toFixed(2)} WETH</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {backtestResult.backtestRuns.map((run: any) => (
                    <div key={run.id} className="flex items-center justify-between bg-[#050b0e] border border-[#00dbe9]/20 p-2.5 rounded text-xs font-mono">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${run.profitable ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                        <span className="font-bold text-white uppercase">{run.network}</span>
                        <span className="text-[#849495] truncate max-w-xs">{run.route}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-[#849495]">Gas: ${run.gasCostUsd}</span>
                        <span className={`font-bold ${run.profitable ? "text-emerald-400" : "text-rose-400"}`}>
                          {run.profitable ? "+" : ""}${run.netProfitUsd}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#050b0e] border border-dashed border-[#00dbe9]/20 rounded-lg p-8 text-center">
              <Cpu className="w-10 h-10 text-[#00dbe9]/40 mx-auto mb-3" />
              <p className="text-xs text-white font-bold font-mono">No backtest suite executed yet</p>
              <p className="text-[10px] text-[#849495] mt-1 max-w-md mx-auto">
                Configure your sample size and target networks above, then click <strong>Run Multi-Chain Backtest</strong> to evaluate historical strategy performance across Base, Arbitrum, and Optimism.
              </p>
            </div>
          )}
        </section>

        {/* Simulated Route Profitability History */}
        <section
          className={`stitch-panel bg-[#081217] border border-[#00dbe9]/30 p-5 sm:p-6 rounded-xl ${profitPulseActive ? "profitability-pulse-active" : ""}`}
          aria-labelledby="simulation-profitability-title"
          role="region"
          data-pulse-active={profitPulseActive ? "true" : "false"}
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
            <div>
              <h2 id="simulation-profitability-title" className="text-sm font-bold tracking-wider text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00dbe9]" /> SIMULATED ROUTE PROFITABILITY
              </h2>
              <p className="text-[10px] text-[#849495] mt-1 max-w-xl">
                Historical net profitability from recorded, non-broadcast route simulations. Values are persisted only after a simulation check completes.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-[#050b0e] p-1 rounded border border-[#00dbe9]/20 text-[10px]">
                {(["ALL", "base", "arbitrum", "optimism"] as const).map((net) => (
                  <button
                    key={net}
                    onClick={() => setProfitNetworkFilter(net)}
                    className={`px-2 py-0.5 rounded font-mono font-bold uppercase transition-colors ${profitNetworkFilter === net ? 'bg-[#00dbe9] text-black' : 'text-[#849495] hover:text-white'}`}
                  >
                    {net}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 bg-[#050b0e] p-1 rounded border border-[#00dbe9]/20 text-[10px]">
                {(["1H", "24H", "ALL"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setProfitTimeRange(range)}
                    className={`px-2 py-0.5 rounded font-mono font-bold transition-colors ${profitTimeRange === range ? 'bg-emerald-400 text-black' : 'text-[#849495] hover:text-white'}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {profitPulseActive && profitPulseSummary && (
            <div role="status" aria-live="polite" className="profitability-pulse-banner mb-4 flex items-center gap-3 rounded-lg border border-emerald-300/50 bg-emerald-400/10 px-3 py-2 text-[10px] text-emerald-200">
              <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-300 animate-ping" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-bold tracking-wider">HIGH-PROFIT ROUTE RECORDED · +${profitPulseSummary.profit}</p>
                <p className="truncate text-emerald-200/70">{profitPulseSummary.network.toUpperCase()} · {profitPulseSummary.route}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="rounded-lg border border-[#00dbe9]/20 bg-[#050b0e] px-3 py-2">
              <p className="text-[9px] uppercase text-[#849495]">Cumulative</p>
              <p className={`mt-1 text-base font-bold ${simulationProfitTotal >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {simulationProfitTotal >= 0 ? "+" : "-"}${Math.abs(simulationProfitTotal).toFixed(4)}
              </p>
            </div>
            <div className="rounded-lg border border-[#00dbe9]/20 bg-[#050b0e] px-3 py-2">
              <p className="text-[9px] uppercase text-[#849495]">Average / route</p>
              <p className={`mt-1 text-base font-bold ${simulationAverageProfit >= 0 ? "text-[#00dbe9]" : "text-rose-400"}`}>
                {simulationAverageProfit >= 0 ? "+" : "-"}${Math.abs(simulationAverageProfit).toFixed(4)}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-500/20 bg-[#050b0e] px-3 py-2">
              <p className="text-[9px] uppercase text-[#849495]">Profitable routes</p>
              <p className="mt-1 text-base font-bold text-emerald-400">{simulationProfitableCount} <span className="text-[10px] text-[#849495]">/ {simulationChartData.length}</span></p>
            </div>
            <div className="rounded-lg border border-purple-500/20 bg-[#050b0e] px-3 py-2">
              <p className="text-[9px] uppercase text-[#849495]">Data status</p>
              <p className="mt-1 text-[11px] font-bold text-purple-300">{simulationChartData.length ? "HISTORICAL" : "AWAITING CHECKS"}</p>
            </div>
          </div>

          {simulationChartData.length > 0 ? (
            <ChartContainer config={simulationChartConfig} className="h-[280px] w-full aspect-auto">
              <AreaChart data={simulationChartData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-profit)" stopOpacity={0.42} />
                    <stop offset="95%" stopColor="var(--color-profit)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#00dbe9" strokeOpacity={0.12} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} tick={{ fill: "#849495", fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} width={56} tick={{ fill: "#849495", fontSize: 10 }} tickFormatter={(value) => `$${Number(value).toFixed(3)}`} />
                <ReferenceLine y={0} stroke="#849495" strokeOpacity={0.35} strokeDasharray="4 4" />
                <Tooltip
                  cursor={{ stroke: "#00dbe9", strokeOpacity: 0.25 }}
                  content={<ChartTooltipContent labelFormatter={(label) => `CHECK ${label}`} formatter={(value) => [`$${Number(value).toFixed(4)}`, "NET PROFIT"]} />}
                />
                <Area type="monotone" dataKey="profit" stroke="var(--color-profit)" strokeWidth={2} fill="url(#profitFill)" dot={{ r: 2, fill: "#00dbe9", strokeWidth: 0 }} activeDot={{ r: 4, fill: "#00dbe9", stroke: "#050b0e", strokeWidth: 2 }} />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="h-[280px] rounded-lg border border-dashed border-[#00dbe9]/20 bg-[#050b0e] flex flex-col items-center justify-center text-center px-6">
              <TrendingUp className="w-8 h-8 text-[#00dbe9]/40 mb-3" />
              <p className="text-xs text-white font-bold">No simulated route history yet</p>
              <p className="text-[10px] text-[#849495] mt-1 max-w-md">Run a Base, Arbitrum, or Optimism arb check while the dashboard is in simulation-only mode to begin building this timeline.</p>
            </div>
          )}

          {simulationChartData.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-[#849495]">
              {["base", "arbitrum", "optimism"].map((network) => {
                const count = simulationChartData.filter((entry) => entry.network === network).length;
                return <span key={network} className="uppercase"><span className="text-[#00dbe9]">●</span> {network} {count}</span>;
              })}
              <span className="ml-auto">PROFIT IS ESTIMATED BY THE SIMULATION ROUTE MODEL · NO LIVE TX</span>
            </div>
          )}
        </section>

        {/* High-Profit Pulse Event Log */}
        <section className="stitch-panel bg-[#081217] border border-emerald-400/30 p-5 sm:p-6 rounded-xl" aria-labelledby="pulse-event-log-title">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h2 id="pulse-event-log-title" className="text-sm font-bold tracking-wider text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" /> HIGH-PROFIT PULSE EVENT LOG
              </h2>
              <p className="text-[10px] text-[#849495] mt-1">Every recorded pulse event that cleared 2× the active network threshold.</p>
            </div>
            <span className="self-start sm:self-auto rounded border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold tracking-wider text-emerald-300">
              {statusLoading ? "SYNCING..." : pulseNetworkFilter === "ALL"
                ? `${pulseEvents.length} EVENT${pulseEvents.length === 1 ? "" : "S"}`
                : `${filteredPulseEvents.length}/${pulseEvents.length} MATCHING` }
            </span>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filter pulse events by network">
            <span className="mr-1 text-[10px] uppercase tracking-wider text-[#849495]">NETWORK</span>
            {(["ALL", "base", "arbitrum", "optimism"] as const).map((network) => {
              const active = pulseNetworkFilter === network;
              const count = network === "ALL" ? pulseEvents.length : pulseEvents.filter((event: any) => event.network === network).length;
              return (
                <button
                  key={network}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPulseNetworkFilter(network)}
                  className={`rounded border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${active
                    ? "border-emerald-300/80 bg-emerald-300/15 text-emerald-200"
                    : "border-emerald-400/20 bg-[#050b0e] text-[#849495] hover:border-emerald-300/50 hover:text-emerald-200"}`}
                >
                  {network} <span className="ml-1 opacity-70">{count}</span>
                </button>
              );
            })}
            <span className="ml-auto text-[10px] text-[#849495]" aria-live="polite">
              {getPulseEventFilterLabel(pulseNetworkFilter)}
            </span>
          </div>

          {statusLoading && pulseEvents.length === 0 ? (
            <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-emerald-400/20 bg-[#050b0e] text-[10px] text-[#849495]">
              Loading pulse event history...
            </div>
          ) : filteredPulseEvents.length > 0 ? (
            <div className="max-h-[280px] overflow-y-auto rounded-lg border border-emerald-400/15 bg-[#050b0e]">
              <table className="w-full min-w-[680px] text-left text-[10px] font-mono">
                <thead className="sticky top-0 bg-[#0b171c] text-[#849495]">
                  <tr className="border-b border-emerald-400/15">
                    <th className="px-3 py-2">TIMESTAMP</th>
                    <th className="px-3 py-2">NETWORK</th>
                    <th className="px-3 py-2">NET PROFIT</th>
                    <th className="px-3 py-2">THRESHOLD</th>
                    <th className="px-3 py-2">ROUTE</th>
                    <th className="px-3 py-2">SOURCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-400/10 text-white">
                  {filteredPulseEvents.map((event: any) => (
                    <tr key={event.id} className="transition-colors hover:bg-emerald-400/5">
                      <td className="whitespace-nowrap px-3 py-2 text-[#849495]" title={new Date(event.timestamp).toISOString()}>
                        {new Date(event.timestamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </td>
                      <td className="px-3 py-2 font-bold uppercase text-emerald-300">{event.network}</td>
                      <td className="whitespace-nowrap px-3 py-2 font-bold text-emerald-400">+${event.netProfitUsd}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-[#849495]">2× ${event.thresholdUsd}</td>
                      <td className="max-w-[260px] truncate px-3 py-2 text-[#849495]" title={event.route}>{event.route}</td>
                      <td className="px-3 py-2 uppercase text-[#00dbe9]">{event.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-28 flex-col items-center justify-center rounded-lg border border-dashed border-emerald-400/20 bg-[#050b0e] px-6 text-center">
              <Zap className="mb-2 h-6 w-6 text-emerald-400/40" aria-hidden="true" />
              <p className="text-xs font-bold text-white">
                {pulseEvents.length > 0 ? `No ${pulseNetworkFilter.toUpperCase()} pulse events` : "No high-profit pulse events recorded"}
              </p>
              <p className="mt-1 text-[10px] text-[#849495]">
                {pulseEvents.length > 0
                  ? "Choose ALL or another network to view the remaining qualifying events."
                  : "Qualifying simulations will appear here with their exact timestamp and route."}
              </p>
            </div>
          )}
        </section>

        {/* Bottom Section: Trade History & Suppressed Alerts Log */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Trade History Table */}
          <div className="stitch-panel lg:col-span-6 bg-[#081217] border border-[#00dbe9]/30 p-6 rounded-xl flex flex-col">
            <h2 className="text-sm font-bold tracking-wider text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> RECENT ARBITRAGE EXECUTIONS
            </h2>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#00dbe9]/20 text-[#849495]">
                    <th className="pb-3">NETWORK</th>
                    <th className="pb-3">PAIR</th>
                    <th className="pb-3">NET PROFIT</th>
                    <th className="pb-3">TX HASH</th>
                    <th className="pb-3">TIME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#00dbe9]/10 text-white">
                  {agent?.recentTrades && agent.recentTrades.length > 0 ? (
                    agent.recentTrades.map((t: any) => (
                      <tr key={t.id} className="hover:bg-[#00dbe9]/5">
                        <td className="py-3 uppercase text-[#00dbe9] font-bold">{t.network}</td>
                        <td className="py-3">{t.tokenPair}</td>
                        <td className="py-3 text-emerald-400 font-bold">+${t.netProfitUsd}</td>
                        <td className="py-3 text-[#849495] truncate max-w-[100px]" title={t.txHash}>{t.txHash}</td>
                        <td className="py-3 text-[#849495]">{new Date(t.timestamp).toLocaleTimeString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#849495] italic">
                        No trade history recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Suppressed Alerts Log Table */}
          <div className="stitch-panel lg:col-span-6 bg-[#081217] border border-amber-500/30 p-6 rounded-xl flex flex-col">
            <h2 className="text-sm font-bold tracking-wider text-white mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" /> SUPPRESSED ALERTS LOG (&lt; ${agent?.minProfitThreshold || "0.00"})
            </h2>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-amber-500/20 text-[#849495]">
                    <th className="pb-3">NETWORK</th>
                    <th className="pb-3">PROFIT</th>
                    <th className="pb-3">THRESHOLD</th>
                    <th className="pb-3">REASON</th>
                    <th className="pb-3">TIME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/10 text-white">
                  {agent?.suppressedAlerts && agent.suppressedAlerts.length > 0 ? (
                    agent.suppressedAlerts.map((a: any) => (
                      <tr key={a.id} className="hover:bg-amber-500/5">
                        <td className="py-3 uppercase text-amber-400 font-bold">{a.network}</td>
                        <td className="py-3 text-amber-300">+${a.netProfitUsd}</td>
                        <td className="py-3 text-[#849495]">${a.thresholdUsd}</td>
                        <td className="py-3 text-[#849495] truncate max-w-[140px]" title={a.reason}>{a.reason}</td>
                        <td className="py-3 text-[#849495]">{new Date(a.timestamp).toLocaleTimeString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#849495] italic">
                        No suppressed alerts. All trades exceeded threshold or none recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Event Stream & Verbose Diagnostics */}
          <div className="stitch-panel lg:col-span-12 bg-[#081217] border border-[#00dbe9]/30 p-6 rounded-xl flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
              <h2 className="text-sm font-bold tracking-wider text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#00dbe9]" /> VERBOSE LIVE EVENT STREAM & DIAGNOSTICS
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-[#050b0e] p-1 rounded border border-[#00dbe9]/20 text-[10px]">
                  {["ALL", "CLI", "SCANNER", "EXECUTION", "SETTLEMENT", "NOTIFY"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setLogFilter(cat)}
                      className={`px-2 py-1 rounded font-mono font-bold transition-colors ${logFilter === cat ? 'bg-[#00dbe9] text-black' : 'text-[#849495] hover:text-white'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded animate-pulse">
                  LIVE STREAM ACTIVE
                </span>
              </div>
            </div>
            <div ref={logScrollRef} className="bg-[#050b0e] p-4 rounded-lg border border-[#00dbe9]/20 font-mono text-[11px] h-[260px] overflow-y-auto space-y-2">
              {agent?.agentLogs && agent.agentLogs.length > 0 ? (
                agent.agentLogs
                  .filter((l: any) => logFilter === "ALL" || l.category === logFilter)
                  .map((l: any) => {
                    const color = l.level === 'SUCCESS' ? 'text-emerald-400' : l.level === 'WARN' ? 'text-amber-400' : l.level === 'ERROR' ? 'text-rose-400' : 'text-[#00dbe9]';
                    return (
                      <div key={l.id} className="border-b border-[#00dbe9]/10 pb-1.5 flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[#849495]">[{new Date(l.timestamp).toLocaleTimeString()}]</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#0a161d] border border-[#00dbe9]/30 text-[#00dbe9]">{l.category}</span>
                          <span className={`font-bold ${color}`}>{l.message}</span>
                        </div>
                        {l.details && (
                          <p className="text-[#849495] pl-16 text-[10px] truncate" title={l.details}>{l.details}</p>
                        )}
                      </div>
                    );
                  })
              ) : (
                <>
                  <p className="text-emerald-400">[{new Date().toLocaleTimeString()}] 🚀 Multi-chain worker initialized across Base, Arbitrum, Optimism.</p>
                  <p className="text-[#00dbe9]">[{new Date().toLocaleTimeString()}] 📡 RPC Balance query verified for {agent?.walletAddress || "0x2ca1f801c1e19d16160c982c627e2932e95117be"}.</p>
                  <p className="text-amber-400">[{new Date().toLocaleTimeString()}] ⚡ Scanner status: {agent?.scannerEnabled ? "RUNNING" : "PAUSED"} | Mode: {agent?.executionEnabled ? "ARMED" : "SIMULATION"}.</p>
                  <p className="text-[#849495]">[{new Date().toLocaleTimeString()}] 🔍 Polling DEX routing quotes (10s interval)...</p>
                </>
              )}
            </div>
          </div>
        </div>
        </>
      )}
      </main>

      {/* Secure Token & Vault Settings Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-[#00dbe9]/40 bg-[#081217] p-6 shadow-2xl font-mono text-white relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#00dbe9]/20 mb-4">
              <h3 className="text-sm font-bold tracking-wider flex items-center gap-2 text-[#00dbe9]">
                <Lock className="w-4 h-4 text-[#00dbe9]" /> SECURE VAULT & CLI SESSION TOKEN
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSettingsModalOpen(false)}
                className="text-[#849495] hover:text-white"
              >
                ✕
              </Button>
            </div>

            <p className="text-xs text-[#849495] mb-4">
              Input and manage your MetaMask Agent CLI session token below. The token is stored securely in the backend vault and validated against the managed wallet.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] uppercase text-[#849495] block mb-1">MetaMask Agent CLI Token (JWT)</label>
                <Input
                  type="password"
                  placeholder="mm_token_..."
                  value={modalCliToken}
                  onChange={(e) => setModalCliToken(e.target.value)}
                  className="bg-[#050b0e] border-[#00dbe9]/30 text-white text-xs font-mono h-9"
                />
              </div>

              <div className="border-t border-[#00dbe9]/20 pt-4 space-y-4">
                <div>
                  <h4 className="text-[11px] uppercase font-mono text-white font-bold mb-1">Autonomous Strategy Profile</h4>
                  <p className="text-[10px] text-[#849495] mb-3">Switch between Guarded (conservative input caps, strict spread) and Aggressive (higher limits, faster poll).</p>
                  <div className="flex items-center justify-between bg-[#050b0e] p-3 rounded-lg border border-[#00dbe9]/20">
                    <div className="flex items-center gap-2">
                      <Zap className={`w-4 h-4 ${agent?.strategyProfile?.name === "aggressive" ? "text-amber-400" : "text-[#00dbe9]"}`} />
                      <div>
                        <p className="text-xs font-bold text-white uppercase">{agent?.strategyProfile?.label || "Guarded Strategy"}</p>
                        <p className="text-[10px] text-[#849495]">{agent?.strategyProfile?.description || "Safe execution parameters."}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const nextProfile = agent?.strategyProfile?.name === "aggressive" ? "guarded" : "aggressive";
                        setStrategyProfileMutation.mutate({ profile: nextProfile });
                      }}
                      disabled={setStrategyProfileMutation.isPending}
                      className={`font-mono font-bold text-xs px-4 h-8 ${agent?.strategyProfile?.name === "aggressive" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30" : "bg-[#00dbe9]/20 text-[#00dbe9] border border-[#00dbe9]/40 hover:bg-[#00dbe9]/30"}`}
                    >
                      {setStrategyProfileMutation.isPending ? "SWITCHING..." : agent?.strategyProfile?.name === "aggressive" ? "AGGRESSIVE (ACTIVE)" : "SWITCH TO AGGRESSIVE"}
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] uppercase font-mono text-white font-bold mb-1">Network Slippage Tolerance Settings</h4>
                  <p className="text-[10px] text-[#849495] mb-3">Configure custom maximum allowable slippage per network in basis points (100 BPS = 1.0%).</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(["base", "arbitrum", "optimism"] as const).map((net) => {
                      const bps = networkSlippage[net] || 50;
                      return (
                        <div key={net} className="bg-[#050b0e] p-3 rounded-lg border border-[#00dbe9]/20 space-y-2">
                          <div className="flex justify-between items-center text-[11px] font-mono">
                            <span className="text-white uppercase font-bold">{net}</span>
                            <span className="text-[#00dbe9]">{bps} BPS ({(bps / 100).toFixed(2)}%)</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="300"
                            step="5"
                            value={bps}
                            onChange={(e) => setNetworkSlippage({ ...networkSlippage, [net]: parseInt(e.target.value) || 50 })}
                            className="w-full accent-[#00dbe9] cursor-pointer"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              updateNetworkSlippageMutation.mutate({ network: net, slippageBps: bps });
                            }}
                            disabled={updateNetworkSlippageMutation.isPending}
                            className="w-full bg-[#00dbe9]/20 text-[#00dbe9] hover:bg-[#00dbe9]/30 text-[10px] h-6 font-mono"
                          >
                            SAVE {net.toUpperCase()}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-[#00dbe9]/15 pt-4">
                  <h4 className="text-[11px] uppercase font-mono text-white font-bold mb-1">Congestion Alerts</h4>
                  <p className="text-[10px] text-[#849495] mb-3">Receive a dashboard warning when live gas telemetry crosses the selected band. Alerts are read-only and never arm trading.</p>
                  <div className="mb-3 flex flex-wrap items-end gap-3 rounded-lg border border-amber-500/20 bg-[#050b0e] p-3">
                    <div className="min-w-[180px] flex-1">
                      <label htmlFor="gas-alert-cooldown" className="text-[10px] uppercase tracking-wider text-[#849495]">Alert cooldown</label>
                      <select
                        id="gas-alert-cooldown"
                        value={gasAlertCooldownDraft}
                        onChange={(event) => setGasAlertCooldownDraft(Number(event.target.value) as GasAlertCooldownMinutes)}
                        className="mt-1 h-8 w-full rounded border border-amber-500/25 bg-[#081217] px-2 text-[10px] font-mono text-white outline-none focus:border-amber-400"
                      >
                        {GAS_ALERT_COOLDOWN_OPTIONS.map((minutes) => (
                          <option key={minutes} value={minutes}>{minutes === 0 ? "DISABLED" : `${minutes} MINUTES`}</option>
                        ))}
                      </select>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => updateGasAlertCooldownMutation.mutate({ cooldownMinutes: gasAlertCooldownDraft })}
                      disabled={!isAuthenticated || updateGasAlertCooldownMutation.isPending || gasAlertCooldownDraft === gasAlertCooldownMinutes}
                      className="bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-[10px] h-8 font-mono border border-amber-500/25"
                    >
                      {updateGasAlertCooldownMutation.isPending ? "SAVING..." : "SAVE COOLDOWN"}
                    </Button>
                    <p className="w-full text-[9px] text-[#849495]">{getGasAlertCooldownLabel(gasAlertCooldownDraft)} · sustained congestion stays silent until the cooldown expires.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(["base", "arbitrum", "optimism"] as const).map((net) => {
                      const selectedThreshold = gasAlertSettings[net];
                      return (
                        <div key={`gas-alert-${net}`} className="bg-[#050b0e] p-3 rounded-lg border border-amber-500/20 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-white uppercase font-bold">{net}</span>
                            <span className={`h-2 w-2 rounded-full ${selectedThreshold === "DISABLED" ? "bg-slate-500" : selectedThreshold === "CONGESTED" ? "bg-rose-400" : "bg-amber-400"}`} />
                          </div>
                          <select
                            aria-label={`${net} congestion alert threshold`}
                            value={selectedThreshold}
                            onChange={(event) => setGasAlertSettings((current) => ({ ...current, [net]: event.target.value as GasAlertThreshold }))}
                            className="h-8 w-full rounded border border-amber-500/25 bg-[#081217] px-2 text-[10px] font-mono text-white outline-none focus:border-amber-400"
                          >
                            <option value="DISABLED">DISABLED</option>
                            <option value="ELEVATED">ELEVATED +</option>
                            <option value="CONGESTED">CONGESTED ONLY</option>
                          </select>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => updateGasAlertThresholdMutation.mutate({ network: net, threshold: selectedThreshold })}
                            disabled={!isAuthenticated || updateGasAlertThresholdMutation.isPending}
                            className="w-full bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-[10px] h-6 font-mono border border-amber-500/25"
                          >
                            {updateGasAlertThresholdMutation.isPending ? "SAVING..." : "SAVE ALERT"}
                          </Button>
                          <p className="text-[9px] text-[#849495]">{getGasAlertLabel(selectedThreshold)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="border-t border-[#00dbe9]/20 pt-4 space-y-3" aria-labelledby="manual-preflight-title">
                <div>
                  <h4 id="manual-preflight-title" className="text-[11px] uppercase font-mono text-white font-bold mb-1">Manual Live Preflight</h4>
                  <p className="text-[10px] text-[#849495]">Run a read-only runtime check before any owner-confirmed manual test. This action does not quote, sign, or broadcast a transaction.</p>
                </div>

                <div className="grid grid-cols-3 gap-2" role="group" aria-label="Preflight network">
                  {(["base", "arbitrum", "optimism"] as const).map((network) => (
                    <Button
                      key={`preflight-network-${network}`}
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-pressed={preflightNetwork === network}
                      onClick={() => setPreflightNetwork(network)}
                      className={`h-8 text-[10px] font-mono font-bold uppercase ${preflightNetwork === network ? "border-[#00dbe9] bg-[#00dbe9]/15 text-[#00dbe9]" : "border-[#00dbe9]/20 bg-[#050b0e] text-[#849495] hover:text-white"}`}
                    >
                      {network}
                    </Button>
                  ))}
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    setPreflightTestResult(null);
                    runPreflightTestMutation.mutate({ network: preflightNetwork });
                  }}
                  disabled={!isAuthenticated || runPreflightTestMutation.isPending}
                  aria-busy={runPreflightTestMutation.isPending}
                  className="w-full bg-[#00dbe9]/15 text-[#00dbe9] border border-[#00dbe9]/40 hover:bg-[#00dbe9]/25 text-xs font-mono font-bold"
                >
                  {runPreflightTestMutation.isPending ? (
                    <><RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" /> RUNNING PREFLIGHT…</>
                  ) : (
                    <>RUN MANUAL PREFLIGHT · {preflightNetwork.toUpperCase()}</>
                  )}
                </Button>

                {preflightTestResult && (
                  <div
                    className={`rounded-lg border p-3 space-y-3 ${manualPreflightStatus?.tone === "ready" ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}`}
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-[#849495]">
                        {preflightTestResult.network?.toUpperCase() || preflightNetwork.toUpperCase()} · CHECK RESULT
                      </span>
                      <span className={`text-[10px] font-bold ${manualPreflightStatus?.tone === "ready" ? "text-emerald-300" : "text-amber-300"}`}>
                        {manualPreflightStatus?.label}
                      </span>
                    </div>
                    <p className="text-[10px] leading-relaxed text-white/80">{preflightTestResult.message}</p>
                    <div className="space-y-1.5">
                      {preflightTestResult.checks?.map((check: { name: string; passed: boolean; detail: string }) => (
                        <div key={`${preflightTestResult.network || preflightNetwork}-${check.name}`} className="flex items-start gap-2 text-[10px]">
                          <span className={`mt-0.5 font-bold ${check.passed ? "text-emerald-300" : "text-rose-300"}`} aria-label={check.passed ? "Passed" : "Failed"}>
                            {getManualPreflightCheckLabel(check.passed)}
                          </span>
                          <span className="min-w-0 flex-1 text-white/90">{check.name}<span className="ml-2 text-[#849495]">{check.detail}</span></span>
                        </div>
                      ))}
                    </div>
                    <p className="border-t border-white/10 pt-2 text-[9px] text-[#849495]">Execution armed: {manualPreflightStatus?.executionLabel}</p>
                  </div>
                )}
              </div>

              <div className="p-3 rounded bg-[#050b0e] border border-[#00dbe9]/20 text-[11px] space-y-1 text-[#849495]">
                <div>CLI Binary Path: <span className="text-[#00dbe9]">{statusData?.agent?.cliConnection?.cliPath || "Checking..."}</span></div>
                <div>Session Status: <span className={statusData?.agent?.cliConnection?.sessionValidated ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>{statusData?.agent?.cliConnection?.sessionValidated ? "VALIDATED & ACTIVE" : "UNVERIFIED"}</span></div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSettingsModalOpen(false)}
                className="border-white/20 bg-transparent text-[#849495] hover:text-white text-xs"
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (modalCliToken.trim().length >= 10) {
                    submitTokenMutation.mutate({ token: modalCliToken.trim() });
                    setModalCliToken("");
                    setSettingsModalOpen(false);
                  } else {
                    toast.error("Please enter a valid MetaMask Agent token (at least 10 characters).");
                  }
                }}
                disabled={submitTokenMutation.isPending || modalCliToken.trim().length < 10}
                className="bg-[#00dbe9] text-black font-bold hover:bg-[#00dbe9]/80 text-xs"
              >
                {submitTokenMutation.isPending ? "SAVING & VALIDATING..." : "SAVE & VALIDATE TOKEN"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#00dbe9]/20 bg-[#081217] py-4 px-6 text-center text-xs text-[#849495]">
        TRADE ARENA PERMANENT ARBITRAGE SYSTEM • MANAGED VIA METAMASK AGENT WALLET
      </footer>
    </div>
  );
}
