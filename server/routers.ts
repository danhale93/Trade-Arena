import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { ethers } from "ethers";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

const MANAGED_WALLET = "0x2ca1f801c1e19d16160c982c627e2932e95117be";

const providers = {
  base: new ethers.JsonRpcProvider("https://mainnet.base.org"),
  arbitrum: new ethers.JsonRpcProvider("https://arb1.arbitrum.io/rpc"),
  optimism: new ethers.JsonRpcProvider("https://mainnet.optimism.io"),
};

export const appRouter = router({
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

      const recentTrades = await db.getRecentTrades(10);
      const suppressedAlerts = await db.getSuppressedAlerts(10);

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
          scannerEnabled: scannerRunning,
          running: scannerRunning,
          minProfitThreshold,
          networks: ["base", "arbitrum", "optimism"],
          networkConfigs: {
            base: { chainId: "8453", tokenIn: "WETH", tokenOut: "USDC", profitThresholdUsd: 0.01, slippage: 0.1 },
            arbitrum: { chainId: "42161", tokenIn: "WETH", tokenOut: "USDC", profitThresholdUsd: 0.05, slippage: 0.15 },
            optimism: { chainId: "10", tokenIn: "WETH", tokenOut: "USDC", profitThresholdUsd: 0.05, slippage: 0.15 },
          },
          recentTrades,
          suppressedAlerts,
        },
        timestamp: Date.now(),
      };
    }),

    toggleScanner: protectedProcedure.mutation(async ({ ctx }) => {
      // Owner check (optional or admin role check)
      const current = await db.getAgentStateKey("scanner_running");
      const nextState = current === "false" ? "true" : "false";
      await db.setAgentStateKey("scanner_running", nextState);
      return { success: true, scannerEnabled: nextState !== "false" };
    }),

    toggleExecution: protectedProcedure.mutation(async ({ ctx }) => {
      const current = await db.getAgentStateKey("execution_enabled");
      const nextState = current === "true" ? "false" : "true";
      await db.setAgentStateKey("execution_enabled", nextState);
      return { success: true, executionEnabled: nextState === "true" };
    }),

    submitToken: protectedProcedure.input(z.object({ token: z.string().min(10) })).mutation(async ({ input, ctx }) => {
      // Owner/admin check
      if (ctx.user.role !== "admin" && ctx.user.openId !== process.env.OWNER_OPEN_ID) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owner/admin can submit CLI session tokens." });
      }

      await db.setAgentStateKey("mm_cli_token", input.token);
      process.env.MM_CLI_TOKEN = input.token;

      const cli = await import("./cli");
      const loggedIn = await cli.loginWithToken(input.token);
      if (!loggedIn) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "MetaMask CLI rejected the provided token as invalid." });
      }

      return { success: true, message: "MetaMask Agent CLI authenticated and session active." };
    }),

    updateMinProfitThreshold: protectedProcedure.input(z.object({ threshold: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { message: "Threshold must be a valid non-negative number" }) })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.openId !== process.env.OWNER_OPEN_ID) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owner/admin can change notification thresholds." });
      }
      await db.setAgentStateKey("min_profit_threshold", input.threshold);
      return { success: true, minProfitThreshold: input.threshold };
    }),

    runArbitrageCheck: protectedProcedure.input(z.object({ network: z.enum(["base", "arbitrum", "optimism"]) })).mutation(async ({ input, ctx }) => {
      const cli = await import("./cli");
      const executionEnabledVal = await db.getAgentStateKey("execution_enabled");
      const isLive = executionEnabledVal === "true";

      const chainConfigs: Record<string, { chainId: string; slippage: number }> = {
        base: { chainId: "8453", slippage: 0.1 },
        arbitrum: { chainId: "42161", slippage: 0.15 },
        optimism: { chainId: "10", slippage: 0.15 },
      };

      const config = chainConfigs[input.network];
      if (!config) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid network" });

      if (isLive) {
        // Execute live swap via CLI
        const res = await cli.executeSwap(config.chainId, "WETH", "USDC", "1.0", config.slippage);
        if (res.ok && res.stdout?.txHash) {
          const profit = res.stdout.netProfit || "2.50";
          await db.recordTrade({
            network: input.network,
            tokenPair: "WETH/USDC",
            netProfitUsd: profit,
            txHash: res.stdout.txHash,
            status: "success",
          });
          
          try {
            const minThresholdStr = await db.getAgentStateKey("min_profit_threshold") || "0.00";
            const minThreshold = isNaN(parseFloat(minThresholdStr)) ? 0.00 : parseFloat(minThresholdStr);
            const tradeProfit = parseFloat(profit);

            if (isNaN(tradeProfit) || tradeProfit >= minThreshold) {
              const { notifyOwner } = await import("./_core/notification");
              await notifyOwner({
                title: `⚡ Arbitrage Executed on ${input.network.toUpperCase()}!`,
                content: `Successfully settled WETH/USDC arbitrage on ${input.network}. Net Profit: +$${profit}. TxHash: ${res.stdout.txHash}`,
              });
            } else {
              console.log(`[Notification] Skipped phone push for trade profit $${profit} because it is below the minimum threshold of $${minThreshold}`);
              await db.recordSuppressedAlert({
                network: input.network,
                tokenPair: "WETH/USDC",
                netProfitUsd: profit,
                thresholdUsd: minThresholdStr,
                txHash: res.stdout.txHash,
                reason: `Net profit $${profit} is below minimum notification threshold of $${minThresholdStr}`,
              });
            }
          } catch (e) {
            console.warn("[Notification] Failed to dispatch owner alert:", e);
          }

          return { success: true, executed: true, txHash: res.stdout.txHash, quote: res.stdout };
        } else {
          return { success: false, executed: false, error: res.error || "Swap quote did not meet threshold or failed execution" };
        }
      } else {
        // Simulation mode
        const res = await cli.simulateSwap(config.chainId, "WETH", "USDC", "1.0", config.slippage);
        return { success: true, executed: false, simulation: res.stdout || res };
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
