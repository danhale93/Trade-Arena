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
  try {
    const fullCmd = `${mmPath} ${cmd} --json`;
    const { stdout } = await execPromise(fullCmd, {
      env: { ...process.env },
      timeout,
    });
    try {
      const parsed = JSON.parse(stdout);
      return { ok: true, stdout: parsed };
    } catch {
      return { ok: true, stdout };
    }
  } catch (e: any) {
    let parsedError = e.message;
    try {
      if (e.stdout) {
        parsedError = JSON.parse(e.stdout);
      }
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
