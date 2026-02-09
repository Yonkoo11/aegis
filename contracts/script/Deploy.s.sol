// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/SecurityOracle.sol";

contract DeploySecurityOracle is Script {
    function run() external {
        address agentAddress = vm.envAddress("AGENT_ADDRESS");

        vm.startBroadcast();
        SecurityOracle oracle = new SecurityOracle(agentAddress);
        vm.stopBroadcast();

        console.log("SecurityOracle deployed at:", address(oracle));
        console.log("Agent:", agentAddress);
        console.log("Owner:", oracle.owner());
    }
}
