import { execSync } from "child_process";

function runHelper() {
  console.log("=== Trade-Arena MetaMask Agent CLI Authentication Helper ===");
  console.log("Managed Wallet Target: 0x2ca1f801c1e19d16160c982c627e2932e95117be\n");

  console.log("[1] Checking local MetaMask CLI installation...");
  try {
    const version = execSync("mm --version", { encoding: "utf8" }).trim();
    console.log(`[OK] Found local MetaMask CLI: ${version}`);

    console.log("\n[2] Running 'mm doctor'...");
    try {
      const doctorOutput = execSync("mm doctor --json", { encoding: "utf8" });
      const doctorJson = JSON.parse(doctorOutput);
      console.log(`[OK] Authenticated: ${doctorJson.authenticated} | Initialized: ${doctorJson.initialized}`);
    } catch (e) {
      console.log("[!] 'mm doctor' could not verify session (not logged in or uninitialized).");
    }

    console.log("\n[3] Requesting non-interactive browser login URL (supporting passkey / OAuth):");
    try {
      const loginOutput = execSync("mm login browser --no-wait", { encoding: "utf8" });
      console.log(loginOutput);
    } catch (e) {
      console.log("[!] Run manually: mm login browser --no-wait");
    }
  } catch {
    console.log("[!] 'mm' CLI not found in global PATH. Please install it locally with:");
    console.log("    npm install -g @metamask/agent-wallet@latest");
  }

  console.log("\nStep 4: Authorize in your browser, copy your CLI token, and submit it via:");
  console.log("    Trade-Arena Dashboard -> Settings -> Secure Vault -> Save & Renew\n");
}

runHelper();
