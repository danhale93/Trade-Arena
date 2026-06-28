// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PayoutManager.sol";
import "../src/FlashloanArbitrage.sol";
import "../src/MockUSDC.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PAYOUT_PRIVATE_KEY");
        address oracleAddress = vm.envAddress("ORACLE_ADDRESS");
        address trustedForwarder = vm.envAddress("BICONOMY_TRUSTED_FORWARDER");
        address aaveAddressProvider = vm.envAddress("AAVE_POOL_ADDRESS_PROVIDER");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Mock USDC (for testing) or use real USDC address
        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC deployed to:", address(usdc));

        // 2. Deploy PayoutManager
        PayoutManager payoutManager = new PayoutManager(
            address(usdc),
            oracleAddress,
            trustedForwarder
        );
        console.log("PayoutManager deployed to:", address(payoutManager));

        // 3. Deploy FlashloanArbitrage
        FlashloanArbitrage arbitrage = new FlashloanArbitrage(aaveAddressProvider);
        console.log("FlashloanArbitrage deployed to:", address(arbitrage));

        // 4. Initial Funding
        usdc.mint(address(payoutManager), 10000 * 10**18);
        console.log("PayoutManager funded with 10,000 Mock USDC");

        vm.stopBroadcast();
    }
}
