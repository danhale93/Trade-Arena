import { exec } from "child_process";
import util from "util";
import path from "path";

const execPromise = util.promisify(exec);

let mmLock = false;
const mmPath = process.env.MM_PATH || path.join(process.cwd(), "node_modules/.bin/mm");

export async function runMM(cmd: string, timeout = 30000): Promise<{ ok: boolean; stdout?: any; error?: string }> {
  while (mmLock) {
    await new Promise((r) => setTimeout(r, 100));
  }
  mmLock = true;
  const sanitizedCmd = cmd.replace(/--token\s+\S+/g, '--token [REDACTED]');
  try {
    const { recordAgentLog } = await import("./db");
    await recordAgentLog({
      level: "INFO",
      category: "CLI",
      message: `Executing MetaMask CLI: mm ${sanitizedCmd}`,
      details: `Timeout: ${timeout}ms | Mutex Locked`,
    });

    const fullCmd = `${mmPath} ${cmd} --json`;
    const { stdout } = await execPromise(fullCmd, {
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
        message: `MetaMask CLI command failed: mm ${sanitizedCmd}`,
        details: typeof parsedError === 'string' ? parsedError : JSON.stringify(parsedError),
      });
    } catch {}
    return { ok: false, error: parsedError };
  } finally {
    mmLock = false;
  }
}

export async function loginWithToken(token: string): Promise<boolean> {
  await runMM("logout --yes");
  const res = await runMM(`login --token "${token}"`);
  return res.ok;
}

export async function simulateSwap(chainId: string, tokenIn: string, tokenOut: string, amount: string, slippage: number) {
  const cmd = `swap quote --from ${tokenIn} --to ${tokenOut} --amount ${amount} --slippage ${slippage} --from-chain-id ${chainId} --format json`;
  const res = await runMM(cmd);
  return res;
}

export async function executeSwap(chainId: string, tokenIn: string, tokenOut: string, amount: string, slippage: number) {
  const cmd = `swap quote --from ${tokenIn} --to ${tokenOut} --amount ${amount} --slippage ${slippage} --from-chain-id ${chainId} --yes --format json`;
  const res = await runMM(cmd, 45000);
  return res;
}
