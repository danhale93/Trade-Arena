import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // Scheduled Polling Endpoint (Heartbeat)
  app.post("/api/scheduled/poll-arbitrage", async (req, res) => {
    try {
      const { sdk } = await import("./sdk");
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron) {
        return res.status(403).json({ error: "Unauthorized cron access" });
      }

      // Perform background balance snapshot and check
      const { ethers } = await import("ethers");
      const db = await import("../db");
      const MANAGED_WALLET = "0x2ca1f801c1e19d16160c982c627e2932e95117be";
      const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
      const bWei = await provider.getBalance(MANAGED_WALLET).catch(() => BigInt(0));
      const baseBal = ethers.formatEther(bWei);

      await db.recordBalanceSnapshot({
        baseBal,
        arbitrumBal: "0.0050",
        optimismBal: "0.0050",
      });

      return res.json({ success: true, timestamp: Date.now(), baseBal });
    } catch (e: any) {
      console.error("[Heartbeat] Poll error:", e);
      // Sentinel: Do not leak stack traces in HTTP responses to prevent information disclosure
      return res.status(500).json({ error: e.message || "Internal server error" });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
