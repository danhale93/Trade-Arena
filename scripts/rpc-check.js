#!/usr/bin/env node

/**
 * Trade Arena — RPC Health Check
 * Verifies connection to the specified RPC endpoint and validates the network.
 */

const { ethers } = require("ethers");
require("dotenv").config();

/**
 * Sentinel: Mask sensitive parts of an RPC URL (like Alchemy/Infura API keys)
 */
function maskRpcUrl(url) {
  if (!url || typeof url !== 'string') return url;
  try {
    const u = new URL(url);
    if (u.pathname && u.pathname.length > 8) {
      u.pathname = u.pathname.substring(0, 4) + '****' + u.pathname.substring(u.pathname.length - 4);
    }
    if (u.username) u.username = '****';
    if (u.password) u.password = '****';
    return u.toString();
  } catch (e) {
    if (url.length > 20) {
      return url.substring(0, url.length - 12) + '********';
    }
    return '********';
  }
}

/**
 * Sentinel: Extract potential API key from URL pathname
 */
function getApiKeyFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && last.length > 12) {
      return last;
    }
  } catch (e) {}
  return null;
}

/**
 * Sentinel: Sanitize error messages to prevent leakage of credentials or keys
 */
function sanitizeError(error, rawUrl) {
  if (!error) return error;
  let message = typeof error === 'string' ? error : (error.message || '');
  if (rawUrl && typeof rawUrl === 'string' && rawUrl.length > 10) {
    const masked = maskRpcUrl(rawUrl);
    const escapedUrl = rawUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    message = message.replace(new RegExp(escapedUrl, 'g'), masked);

    const apiKey = getApiKeyFromUrl(rawUrl);
    if (apiKey && apiKey.length > 8) {
      const escapedKey = apiKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      message = message.replace(new RegExp(escapedKey, 'g'), '********');
    }
  }
  return message;
}

async function checkRPC() {
  const isCustomRPC = !!(process.env.ALCHEMY_MAINNET_URL || process.env.INFURA_MAINNET_URL || process.env.RPC_URL);
  const rpcUrl = process.env.ALCHEMY_MAINNET_URL ||
                 process.env.INFURA_MAINNET_URL ||
                 process.env.RPC_URL ||
                 "https://mainnet.base.org";

  console.log(`🔍 Checking RPC Connection to: ${maskRpcUrl(rpcUrl)}`);

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
    console.error(`   Error details: ${sanitizeError(error, rpcUrl)}`);

    if (!isCustomRPC) {
      console.warn("\n⚠️ Public RPC node call failed. Since no custom RPC secret was provided, we skip failing the CI to prevent external flakiness.");
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  checkRPC();
}

module.exports = { checkRPC };
