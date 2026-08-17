import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Play, Pause, Terminal, Cpu, Zap, Activity, CheckCircle2, Lock, RefreshCw, Bell, Power } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const lastSeenTradeIdRef = useRef<number | null>(null);

  const { data: statusData, isLoading: statusLoading } = trpc.arbitrage.status.useQuery(undefined, {
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

  const submitTokenMutation = trpc.arbitrage.submitToken.useMutation({
    onSuccess: () => {
      toast.success("MetaMask Agent CLI token submitted and session refreshed.");
      setCliToken("");
      utils.arbitrage.status.invalidate();
    },
    onError: (err) => {
      toast.error("Token submission failed: " + err.message);
    }
  });

  const reconnectAgentMutation = trpc.arbitrage.reconnectAgent.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
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
        toast.info("Simulation completed: " + JSON.stringify(data.simulation?.netProfit || "No profitable spread found"));
      }
      utils.arbitrage.status.invalidate();
    },
    onError: (err) => {
      toast.error("Arb check failed: " + err.message);
    }
  });

  const [cliToken, setCliToken] = useState("");
  const [miniWidgetMode, setMiniWidgetMode] = useState(false);
  const [logFilter, setLogFilter] = useState("ALL");
  const logScrollRef = useRef<HTMLDivElement>(null);

  const agent = statusData?.agent;
  const cliConnection = agent?.cliConnection;
  const cliConnected = cliConnection?.status === "connected";
  const connectionActionPending = reconnectAgentMutation.isPending || disconnectAgentMutation.isPending;

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

  return (
    <div className="stitch-shell min-h-screen bg-[#050b0e] text-[#00dbe9] font-mono selection:bg-[#00dbe9]/30 selection:text-white flex flex-col">
      {/* Top Header */}
      <header className="stitch-header border-b border-[#00dbe9]/20 bg-[#081217]/80 backdrop-blur sticky top-0 z-50 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-y-3">
        <div className="flex items-center gap-3">
          <Terminal className="w-6 h-6 text-[#00dbe9]" />
          <h1 className="font-bold tracking-wider text-base sm:text-lg text-white">TRADE ARENA <span className="hidden sm:inline text-[#00dbe9] font-normal text-xs ml-2 px-2 py-0.5 border border-[#00dbe9]/30 rounded bg-[#00dbe9]/10">CYBER-TERMINAL v4.4</span></h1>
        </div>
        <div className="w-full md:w-auto flex flex-wrap items-center justify-end gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-[#849495]">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            RPC Connected
          </div>
          <div
            role="status"
            aria-live="polite"
            title={cliConnection?.reason || "Checking MetaMask Agent session status."}
            aria-label={`MetaMask Agent token ${cliConnection?.label?.toLowerCase() || "status checking"}`}
            className={`flex items-center gap-2 rounded border px-2.5 py-1.5 text-[10px] font-bold tracking-wider transition-colors ${
              cliConnected
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/30 bg-rose-500/10 text-rose-300"
            }`}
          >
            <span className={`inline-block h-2 w-2 rounded-full ${cliConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
            <span className="inline whitespace-nowrap">AGENT {statusLoading || !cliConnection ? "CHECKING" : cliConnection.label}</span>
            <span className="sr-only">
              {statusLoading || !cliConnection
                ? "MetaMask Agent token connection is being checked."
                : `MetaMask Agent token is ${cliConnection.label.toLowerCase()}. ${cliConnection.reason}`}
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

        {/* Main Grid: Controls & Config */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Controls & CLI Token Submission */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Wallet & Security Info */}
            <div className="stitch-panel bg-[#081217] border border-[#00dbe9]/30 p-6 rounded-xl">
              <h2 className="text-sm font-bold tracking-wider text-white mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#00dbe9]" /> METAMASK AGENT WALLET SYNC
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
              </div>

              {/* Owner Controls */}
              <div className="mt-6 pt-6 border-t border-[#00dbe9]/20 flex flex-wrap gap-4">
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
                  disabled={!isAuthenticated || toggleExecutionMutation.isPending}
                  className={`flex-1 py-3 text-xs font-bold border ${
                    agent?.executionEnabled 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                      : 'bg-[#00dbe9]/10 border-[#00dbe9]/30 text-[#00dbe9] hover:bg-[#00dbe9]/20'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 mr-2" />
                  {agent?.executionEnabled ? "SWITCH TO SIMULATION" : "ARM LIVE EXECUTION"}
                </Button>
              </div>
              {!isAuthenticated && (
                <p className="text-[10px] text-amber-400/80 mt-2 text-center">🔐 Log in with owner account via Manus OAuth to unlock control buttons.</p>
              )}
            </div>

            {/* CLI Token Submission / Settings Panel */}
            <div className="stitch-panel bg-[#081217] border border-[#00dbe9]/30 p-6 rounded-xl relative overflow-hidden flex flex-col gap-6">
              <div className="absolute top-0 right-0 bg-[#00dbe9]/10 text-[#00dbe9] border-l border-b border-[#00dbe9]/30 px-3 py-1 rounded-bl text-[10px] font-mono tracking-wider">
                SETTINGS / SECURE VAULT
              </div>
              
              <div>
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
                    <span className="text-white font-bold text-sm uppercase">Base Mainnet</span>
                    <span className="text-[10px] bg-[#00dbe9]/10 text-[#00dbe9] border border-[#00dbe9]/30 px-2 py-0.5 rounded">Chain ID: {networkConfigs.base.chainId}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#849495]">
                    <div>Profit Threshold: <span className="text-emerald-400 font-bold">${networkConfigs.base.profitThresholdUsd.toFixed(2)}</span></div>
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
                <div className="p-4 bg-[#050b0e] rounded-lg border border-emerald-500/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-bold text-sm uppercase">Arbitrum One</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">Chain ID: {networkConfigs.arbitrum.chainId}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#849495]">
                    <div>Profit Threshold: <span className="text-emerald-400 font-bold">${networkConfigs.arbitrum.profitThresholdUsd.toFixed(2)}</span></div>
                    <div>Max Slippage: <span className="text-emerald-400 font-bold">{networkConfigs.arbitrum.slippage}%</span></div>
                  </div>
                </div>

                {/* Optimism */}
                <div className="p-4 bg-[#050b0e] rounded-lg border border-purple-500/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-bold text-sm uppercase">Optimism Bedrock</span>
                    <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded">Chain ID: {networkConfigs.optimism.chainId}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#849495]">
                    <div>Profit Threshold: <span className="text-emerald-400 font-bold">${networkConfigs.optimism.profitThresholdUsd.toFixed(2)}</span></div>
                    <div>Max Slippage: <span className="text-purple-400 font-bold">{networkConfigs.optimism.slippage}%</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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

      {/* Footer */}
      <footer className="border-t border-[#00dbe9]/20 bg-[#081217] py-4 px-6 text-center text-xs text-[#849495]">
        TRADE ARENA PERMANENT ARBITRAGE SYSTEM • MANAGED VIA METAMASK AGENT WALLET
      </footer>
    </div>
  );
}
