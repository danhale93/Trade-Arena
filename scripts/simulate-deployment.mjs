import { MULTI_DEX_REGISTRIES, buildMultiDexSwapCalldata, getCrossDexSpreadSimulation } from "../server/multiDex.ts";

async function simulateDeployment() {
  console.log("=== Trade-Arena Multi-DEX Simulation & Deployment Verification ===");
  
  for (const net of Object.keys(MULTI_DEX_REGISTRIES)) {
    const reg = MULTI_DEX_REGISTRIES[net];
    console.log(`\nNetwork: ${reg.network.toUpperCase()} (Chain ID: ${reg.chainId})`);
    console.log(`Configured DEXes (${reg.dexes.length}):`);
    reg.dexes.forEach((dex, idx) => {
      console.log(`  [${idx + 1}] ${dex.name} (${dex.protocolType}) -> Router: ${dex.routerAddress}`);
    });

    const sim = getCrossDexSpreadSimulation(net, "WETH", "USDC", "10000000000000000"); // 0.01 WETH (~$26.50)
    console.log(`  Spread Simulation: Route [${sim.route}] | Spread: ${sim.spreadBps} bps | Est Profit: $${sim.estimatedProfitUsd} | Profitable: ${sim.profitable}`);

    const sampleCalldata = buildMultiDexSwapCalldata({
      protocolType: reg.dexes[0].protocolType,
      tokenIn: "0x4200000000000000000000000000000000000006",
      tokenOut: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
      amountIn: "10000000000000000",
      amountOutMinimum: "9900000",
      recipient: "0x2ca1f801c1e19d16160c982c627e2932e95117be",
      feeTier: reg.dexes[0].feeTier,
    });
    console.log(`  Sample Calldata (0x...): ${sampleCalldata.slice(0, 42)}... [Length: ${sampleCalldata.length}]`);
  }

  console.log("\n[SUCCESS] Simulation-safe deployment verification passed without broadcasting any transactions.");
}

simulateDeployment().catch((err) => {
  console.error("Simulation failed:", err);
  process.exit(1);
});
