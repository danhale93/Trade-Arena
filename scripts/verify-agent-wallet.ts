import { getCliDoctorStatus, getWalletAddress, getWalletBalance, simulateSwap, isMetaMaskCliAvailable, getMetaMaskCliPath } from "../server/cli";

async function verifyAgentWallet() {
  console.log("=== MetaMask Agent Wallet Verification Script ===");
  console.log(`CLI Path: ${getMetaMaskCliPath()}`);
  console.log(`CLI Available: ${isMetaMaskCliAvailable()}`);

  console.log("\n1. Running mm doctor...");
  const doctorRes = await getCliDoctorStatus();
  console.log("Doctor Result:", JSON.stringify(doctorRes, null, 2));

  console.log("\n2. Checking wallet address...");
  const addrRes = await getWalletAddress();
  console.log("Address Result:", JSON.stringify(addrRes, null, 2));

  console.log("\n3. Checking Base balance (Chain ID 8453)...");
  const balRes = await getWalletBalance("8453");
  console.log("Balance Result:", JSON.stringify(balRes, null, 2));

  console.log("\n4. Running dry-run swap quote (WETH -> USDC on Base)...");
  const wethBase = "0x4200000000000000000000000000000000000006";
  const usdcBase = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const quoteRes = await simulateSwap("8453", wethBase, usdcBase, "0.001", 0.5);
  console.log("Quote Result:", JSON.stringify(quoteRes, null, 2));

  console.log("\nVerification complete. No transactions were broadcasted.");
}

verifyAgentWallet().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
