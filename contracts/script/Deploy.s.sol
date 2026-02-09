// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/SecurityOracle.sol";

contract DeploySecurityOracle is Script {
    function run() external {
        address agentAddress = vm.envAddress("AGENT_ADDRESS");
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerKey);
        SecurityOracle oracle = new SecurityOracle(agentAddress);
        vm.stopBroadcast();

        console.log("=== Aegis SecurityOracle Deployed ===");
        console.log("Contract:", address(oracle));
        console.log("Agent:   ", agentAddress);
        console.log("Owner:   ", oracle.owner());
        console.log("Chain ID:", block.chainid);
    }
}
