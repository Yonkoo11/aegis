// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Test.sol";
import "../src/SecurityOracle.sol";

contract SecurityOracleTest is Test {
    SecurityOracle public oracle;

    address owner = address(this);
    address agent = makeAddr("agent");
    address user = makeAddr("user");
    address target; // will be a contract address

    function setUp() public {
        oracle = new SecurityOracle(agent);

        // Deploy a dummy contract to use as target
        target = address(new DummyContract());
    }

    // ==================== Constructor ====================

    function test_constructor() public view {
        assertEq(oracle.owner(), owner);
        assertEq(oracle.agent(), agent);
        assertEq(oracle.totalAudits(), 0);
    }

    function test_constructor_revert_zeroAgent() public {
        vm.expectRevert(SecurityOracle.ZeroAddress.selector);
        new SecurityOracle(address(0));
    }

    // ==================== requestAudit ====================

    function test_requestAudit_emitsEvent() public {
        vm.prank(user);
        vm.expectEmit(true, true, false, false);
        emit SecurityOracle.AuditRequested(target, user);
        oracle.requestAudit(target);
    }

    function test_requestAudit_revert_zeroAddress() public {
        vm.expectRevert(SecurityOracle.ZeroAddress.selector);
        oracle.requestAudit(address(0));
    }

    function test_requestAudit_revert_notContract() public {
        vm.expectRevert(SecurityOracle.NotAContract.selector);
        oracle.requestAudit(makeAddr("eoa"));
    }

    function test_requestAudit_allowsReaudit() public {
        // Submit initial report
        vm.prank(agent);
        oracle.submitReport(target, 50, "QmFirst", 5, 1, 1, 2, 1, true);

        // Should still allow requesting audit again
        vm.prank(user);
        vm.expectEmit(true, true, false, false);
        emit SecurityOracle.AuditRequested(target, user);
        oracle.requestAudit(target);
    }

    // ==================== submitReport ====================

    function test_submitReport_basic() public {
        vm.prank(agent);
        oracle.submitReport(target, 42, "QmTestHash123", 10, 1, 2, 3, 4, true);

        assertTrue(oracle.audited(target));
        assertEq(oracle.totalAudits(), 1);

        (
            uint8 score, string memory ipfs, uint256 ts,
            uint16 total, uint8 crit, uint8 high, uint8 med, uint8 low,
            bool verified
        ) = oracle.getReport(target);

        assertEq(score, 42);
        assertEq(ipfs, "QmTestHash123");
        assertEq(ts, block.timestamp);
        assertEq(total, 10);
        assertEq(crit, 1);
        assertEq(high, 2);
        assertEq(med, 3);
        assertEq(low, 4);
        assertTrue(verified);
    }

    function test_submitReport_emitsEvent() public {
        vm.prank(agent);
        vm.expectEmit(true, false, false, true);
        emit SecurityOracle.ReportSubmitted(target, 42, "QmHash");
        oracle.submitReport(target, 42, "QmHash", 5, 1, 1, 2, 1, true);
    }

    function test_submitReport_revert_notAgent() public {
        vm.prank(user);
        vm.expectRevert(SecurityOracle.OnlyAgent.selector);
        oracle.submitReport(target, 50, "QmHash", 5, 1, 1, 2, 1, true);
    }

    function test_submitReport_revert_scoreOver100() public {
        vm.prank(agent);
        vm.expectRevert(SecurityOracle.ScoreOutOfRange.selector);
        oracle.submitReport(target, 101, "QmHash", 5, 1, 1, 2, 1, true);
    }

    function test_submitReport_score100_succeeds() public {
        vm.prank(agent);
        oracle.submitReport(target, 100, "QmHash", 5, 1, 1, 2, 1, true);
        assertEq(oracle.getScore(target), 100);
    }

    function test_submitReport_score0_succeeds() public {
        vm.prank(agent);
        oracle.submitReport(target, 0, "QmClean", 0, 0, 0, 0, 0, true);
        assertEq(oracle.getScore(target), 0);
    }

    function test_submitReport_overwritesPrevious() public {
        vm.startPrank(agent);
        oracle.submitReport(target, 80, "QmOld", 10, 2, 3, 3, 2, true);
        oracle.submitReport(target, 20, "QmNew", 2, 0, 0, 1, 1, true);
        vm.stopPrank();

        // Should have new data, not old
        assertEq(oracle.getScore(target), 20);
        // totalAudits should NOT double-count
        assertEq(oracle.totalAudits(), 1);
        assertEq(oracle.getAuditedCount(), 1);
    }

    function test_submitReport_multipleContracts() public {
        address target2 = address(new DummyContract());
        address target3 = address(new DummyContract());

        vm.startPrank(agent);
        oracle.submitReport(target, 10, "Qm1", 1, 0, 0, 0, 1, true);
        oracle.submitReport(target2, 50, "Qm2", 5, 0, 2, 2, 1, true);
        oracle.submitReport(target3, 90, "Qm3", 8, 3, 2, 2, 1, false);
        vm.stopPrank();

        assertEq(oracle.totalAudits(), 3);
        assertEq(oracle.getScore(target), 10);
        assertEq(oracle.getScore(target2), 50);
        assertEq(oracle.getScore(target3), 90);
    }

    // ==================== getScore ====================

    function test_getScore_revert_notAudited() public {
        vm.expectRevert(SecurityOracle.NotAudited.selector);
        oracle.getScore(makeAddr("random"));
    }

    // ==================== getScores (batch) ====================

    function test_getScores_batch() public {
        address target2 = address(new DummyContract());
        address unaudited = address(new DummyContract());

        vm.startPrank(agent);
        oracle.submitReport(target, 25, "Qm1", 3, 0, 1, 1, 1, true);
        oracle.submitReport(target2, 75, "Qm2", 7, 2, 2, 2, 1, false);
        vm.stopPrank();

        address[] memory targets = new address[](3);
        targets[0] = target;
        targets[1] = target2;
        targets[2] = unaudited;

        uint8[] memory scores = oracle.getScores(targets);

        assertEq(scores[0], 25);
        assertEq(scores[1], 75);
        assertEq(scores[2], type(uint8).max); // 255 = not audited
    }

    function test_getScores_empty() public view {
        address[] memory targets = new address[](0);
        uint8[] memory scores = oracle.getScores(targets);
        assertEq(scores.length, 0);
    }

    // ==================== getAuditedContracts (pagination) ====================

    function test_getAuditedContracts_pagination() public {
        address[] memory targets = new address[](5);
        for (uint256 i = 0; i < 5; i++) {
            targets[i] = address(new DummyContract());
            vm.prank(agent);
            oracle.submitReport(targets[i], uint8(i * 20), "Qm", 1, 0, 0, 0, 1, true);
        }

        // Get first 2
        address[] memory page1 = oracle.getAuditedContracts(0, 2);
        assertEq(page1.length, 2);
        assertEq(page1[0], targets[0]);
        assertEq(page1[1], targets[1]);

        // Get next 2
        address[] memory page2 = oracle.getAuditedContracts(2, 2);
        assertEq(page2.length, 2);
        assertEq(page2[0], targets[2]);
        assertEq(page2[1], targets[3]);

        // Get last 1 (limit exceeds remaining)
        address[] memory page3 = oracle.getAuditedContracts(4, 10);
        assertEq(page3.length, 1);
        assertEq(page3[0], targets[4]);
    }

    function test_getAuditedContracts_offsetBeyondLength() public view {
        address[] memory result = oracle.getAuditedContracts(100, 10);
        assertEq(result.length, 0);
    }

    // ==================== getReport ====================

    function test_getReport_revert_notAudited() public {
        vm.expectRevert(SecurityOracle.NotAudited.selector);
        oracle.getReport(makeAddr("random"));
    }

    // ==================== setAgent ====================

    function test_setAgent() public {
        address newAgent = makeAddr("newAgent");

        vm.expectEmit(true, true, false, false);
        emit SecurityOracle.AgentUpdated(agent, newAgent);
        oracle.setAgent(newAgent);

        assertEq(oracle.agent(), newAgent);
    }

    function test_setAgent_revert_notOwner() public {
        vm.prank(user);
        vm.expectRevert(SecurityOracle.OnlyOwner.selector);
        oracle.setAgent(makeAddr("newAgent"));
    }

    function test_setAgent_revert_zeroAddress() public {
        vm.expectRevert(SecurityOracle.ZeroAddress.selector);
        oracle.setAgent(address(0));
    }

    // ==================== transferOwnership ====================

    function test_transferOwnership() public {
        address newOwner = makeAddr("newOwner");
        oracle.transferOwnership(newOwner);
        assertEq(oracle.owner(), newOwner);

        // Old owner can no longer call
        vm.expectRevert(SecurityOracle.OnlyOwner.selector);
        oracle.setAgent(makeAddr("x"));
    }

    function test_transferOwnership_revert_notOwner() public {
        vm.prank(user);
        vm.expectRevert(SecurityOracle.OnlyOwner.selector);
        oracle.transferOwnership(user);
    }

    function test_transferOwnership_revert_zeroAddress() public {
        vm.expectRevert(SecurityOracle.ZeroAddress.selector);
        oracle.transferOwnership(address(0));
    }

    // ==================== Gas benchmarks ====================

    function test_gas_submitReport() public {
        vm.prank(agent);
        oracle.submitReport(target, 50, "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG", 10, 2, 3, 3, 2, true);
        // Gas cost logged by forge --gas-report
    }

    function test_gas_getScore() public {
        vm.prank(agent);
        oracle.submitReport(target, 50, "QmHash", 5, 1, 1, 2, 1, true);
        oracle.getScore(target);
    }
}

/// @dev Minimal contract to serve as audit target in tests.
contract DummyContract {
    uint256 public value;

    function set(uint256 _value) external {
        value = _value;
    }
}
