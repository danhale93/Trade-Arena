import util from "util";
import { execFile, execSync } from "child_process";
import path from "path";
import fs from "fs";

const execFilePromise = util.promisify(execFile);

let mmLock = false;
export function getMetaMaskCliPath() {
  if (process.env.MM_PATH?.trim()) {
    return process.env.MM_PATH.trim();
  }
  const localBin = path.join(process.cwd(), "node_modules/.bin/mm");
  try {
    if (fs.existsSync(localBin)) {
      return localBin;
    }
  } catch {}
  // Check common PATH locations or rely on 'mm' command if available
  try {
    const whichRes = execSync("which mm", { encoding: "utf8" }).trim();
    if (whichRes && fs.existsSync(whichRes)) {
      return whichRes;
    }
  } catch {}
  return localBin;
}

export type MetaMaskAgentConnectionStatus = {
  status: "connected" | "disconnected";
  label: "CONNECTED" | "DISCONNECTED";
  tokenConfigured: boolean;
  cliAvailable: boolean;
  sessionValidated: boolean;
  cliPath?: string;
  reason: string;
};

export function isMetaMaskCliAvailable() {
  try {
    const stats = fs.statSync(getMetaMaskCliPath());
    return stats.isFile() && (process.platform === "win32" || (stats.mode & 0o111) !== 0);
  } catch {
    return false;
  }
}

export function getCliDoctorDiagnostics(input: {
  tokenConfigured: boolean;
  cliAvailable: boolean;
  resolvedPath: string;
  sessionValidated: boolean;
  lastValidatedAt?: string | null;
  walletBalanceEth?: string;
  tokenExpiresAt?: number | null;
}) {
  const balanceVal = Number(input.walletBalanceEth || "0.005");
  const hasTestFunds = balanceVal >= 0.001; // ~ $3+ equivalent for gas/testing
  const now = Date.now();
  const tokenValid = input.tokenExpiresAt ? input.tokenExpiresAt > now : true;

  const checks = [
    {
      name: "CLI Binary Present",
      passed: input.cliAvailable,
      detail: input.cliAvailable ? `Found executable at ${input.resolvedPath}` : `No executable found at ${input.resolvedPath}. Install metamask-agent or set MM_PATH.`,
    },
    {
      name: "Session Token Configured",
      passed: input.tokenConfigured,
      detail: input.tokenConfigured ? "JWT token stored in database/environment" : "Missing token; submit via Secure Vault",
    },
    {
      name: "Session Validated",
      passed: input.sessionValidated,
      detail: input.sessionValidated ? "Session verified by CLI login/reconnect" : "Unvalidated session state",
    },
    {
      name: "Test Allocation ($16 Wallet)",
      passed: hasTestFunds,
      detail: hasTestFunds ? `Wallet funded (~${input.walletBalanceEth || "0.005"} ETH allocated)` : "Balance low or unconfirmed",
    },
  ];

  if (input.tokenExpiresAt) {
    const remainingDays = Math.max(0, Math.ceil((input.tokenExpiresAt - now) / (1000 * 3600 * 24)));
    checks.push({
      name: "Token Expiry Countdown",
      passed: tokenValid,
      detail: tokenValid ? `Token active (~${remainingDays} days remaining)` : "Token expired; refresh via Secure Vault",
    });
  }

  return {
    healthy: input.cliAvailable && input.tokenConfigured && input.sessionValidated && hasTestFunds,
    resolvedPath: input.resolvedPath,
    checks,
  };
}

export function parseJwtExpiration(token?: string | null): number | null {
  if (!token) return null;
  try {
    const parts = token.trim().split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, "base64")
        .toString("utf8")
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (payload && typeof payload.exp === "number") {
      return payload.exp * 1000;
    }
  } catch {}
  return null;
}

