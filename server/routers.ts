import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { ethers } from "ethers";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import * as cli from "./cli";
import * as directDex from "./directDex";
import { getStrategyProfile } from "./strategy";

const MANAGED_WALLET = "0x2ca1f801c1e19d16160c982c627e2932e95117be";

function getCliConnectionFailureMessage() {
  if (!cli.isMetaMaskCliAvailable()) {
    return `MetaMask Agent CLI binary is unavailable at ${cli.getMetaMaskCliPath()}. Install it or set MM_PATH to an executable path.`;
  }
  return "MetaMask Agent CLI could not validate the token. Check that the token is current and belongs to the managed wallet.";
}

const providers = {
  base: new ethers.JsonRpcProvider("https://mainnet.base.org"),
  arbitrum: new ethers.JsonRpcProvider("https://arb1.arbitrum.io/rpc"),
  optimism: new ethers.JsonRpcProvider("https://mainnet.optimism.io"),
};

export const appRouter = router({
    // Hydrate process.env.MM_CLI_TOKEN from agent_state database on startup
    ...(() => {
      db.getAgentStateKey("mm_cli_token").then(token => {
        if (token && !process.env.MM_CLI_TOKEN) {
          process.env.MM_CLI_TOKEN = token;
        }
      }).catch(() => {});
      return {};
    })(),
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  arbitrage: router({
    status: publicProcedure.query(async () => {
      let baseBal = "0.0000";
      let arbitrumBal = "0.0000";
      let optimismBal = "0.0000";

      try {
        const [bWei, aWei, oWei] = await Promise.all([
          providers.base.getBalance(MANAGED_WALLET).catch(() => BigInt(0)),
          providers.arbitrum.getBalance(MANAGED_WALLET).catch(() => BigInt(0)),
          providers.optimism.getBalance(MANAGED_WALLET).catch(() => BigInt(0)),
        ]);
        baseBal = ethers.formatEther(bWei);
        arbitrumBal = ethers.formatEther(aWei);
        optimismBal = ethers.formatEther(oWei);
      } catch (e) {
        console.error("[RPC Balance] Error fetching balances:", e);
      }

      // Record snapshot
      await db.recordBalanceSnapshot({
        baseBal,
        arbitrumBal,
        optimismBal,
      });

      const scannerRunningVal = await db.getAgentStateKey("scanner_running");
      const scannerRunning = scannerRunningVal !== "false";
      const executionEnabledVal = await db.getAgentStateKey("execution_enabled");
      const executionEnabled = executionEnabledVal === "true";
      const minProfitThreshold = await db.getAgentStateKey("min_profit_threshold") || "0.00";
      const cliToken = await db.getAgentStateKey("mm_cli_token") || process.env.MM_CLI_TOKEN || "";
      const cliSessionValidated = (await db.getAgentStateKey("mm_cli_session_validated")) === "true";
      const cliLastValidatedAt = await db.getAgentStateKey("mm_cli_last_validated_at");
      const strategy = getStrategyProfile(await db.getAgentStateKey("strategy_profile"));
      const directExecutionPreflight = directDex.getDirectExecutionPreflight();
      const cliConnection = {
        ...cli.getMetaMaskAgentConnectionStatus({
          tokenConfigured: Boolean(cliToken),
          cliAvailable: cli.isMetaMaskCliAvailable(),
          sessionValidated: cliSessionValidated,
          cliPath: cli.getMetaMaskCliPath(),
        }),
        lastValidatedAt: cliLastValidatedAt,
      };

      const recentTrades = await db.getRecentTrades(10);
      const suppressedAlerts = await db.getSuppressedAlerts(10);
      const agentLogs = await db.getAgentLogs(50);

      return {
        success: true,
        agent: {
          walletMode: "managed-agent",
          walletAddress: MANAGED_WALLET,
          balances: {
            base: parseFloat(baseBal).toFixed(4),
            arbitrum: parseFloat(arbitrumBal).toFixed(4),
            optimism: parseFloat(optimismBal).toFixed(4),
          },
          executionEnabled,
          executionBadge: executionEnabled ? "EXECUTION_ARMED" : "SIMULATION_ONLY",
          executionPreflight: directExecutionPreflight,
          strategyProfile: strategy,
          scannerEnabled: scannerRunning,
          running: scannerRunning,
          minProfitThreshold,
          cliConnection,
          networks: ["base", "arbitrum", "optimism"],
          networkConfigs: strategy.networks,
          recentTrades,
          suppressedAlerts,
          agentLogs,
        },
        timestamp: Date.now(),
      };
    }),

    toggleScanner: protectedProcedure.mutation(async ({ ctx }) => {
      const current = await db.getAgentStateKey("scanner_running");
      const nextState = current === "false" ? "true" : "false";
      const executionEnabled = await db.getAgentStateKey("execution_enabled") === "true";
      if (nextState === "true" && executionEnabled) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Scanner remains paused while owner-only live execution is armed. Disable live execution before enabling automated scanning." });
      }
      await db.setAgentStateKey("scanner_running", nextState);
      return { success: true, scannerEnabled: nextState !== "false", manualOnly: executionEnabled };
    }),

    toggleExecution: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.openId !== process.env.OWNER_OPEN_ID) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owner/admin can arm live execution." });
      }
      const current = await db.getAgentStateKey("execution_enabled");
      const nextState = current === "true" ? "false" : "true";
      if (nextState === "true") {
        const preflight = directDex.getDirectExecutionPreflight();
        if (!preflight.ready) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Live execution remains disarmed: ${preflight.reasons.join(" ")}` });
        }
        await db.setAgentStateKey("scanner_running", "false");
      }
      await db.setAgentStateKey("execution_enabled", nextState);
      return { success: true, executionEnabled: nextState === "true", manualOnly: nextState === "true" };
    }),

    setStrategyProfile: protectedProcedure.input(z.object({ profile: z.enum(["guarded", "aggressive"]) })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.openId !== process.env.OWNER_OPEN_ID) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owner/admin can change the strategy profile." });
      }
      const strategy = getStrategyProfile(input.profile);
      await db.setAgentStateKey("strategy_profile", strategy.name);
      await db.recordAgentLog({
        level: "WARN",
        category: "STRATEGY",
        message: `Strategy profile changed to ${strategy.label}`,
        details: `${strategy.description} Poll: ${strategy.pollIntervalMs}ms | Max input: ${strategy.maxInputWeth} WETH`,
      });
      return { success: true, strategyProfile: strategy };
    }),

    submitToken: protectedProcedure.input(z.object({ token: z.string().min(10) })).mutation(async ({ input, ctx }) => {
      // Owner/admin check
      if (ctx.user.role !== "admin" && ctx.user.openId !== process.env.OWNER_OPEN_ID) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owner/admin can submit CLI session tokens." });
      }

      await db.setAgentStateKey("mm_cli_token", input.token);
      await db.setAgentStateKey("mm_cli_session_validated", "false");
      process.env.MM_CLI_TOKEN = input.token;

      if (!cli.isMetaMaskCliAvailable()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Token saved but not validated. ${getCliConnectionFailureMessage()}` });
      }

      const loggedIn = await cli.loginWithToken(input.token);
      if (!loggedIn) {
        await db.setAgentStateKey("mm_cli_session_validated", "false");
        throw new TRPCError({ code: "BAD_REQUEST", message: getCliConnectionFailureMessage() });
      }

      await db.setAgentStateKey("mm_cli_session_validated", "true");
      await db.setAgentStateKey("mm_cli_last_validated_at", new Date().toISOString());
      return { success: true, message: "MetaMask Agent CLI authenticated and session active." };
    }),

    reconnectAgent: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.openId !== process.env.OWNER_OPEN_ID) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owner/admin can reconnect the MetaMask Agent." });
      }

      const token = await db.getAgentStateKey("mm_cli_token") || process.env.MM_CLI_TOKEN || "";
      if (!token) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No MetaMask Agent token is configured. Add a token in Secure Vault first." });
      }

      await db.setAgentStateKey("mm_cli_session_validated", "false");
      if (!cli.isMetaMaskCliAvailable()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: getCliConnectionFailureMessage() });
      }

      const loggedIn = await cli.loginWithToken(token);
      if (!loggedIn) {
        await db.setAgentStateKey("mm_cli_session_validated", "false");
        throw new TRPCError({ code: "BAD_REQUEST", message: getCliConnectionFailureMessage() });
      }

      await db.setAgentStateKey("mm_cli_session_validated", "true");
      await db.setAgentStateKey("mm_cli_last_validated_at", new Date().toISOString());
      return { success: true, connected: true, message: "MetaMask Agent reconnected and session validated." };
    }),

    disconnectAgent: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.openId !== process.env.OWNER_OPEN_ID) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owner/admin can disconnect the MetaMask Agent." });
      }

      const cliLogoutSucceeded = cli.isMetaMaskCliAvailable() ? await cli.logoutSession() : false;
      await db.setAgentStateKey("mm_cli_session_validated", "false");
      return {
        success: true,
        connected: false,
        cliLogoutSucceeded,
        message: cliLogoutSucceeded
          ? "MetaMask Agent disconnected."
          : `MetaMask Agent marked disconnected; ${getCliConnectionFailureMessage()}`,
      };
    }),

    updateMinProfitThreshold: protectedProcedure.input(z.object({ threshold: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { message: "Threshold must be a valid non-negative number" }) })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.openId !== process.env.OWNER_OPEN_ID) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owner/admin can change notification thresholds." });
      }
      await db.setAgentStateKey("min_profit_threshold", input.threshold);
      return { success: true, minProfitThreshold: input.threshold };
    }),

    runArbitrageCheck: protectedProcedure.input(z.object({ network: z.enum(["base", "arbitrum", "optimism"]) })).mutation(async ({ input, ctx }) => {
      await db.recordAgentLog({
        level: "INFO",
        category: "SCANNER",
        message: `Manual arbitrage check triggered on ${input.network.toUpperCase()} (Chain ID: ${input.network === 'base' ? 8453 : input.network === 'arbitrum' ? 42161 : 10})`,
        details: `Execution mode: ${await db.getAgentStateKey("execution_enabled") === "true" ? "LIVE" : "SIMULATION"}`,
      });

      const cli = await import("./cli");
      const executionEnabledVal = await db.getAgentStateKey("execution_enabled");
      const isLive = executionEnabledVal === "true";

      const strategy = getStrategyProfile(await db.getAgentStateKey("strategy_profile"));
      const executionAdapter = (process.env.EXECUTION_ADAPTER || "direct").trim().toLowerCase();
      const directPreflight = directDex.getDirectExecutionPreflight();
      const config = strategy.networks[input.network];

      if (isLive && executionAdapter === "direct") {
        if (!directPreflight.ready) {
          const message = `Live execution blocked by preflight: ${directPreflight.reasons.join(" ")}`;
          await db.recordAgentLog({ level: "ERROR", category: "EXECUTION", message });
          return { success: false, executed: false, adapter: "direct-ethers-uniswap-v3", error: message };
        }
        const amountIn = process.env.DIRECT_INPUT_AMOUNT?.trim() || strategy.maxInputWeth;
        if (!Number.isFinite(Number(amountIn)) || Number(amountIn) <= 0 || Number(amountIn) > Number(strategy.maxInputWeth)) {
          const message = `Input amount ${amountIn} WETH exceeds the ${strategy.label} strategy cap of ${strategy.maxInputWeth} WETH.`;
          await db.recordAgentLog({ level: "ERROR", category: "EXECUTION", message });
          return { success: false, executed: false, adapter: "direct-ethers-uniswap-v3", error: message };
        }
        await db.recordAgentLog({
          level: "INFO",
          category: "EXECUTION",
          message: `Preparing ${strategy.label.toLowerCase()} direct Ethers.js swap on ${input.network} (Max Slippage: ${config.slippage}%, Pool Fee: ${config.poolFee})`,
          details: `Target: WETH -> native USDC | Input: ${amountIn} WETH | No profit claim until a round trip is measured`,
        });

        try {
          const execution = await directDex.executeDirectSwap({
            network: input.network as directDex.DirectDexNetwork,
            amountIn,
            slippagePercent: config.slippage,
            poolFee: config.poolFee,
          });
          await db.recordAgentLog({
            level: "SUCCESS",
            category: "SETTLEMENT",
            message: `Direct Ethers.js swap confirmed on ${input.network}`,
            details: `TxHash: ${execution.txHash} | Minimum output: ${execution.amountOutMinimum} native USDC | Profit: not computed`,
          });
          return {
            success: true,
            executed: true,
            adapter: "direct-ethers-uniswap-v3",
            txHash: execution.txHash,
            quote: execution,
            profit: null,
            notificationSuppressed: true,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await db.recordAgentLog({
            level: "ERROR",
            category: "EXECUTION",
            message: `Direct Ethers.js swap blocked or failed on ${input.network}`,
            details: message,
          });
          return { success: false, executed: false, adapter: "direct-ethers-uniswap-v3", error: message };
        }
      }

      if (isLive && executionAdapter === "cli") {
        const message = "CLI live fallback is disabled. Select the guarded direct Ethers.js adapter after preflight passes.";
        await db.recordAgentLog({ level: "ERROR", category: "EXECUTION", message });
        return { success: false, executed: false, error: message };
      }

      if (!isLive && executionAdapter === "direct") {
        // Direct simulation mode: QuoterV2 uses eth_call and never broadcasts a transaction.
          const amountIn = process.env.DIRECT_INPUT_AMOUNT?.trim() || strategy.maxInputWeth;
        try {
          await db.recordAgentLog({
            level: "INFO",
            category: "SIMULATION",
            message: `Simulating direct Ethers.js quote on ${input.network} (Pool Fee: ${config.poolFee})`,
            details: `Target: WETH -> native USDC | Input: ${amountIn} WETH | No transaction broadcast`,
          });
          const quote = await directDex.quoteDirectSwap({
            network: input.network as directDex.DirectDexNetwork,
            amountIn,
            poolFee: config.poolFee,
          });
          await db.recordAgentLog({
            level: "SUCCESS",
            category: "SIMULATION",
            message: `Direct QuoterV2 simulation completed on ${input.network}`,
            details: JSON.stringify(quote),
          });
          return { success: true, executed: false, adapter: "direct-ethers-uniswap-v3", simulation: quote };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await db.recordAgentLog({ level: "ERROR", category: "SIMULATION", message: `Direct quote failed on ${input.network}`, details: message });
          return { success: false, executed: false, adapter: "direct-ethers-uniswap-v3", error: message };
        }
      } else if (!isLive && executionAdapter === "cli") {
        // Legacy CLI simulation mode
        await db.recordAgentLog({
          level: "INFO",
          category: "SIMULATION",
          message: `Simulating arbitrage route on ${input.network} (Max Slippage: ${config.slippage * 100}%)`,
          details: `Target: WETH -> USDC`,
        });
          const res = await cli.simulateSwap(config.chainId, "WETH", "USDC", strategy.maxInputWeth, config.slippage);
        await db.recordAgentLog({
          level: "SUCCESS",
          category: "SIMULATION",
          message: `Simulation completed on ${input.network}`,
          details: JSON.stringify(res.stdout || res),
        });
        return { success: true, executed: false, adapter: "cli", simulation: res.stdout || res };
      } else {
        const message = `Unsupported execution adapter '${executionAdapter}'. Use 'direct' or 'cli'.`;
        await db.recordAgentLog({ level: "ERROR", category: "EXECUTION", message });
        return { success: false, executed: false, error: message };
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
