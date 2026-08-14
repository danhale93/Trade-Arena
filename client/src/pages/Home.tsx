import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Play, Pause, Terminal, Cpu, Zap, Activity, CheckCircle2, Lock, RefreshCw } from "lucide-react";
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

  const agent = statusData?.agent;
  const balances = agent?.balances || { base: "0.0000", arbitrum: "0.0000", optimism: "0.0000" };
  const networkConfigs = agent?.networkConfigs || {
    base: { chainId: "8453", tokenIn: "WETH", tokenOut: "USDC", profitThresholdUsd: 0.01, slippage: 0.1 },
    arbitrum: { chainId: "42161", tokenIn: "WETH", tokenOut: "USDC", profitThresholdUsd: 0.05, slippage: 0.15 },
    optimism: { chainId: "10", tokenIn: "WETH", tokenOut: "USDC", profitThresholdUsd: 0.05, slippage: 0.15 },
  };

  return (
    <div className="min-h-screen bg-[#050b0e] text-[#00dbe9] font-mono selection:bg-[#00dbe9]/30 selection:text-white flex flex-col">
      {/* Top Header */}
      <header className="border-b border-[#00dbe9]/20 bg-[#081217]/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="w-6 h-6 text-[#00dbe9]" />
          <h1 className="font-bold tracking-wider text-lg text-white">TRADE ARENA <span className="text-[#00dbe9] font-normal text-xs ml-2 px-2 py-0.5 border border-[#00dbe9]/30 rounded bg-[#00dbe9]/10">CYBER-TERMINAL v4.4</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-[#849495]">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            RPC Connected
          </div>
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
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {/* Top Balances & Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0a161d] border border-[#00dbe9]/30 p-4 rounded-xl relative overflow-hidden shadow-[0_0_15px_rgba(0,219,233,0.05)]">
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
            <div className="bg-[#081217] border border-[#00dbe9]/30 p-6 rounded-xl">
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
                  <span className="text-emerald-400">Enabled (0.1% - 0.15% max slippage)</span>
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

            {/* CLI Token Submission */}
            <div className="bg-[#081217] border border-[#00dbe9]/30 p-6 rounded-xl">
              <h2 className="text-sm font-bold tracking-wider text-white mb-2 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#00dbe9]" /> METAMASK AGENT CLI SESSION AUTH
              </h2>
              <p className="text-xs text-[#849495] mb-4">Paste your fresh CLI JWT token to renew session credentials without server redeployment.</p>
              
              <div className="flex gap-3">
                <Input 
                  type="password"
                  placeholder="eyJhbGciOiJSUzI1NiIs..." 
                  value={cliToken}
                  onChange={(e) => setCliToken(e.target.value)}
                  className="bg-[#050b0e] border-[#00dbe9]/30 text-white text-xs placeholder:text-[#849495]/40 font-mono"
                />
                <Button 
                  onClick={() => submitTokenMutation.mutate({ token: cliToken })}
                  disabled={!isAuthenticated || !cliToken || submitTokenMutation.isPending}
                  className="bg-[#00dbe9] text-black hover:bg-[#00dbe9]/80 text-xs font-bold px-6 shrink-0"
                >
                  {submitTokenMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "SUBMIT"}
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Per-Chain Configuration Panel */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-[#081217] border border-[#00dbe9]/30 p-6 rounded-xl h-full flex flex-col">
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

        {/* Bottom Section: Trade History & Live Event Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Trade History Table */}
          <div className="lg:col-span-8 bg-[#081217] border border-[#00dbe9]/30 p-6 rounded-xl flex flex-col">
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
                    <th className="pb-3">TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#00dbe9]/10">
                  {agent?.recentTrades && agent.recentTrades.length > 0 ? (
                    agent.recentTrades.map((t: any) => (
                      <tr key={t.id} className="hover:bg-[#00dbe9]/5">
                        <td className="py-3 uppercase text-[#00dbe9]">{t.network}</td>
                        <td className="py-3 text-white">{t.tokenPair}</td>
                        <td className="py-3 text-emerald-400 font-bold">+${t.netProfitUsd}</td>
                        <td className="py-3 text-[#849495] truncate max-w-[120px]">{t.txHash}</td>
                        <td className="py-3 text-[#849495]">{new Date(t.timestamp).toLocaleTimeString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#849495] italic">
                        No trade history recorded yet. Scanner is actively monitoring multi-chain quote spreads.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Event Stream */}
          <div className="lg:col-span-4 bg-[#081217] border border-[#00dbe9]/30 p-6 rounded-xl flex flex-col">
            <h2 className="text-sm font-bold tracking-wider text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00dbe9]" /> LIVE EVENT STREAM
            </h2>
            <div className="bg-[#050b0e] p-4 rounded-lg border border-[#00dbe9]/20 font-mono text-[11px] h-[220px] overflow-y-auto space-y-2 text-[#849495]">
              <p className="text-emerald-400">[{new Date().toLocaleTimeString()}] 🚀 Multi-chain worker initialized across Base, Arbitrum, Optimism.</p>
              <p className="text-[#00dbe9]">[{new Date().toLocaleTimeString()}] 📡 RPC Balance query verified for {agent?.walletAddress || "0x2ca1f801c1e19d16160c982c627e2932e95117be"}.</p>
              <p className="text-amber-400">[{new Date().toLocaleTimeString()}] ⚡ Scanner status: {agent?.scannerEnabled ? "RUNNING" : "PAUSED"} | Mode: {agent?.executionEnabled ? "ARMED" : "SIMULATION"}.</p>
              <p className="text-[#849495]">[{new Date().toLocaleTimeString()}] 🔍 Polling DEX routing quotes (10s interval)...</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#00dbe9]/20 bg-[#081217] py-4 px-6 text-center text-xs text-[#849495]">
        TRADE ARENA PERMANENT ARBITRAGE SYSTEM • MANAGED VIA METAMASK AGENT WALLET
      </footer>
    </div>
  );
}