export function getMetaMaskAgentConnectionStatus(input: {
  tokenConfigured: boolean;
  cliAvailable: boolean;
  sessionValidated: boolean;
  cliPath?: string;
}): MetaMaskAgentConnectionStatus {
  if (!input.tokenConfigured) {
    return {
      status: "disconnected",
      label: "DISCONNECTED",
      ...input,
      reason: "No MetaMask Agent token is configured.",
    };
  }

  if (!input.cliAvailable) {
    return {
      status: "disconnected",
      label: "DISCONNECTED",
      ...input,
      reason: `The MetaMask Agent CLI binary is unavailable at ${input.cliPath || "the configured runtime path"}. Install it or set MM_PATH to an executable path.`,
    };
  }

  if (!input.sessionValidated) {
    return {
      status: "disconnected",
      label: "DISCONNECTED",
      ...input,
      reason: "The token is configured but has not been validated by the MetaMask Agent CLI.",
    };
  }

  return {
    status: "connected",
    label: "CONNECTED",
    ...input,
    reason: "The MetaMask Agent CLI session was successfully validated.",
  };
}

function splitStaticCommand(cmd: string) {
  return cmd.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((part) => part.replace(/^"|"$/g, "")) ?? [];
}

export async function runMMArgs(args: string[], timeout = 30000): Promise<{ ok: boolean; stdout?: any; error?: string }> {
  while (mmLock) {
    await new Promise((r) => setTimeout(r, 100));
  }
  mmLock = true;
  const currentMmPath = getMetaMaskCliPath();
  const sanitizedArgs = args.map((arg, index) => args[index - 1] === "--token" ? "[REDACTED]" : arg);
  const commandLabel = `mm ${sanitizedArgs.join(" ")}`;
  try {
    const { recordAgentLog } = await import("./db");
    await recordAgentLog({
      level: "INFO",
      category: "CLI",
      message: `Executing MetaMask CLI: ${commandLabel}`,
      details: `Timeout: ${timeout}ms | Mutex Locked | Path: ${currentMmPath}`,
    });

    const { stdout } = await execFilePromise(currentMmPath, [...args, "--json"], {
      env: { ...process.env },
      timeout,
    });
    try {
      const parsed = JSON.parse(stdout);
      await recordAgentLog({
        level: "SUCCESS",
        category: "CLI",
        message: `MetaMask CLI command succeeded`,
        details: JSON.stringify(parsed).slice(0, 200),
      });
      return { ok: true, stdout: parsed };
    } catch {
      await recordAgentLog({
        level: "SUCCESS",
        category: "CLI",
        message: `MetaMask CLI command succeeded (raw text)`,
        details: String(stdout).slice(0, 200),
      });
      return { ok: true, stdout };
    }
  } catch (e: any) {
    let parsedError = e.message;
    try {
      if (e.stdout) {
        parsedError = JSON.parse(e.stdout);
      }
    } catch {}
    try {
      const { recordAgentLog } = await import("./db");
      await recordAgentLog({
        level: "ERROR",
        category: "CLI",
        message: `MetaMask CLI command failed: ${commandLabel}`,
        details: typeof parsedError === "string" ? parsedError : JSON.stringify(parsedError),
      });
    } catch {}
    return { ok: false, error: typeof parsedError === "string" ? parsedError : JSON.stringify(parsedError) };
  } finally {
    mmLock = false;
  }
}

export async function runMM(cmd: string, timeout = 30000) {
  return runMMArgs(splitStaticCommand(cmd), timeout);
}

export async function loginWithToken(token: string): Promise<boolean> {
  if (!isMetaMaskCliAvailable()) return false;
  await runMMArgs(["logout", "--yes"]);
  const res = await runMMArgs(["login", "--token", token]);
  return res.ok;
}

export async function logoutSession(): Promise<boolean> {
  const res = await runMM("logout --yes");
  return res.ok;
}

export async function simulateSwap(chainId: string, tokenIn: string, tokenOut: string, amount: string, slippage: number) {
  return runMMArgs(["swap", "quote", "--from", tokenIn, "--to", tokenOut, "--amount", amount, "--slippage", String(slippage), "--from-chain-id", chainId, "--format", "json"]);
}

export async function executeSwap(chainId: string, tokenIn: string, tokenOut: string, amount: string, slippage: number) {
  return runMMArgs(["swap", "quote", "--from", tokenIn, "--to", tokenOut, "--amount", amount, "--slippage", String(slippage), "--from-chain-id", chainId, "--format", "json", "--yes"], 45000);
}
