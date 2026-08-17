import util from "util";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";

const execFilePromise = util.promisify(execFile);

let mmLock = false;
export function getMetaMaskCliPath() {
  return process.env.MM_PATH?.trim() || path.join(process.cwd(), "node_modules/.bin/mm");
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
