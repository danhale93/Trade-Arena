#!/usr/bin/env node

/**
 * Trade Arena — Mainnet Fork/Live Integration Test
 * Runs read queries and simulates execution against active Base Mainnet contracts (WETH, USDC).
 * Skip execution if ALCHEMY_MAINNET_URL or INFURA_MAINNET_URL is not present.
 */

import { fileURLToPath } from "url";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

// Simple ERC20 ABI
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)"
];

export async function runForkTest() {
  const rpcUrl = process.env.ALCHEMY_MAINNET_URL || process.env.INFURA_MAINNET_URL;

  if (!rpcUrl) {
    console.log("⚠️ Skipped: Mainnet-fork integration tests skipped because ALCHEMY_MAINNET_URL/INFURA_MAINNET_URL is not set.");
    process.exit(0);
  }

  console.log("🧪 Starting Mainnet-Fork/Live Integration Test...");

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // 1. Verify WETH Contract on Base Mainnet
    console.log(`Checking WETH contract at ${WETH_ADDRESS}...`);
    const wethContract = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, provider);

    const [wethName, wethSymbol, wethDecimals, wethTotalSupply] = await Promise.all([
      wethContract.name(),
      wethContract.symbol(),
      wethContract.decimals(),
      wethContract.totalSupply()
    ]);

    console.log(`   - Name: ${wethName}`);
    console.log(`   - Symbol: ${wethSymbol}`);
    console.log(`   - Decimals: ${wethDecimals}`);
    console.log(`   - Total Supply: ${ethers.formatEther(wethTotalSupply)} WETH`);

    if (wethSymbol !== "WETH") {
      throw new Error(`Symbol mismatch: expected WETH, got ${wethSymbol}`);
    }

    // 2. Verify USDC Contract on Base Mainnet
    console.log(`Checking USDC contract at ${USDC_ADDRESS}...`);
    const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);

    const [usdcName, usdcSymbol, usdcDecimals] = await Promise.all([
      usdcContract.name(),
      usdcContract.symbol(),
      usdcContract.decimals()
    ]);

    console.log(`   - Name: ${usdcName}`);
    console.log(`   - Symbol: ${usdcSymbol}`);
    console.log(`   - Decimals: ${usdcDecimals}`);

    if (usdcSymbol !== "USDC") {
      throw new Error(`Symbol mismatch: expected USDC, got ${usdcSymbol}`);
    }

    // 3. Simulate an eth_call transaction (e.g. balance of random address)
    console.log("Simulating dynamic eth_call/balance check...");
    const randomAddress = "0x9F407b7f793555c35c33aC64bd6901759470736D";
    const balance = await usdcContract.balanceOf(randomAddress);
    console.log(`   - Balance of ${randomAddress}: ${ethers.formatUnits(balance, usdcDecimals)} USDC`);

    console.log("✅ Mainnet-Fork/Live Integration Test completed successfully!");
  } catch (error) {
    console.error("❌ Mainnet-Fork/Live Integration Test failed!");
    console.error(`   Error details: ${error.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runForkTest();
}
