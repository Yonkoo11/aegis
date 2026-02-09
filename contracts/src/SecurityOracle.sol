// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title SecurityOracle - Decentralized AI Security Oracle for BNB Chain
/// @notice Stores AI-generated security audit reports onchain, queryable by any dApp.
/// @dev Reports are submitted by an authorized AI agent. Full reports live on IPFS;
///      onchain stores score + metadata for cheap queryability.
contract SecurityOracle {
    struct Report {
        uint8 riskScore;        // 0-100 (0 = safe, 100 = critical)
        string ipfsHash;        // IPFS CID of full report
        uint256 timestamp;      // Block timestamp of submission
        uint16 findingsCount;   // Total findings
        uint8 criticalCount;
        uint8 highCount;
        uint8 mediumCount;
        uint8 lowCount;
        bool sourceVerified;    // Whether source is verified on BSCScan
    }

    address public agent;
    address public owner;

    mapping(address => Report) public reports;
    mapping(address => bool) public audited;
    address[] public auditedContracts;

    uint256 public totalAudits;

    event AuditRequested(address indexed target, address indexed requester);
    event ReportSubmitted(address indexed target, uint8 riskScore, string ipfsHash);
    event AgentUpdated(address indexed oldAgent, address indexed newAgent);

    error OnlyAgent();
    error OnlyOwner();
    error ZeroAddress();
    error NotAContract();
    error ScoreOutOfRange();
    error NotAudited();

    modifier onlyAgent() {
        if (msg.sender != agent) revert OnlyAgent();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor(address _agent) {
        if (_agent == address(0)) revert ZeroAddress();
        owner = msg.sender;
        agent = _agent;
    }

    /// @notice Request an AI security audit for any contract on BSC.
    /// @param target The contract address to audit.
    function requestAudit(address target) external {
        if (target == address(0)) revert ZeroAddress();
        if (target.code.length == 0) revert NotAContract();
        emit AuditRequested(target, msg.sender);
    }

    /// @notice Submit an audit report. Only callable by the registered AI agent.
    function submitReport(
        address target,
        uint8 riskScore,
        string calldata ipfsHash,
        uint16 findingsCount,
        uint8 criticalCount,
        uint8 highCount,
        uint8 mediumCount,
        uint8 lowCount,
        bool sourceVerified
    ) external onlyAgent {
        if (riskScore > 100) revert ScoreOutOfRange();

        reports[target] = Report({
            riskScore: riskScore,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            findingsCount: findingsCount,
            criticalCount: criticalCount,
            highCount: highCount,
            mediumCount: mediumCount,
            lowCount: lowCount,
            sourceVerified: sourceVerified
        });

        if (!audited[target]) {
            audited[target] = true;
            auditedContracts.push(target);
            totalAudits++;
        }

        emit ReportSubmitted(target, riskScore, ipfsHash);
    }

    /// @notice Get the risk score for an audited contract.
    function getScore(address target) external view returns (uint8) {
        if (!audited[target]) revert NotAudited();
        return reports[target].riskScore;
    }

    /// @notice Batch query scores. Returns 255 for unaudited addresses (no revert).
    function getScores(address[] calldata targets) external view returns (uint8[] memory scores) {
        scores = new uint8[](targets.length);
        for (uint256 i = 0; i < targets.length; i++) {
            scores[i] = audited[targets[i]] ? reports[targets[i]].riskScore : type(uint8).max;
        }
    }

    /// @notice Check if a contract has been audited.
    function isAudited(address target) external view returns (bool) {
        return audited[target];
    }

    /// @notice Get the full report for an audited contract.
    function getReport(address target)
        external
        view
        returns (
            uint8 riskScore,
            string memory ipfsHash,
            uint256 timestamp,
            uint16 findingsCount,
            uint8 criticalCount,
            uint8 highCount,
            uint8 mediumCount,
            uint8 lowCount,
            bool sourceVerified
        )
    {
        if (!audited[target]) revert NotAudited();
        Report storage r = reports[target];
        return (
            r.riskScore,
            r.ipfsHash,
            r.timestamp,
            r.findingsCount,
            r.criticalCount,
            r.highCount,
            r.mediumCount,
            r.lowCount,
            r.sourceVerified
        );
    }

    /// @notice Paginated access to audited contracts list.
    function getAuditedContracts(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory result)
    {
        uint256 len = auditedContracts.length;
        if (offset >= len) return new address[](0);
        uint256 end = offset + limit > len ? len : offset + limit;
        result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = auditedContracts[i];
        }
    }

    /// @notice Total number of unique audited contracts.
    function getAuditedCount() external view returns (uint256) {
        return auditedContracts.length;
    }

    /// @notice Update the AI agent address. Only callable by owner.
    function setAgent(address _agent) external onlyOwner {
        if (_agent == address(0)) revert ZeroAddress();
        emit AgentUpdated(agent, _agent);
        agent = _agent;
    }

    /// @notice Transfer ownership. Only callable by owner.
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        owner = newOwner;
    }
}
