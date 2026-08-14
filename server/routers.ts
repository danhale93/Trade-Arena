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

      const recentTrades = await db.getRecentTrades(10);

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
          networks: ["base", "arbitrum", "optimism"],
          networkConfigs: {
            base: { chainId: "8453", tokenIn: "WETH", tokenOut: "USDC", profitThresholdUsd: 0.01, slippage: 0.1 },
            arbitrum: { chainId: "42161", tokenIn: "WETH", tokenOut: "USDC", profitThresholdUsd: 0.05, slippage: 0.15 },
            optimism: { chainId: "10", tokenIn: "WETH", tokenOut: "USDC", profitThresholdUsd: 0.05, slippage: 0.15 },
          },
          recentTrades,
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
      await db.setAgentStateKey("mm_cli_token", input.token);
      process.env.MM_CLI_TOKEN = input.token;
      return { success: true, message: "CLI token registered successfully. Session active." };
    }),
  }),
});

export type AppRouter = typeof appRouter;
