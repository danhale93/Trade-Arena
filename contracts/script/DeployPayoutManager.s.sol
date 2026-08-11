// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PayoutManager.sol";

contract DeployPayoutManager is Script {
    function run() external returns (PayoutManager) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address rewardToken = vm.envAddress("REWARD_TOKEN_ADDRESS");
        address oracleAddress = vm.envAddress("ORACLE_ADDRESS");
        address trustedForwarder = vm.envAddress("TRUSTED_FORWARDER");

        vm.startBroadcast(deployerKey);

        PayoutManager payoutManager = new PayoutManager(
            rewardToken,
            oracleAddress,
            trustedForwarder
        );

        vm.stopBroadcast();

        console.log("PayoutManager deployed at:", address(payoutManager));
        console.log("  rewardToken:      ", rewardToken);
        console.log("  oracleAddress:    ", oracleAddress);
        console.log("  trustedForwarder: ", trustedForwarder);
        console.log("");
        console.log("Set this in Render as PAYOUT_MANAGER_ADDRESS:");
        console.log(address(payoutManager));

        return payoutManager;
    }
}
