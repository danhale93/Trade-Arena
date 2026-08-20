#!/usr/bin/env node

/**
 * Trade Arena — RPC Health Check
 * Verifies connection to the specified RPC endpoint and validates the network.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { ethers } = require("ethers");
require("dotenv").config();

async function checkRPC() {
  const isCustomRPC = !!(process.env.ALCHEMY_MAINNET_URL || process.env.INFURA_MAINNET_URL || process.env.RPC_URL);
  const rpcUrl = process.env.ALCHEMY_MAINNET_URL ||
                 process.env.INFURA_MAINNET_URL ||
                 process.env.RPC_URL ||
                 "https://mainnet.base.org";

  console.log(`🔍 Checking RPC Connection to: ${rpcUrl.replace(/:[^@/]+@/, ':***@')}`); // Obfuscate credentials if present

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
      staticNetwork: true // Optimizes network validation and prevents extra chain ID calls
    });

    // Check connection by fetching block number and chain ID
    const [blockNumber, network] = await Promise.all([
      provider.getBlockNumber(),
      provider.getNetwork()
    ]);

    const chainId = network.chainId;
    console.log("✅ RPC Connection Successful!");
    console.log(`   - Block Number: ${blockNumber}`);
    console.log(`   - Chain ID: ${chainId} (Expected 8453 for Base Mainnet)`);
    console.log(`   - Network Name: ${network.name}`);

    if (chainId !== 8453n && chainId !== 8453) {
      console.warn("⚠️ Warning: The connected network is NOT Base Mainnet!");
    } else {
      console.log("✅ Verified: Connected to Base Mainnet!");
    }
  } catch (error) {
    console.error("❌ RPC Connection Failed!");
    console.error(`   Error details: ${error.message}`);

    if (!isCustomRPC) {
      console.warn("\n⚠️ Public RPC node call failed. Since no custom RPC secret was provided, we skip failing the CI to prevent external flakiness.");
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

checkRPC();

export { checkRPC };
