# AEGIS - Decentralized AI Security Oracle for BNB Chain

## Product Requirements Document

**Hackathon:** Good Vibes Only: OpenClaw Edition
**Prize Pool:** $100,000 (10 winners)
**Deadline:** February 19, 2026 15:00 UTC
**Submission:** DoraHacks
**Track:** AI Agents (primary) + DeFi Tools (secondary)

---

## 1. Vision

**One sentence:** The first permissionless, AI-powered smart contract security oracle on BNB Chain - anyone pastes a contract address, gets an instant AI security audit, results stored onchain for any dApp to query.

**North star metric:** Number of contracts scanned and queryable onchain.

**Why this wins:**
- Solves the #1 trust problem on BSC (rug pulls, exploits, unaudited contracts)
- Built by an actual smart contract auditor, not a ChatGPT wrapper
- Infrastructure play (oracle), not just a tool - judges see ecosystem value
- Viral loop: "Is your contract safe? Check now" drives community votes
- AI Build Log is authentic - entire project vibe-coded with Claude

---

## 2. Problem Statement

BNB Chain has $5B+ TVL across thousands of DeFi protocols. Most contracts are unaudited. Users have no way to verify safety before interacting.

**Current landscape:**
| Tool | What it does | What it doesn't do |
|------|-------------|-------------------|
| **GoPlus** | Token metadata checks (honeypot, tax) | No source code analysis. Rule-based, not AI |
| **CertiK** | Manual + AI audits | $50K-$200K per audit. Centralized. Weeks-long |
| **Slither/Mythril** | Static analysis CLI tools | No onchain presence. Developer-only. No scoring |
| **De.Fi Scanner** | Basic contract checks | Surface-level, no vulnerability detection |

**The gap:** There is no free, permissionless, AI-powered security scoring system that lives onchain and can be queried by other dApps.

Aegis fills this gap.

---

## 3. Target Users

| User | Need | How Aegis helps |
|------|------|----------------|
| **DeFi users** | "Is this contract safe before I deposit?" | Paste address, get instant risk score |
| **Developers** | "Show my contract is secure" | Get an Aegis attestation, display badge |
| **dApp integrators** | "Should we list this token/pool?" | Query `getScore(address)` onchain |
| **Security researchers** | "What's the BSC threat landscape?" | Browse the full audit registry |

---

## 4. Core Features (MVP - ships in 10 days)

### 4.1 Smart Contract: SecurityOracle.sol

Deployed on **BSC mainnet** (where DeFi dApps live and can query it).

```
requestAudit(address target) → emits AuditRequested event
submitReport(address target, uint8 score, string ipfsHash) → stores result onchain
getScore(address target) → returns risk score (0-100)
getReport(address target) → returns full report metadata
isAudited(address target) → returns bool
```

**Design decisions:**
- **BSC mainnet, not opBNB** - other dApps need to query it on the same chain. BSC gas is cheap enough (~$0.01 per report)
- **Risk score 0-100** - 0 = verified safe, 100 = critical risk. Simple, queryable, universally understood
- **IPFS for full reports** - onchain stores score + hash, full report on IPFS for cost efficiency
- **Agent-gated submission** - only the registered AI agent address can submit reports (prevents fake scores)
- **Dual scan triggers** - onchain via `requestAudit()` event OR offchain via agent API `POST /scan`. API is primary for UX speed; onchain is for decentralization story + dApp integrations
- **Re-audits supported** - `submitReport` overwrites previous report. Agent tracks `timestamp` to avoid redundant re-scans within 24h. Users see "last scanned" date and can request fresh scan
- **Batch + pagination** - `getScores()` for multi-address lookups, `getAuditedContracts(offset, limit)` for explorer enumeration
- **reports.json cache** - agent maintains a JSON index of all reports for fast frontend loading (no subgraph needed)

### 4.2 AI Analysis Engine (offchain agent)

The core differentiator. Not a ChatGPT wrapper - a structured multi-stage analysis pipeline.

**Stage 1: Source Acquisition**
- BSCScan API `getsourcecode` endpoint to fetch verified Solidity source
- Handle both response formats:
  - Flattened source (single string) - analyze directly
  - JSON standard input (multiple files) - parse into individual files, identify main contract vs libraries
- If not verified: flag as high risk (unverified = red flag), do metadata-only analysis (bytecode size, creation tx, interaction patterns)
- Parse contract metadata: compiler version, optimization, license
- For large contracts (>500 lines): chunk by file, skip standard libraries (OpenZeppelin, etc.), focus on custom logic

**Stage 2: Static Pattern Analysis (fast, deterministic)**
- Reentrancy patterns (external calls before state updates)
- Access control gaps (missing onlyOwner, public privileged functions)
- Integer overflow/underflow (pre-0.8.0 without SafeMath)
- Unchecked return values (low-level calls)
- Delegatecall risks (proxy patterns)
- Selfdestruct presence
- tx.origin usage
- Hardcoded addresses
- Missing zero-address checks
- Token approval issues (infinite approvals)

**Stage 3: AI Deep Analysis (contextual, LLM-powered)**
- Claude API with structured prompts for:
  - Business logic vulnerabilities (protocol-specific)
  - Economic attack vectors (flash loans, oracle manipulation, sandwich attacks)
  - Centralization risks (admin keys, upgradeability, pause mechanisms)
  - Token flow analysis (where does money go? who can drain it?)
  - Dependency risk (external contract calls, oracle reliance)
- Cross-reference against known exploit patterns database

**Stage 4: Scoring & Report Generation**
- Aggregate findings into risk score (0-100)
- Severity classification: Critical / High / Medium / Low / Info
- Generate structured report with:
  - Executive summary
  - Risk score breakdown
  - Individual findings with code references
  - Remediation suggestions
- Upload to IPFS, submit score + hash onchain

**Scoring formula (proportional with diminishing returns):**
```
critical_score = min(40, critical_count * 20)       // 1→20, 2→40, cap 40
high_score     = min(25, high_count * 10)            // 1→10, 2→20, 3→25
medium_score   = min(15, medium_count * 5)           // 1→5, 2→10, 3→15
unverified     = 10 if source not verified on BSCScan
centralization = min(10, centralization_factors * 3)  // see below

score = min(100, critical_score + high_score + medium_score + unverified + centralization)
```

**Centralization factors** (each counts as 1):
- Upgradeable proxy pattern (admin can swap implementation)
- Owner-only privileged functions (pause, mint, burn, setFee, etc.)
- Pause mechanism (owner can freeze all operations)
- Mint capability (owner can inflate supply)
- Fee extraction (owner can drain fees/set arbitrary fees)
- Single EOA owner (no multisig/timelock)

Example: proxy + pause + single EOA = 3 factors * 3 = 9 centralization points.

**Thresholds:**
- 0-20 = Low Risk (green) - well-written, no significant issues
- 21-50 = Medium Risk (yellow) - some concerns, use with caution
- 51-75 = High Risk (orange) - significant vulnerabilities or centralization
- 76-100 = Critical Risk (red) - do not interact

### 4.3 Frontend Dashboard

React + Vite + TailwindCSS. Deployed on GitHub Pages (static). Talks to agent API for live scans.

**Scan UX flow (critical for demo):**
```
User pastes address
    ↓
Frontend checks: is this address in reports.json cache?
    ├── YES → show cached report instantly
    └── NO  → POST to agent API /scan { address }
              → show "Scanning... AI agent is analyzing" with progress
              → agent processes (1-3 min): fetch source → analyze → IPFS → onchain
              → agent updates reports.json
              → frontend polls /status/{address} every 5s
              → result arrives → render report
```

**Why this matters:** If a judge pastes an unknown address and sees nothing for 3 minutes, we lose. The progress state + time estimate ("~2 min") keeps them engaged. Pre-scanning 50-100 popular contracts ensures most lookups are instant.

**Pages:**

1. **Home / Scanner**
   - Hero: large search bar "Paste any BSC contract address"
   - No wallet connection required to view reports or request scans (agent API handles it)
   - Instant results if pre-scanned; progress indicator for new scans
   - Above the fold: total contracts scanned, average score, threats found

2. **Report View** `/report/{address}`
   - Large risk score gauge (0-100) with color coding
   - Severity breakdown (critical/high/medium/low)
   - Individual findings with expandable details
   - Code snippets with highlighted vulnerable lines
   - Onchain proof link (BSCScan tx hash)
   - IPFS report link
   - Share button (generates X post with score)

3. **Explorer** `/explore`
   - Browse all scanned contracts
   - Filter by score range, date, category
   - Sort by risk score, newest, most viewed
   - Search by address or contract name
   - "Riskiest contracts" and "Safest contracts" leaderboards

4. **Stats** `/stats`
   - Total scans completed
   - Score distribution histogram
   - Most common vulnerability types
   - BSC security health over time
   - Real-time scan feed

5. **For Developers** `/integrate`
   - How to query the oracle from your smart contract
   - Code snippets for integration
   - Badge embed code ("Audited by Aegis")

### 4.4 AI Build Log

Dedicated page `/build-log` documenting every AI interaction during development:
- Contract generation prompts and iterations
- Test generation with AI
- Frontend component creation
- Bug fixes with AI assistance
- Screenshots of AI-assisted workflow

This is a scoring bonus - make it thorough and authentic.

---

## 5. Technical Architecture

```
               ┌──────────────────────────────┐
               │      FRONTEND (React)         │
               │      GitHub Pages (static)    │
               │                               │
               │  Scanner → Report → Explorer  │
               └───┬──────────┬──────────┬────┘
                   │          │          │
          Read ────┘   POST ──┘   Fetch ─┘
          (RPC)     /scan API   reports.json
                   │          │          │
     ┌─────────────▼──────────▼──────────▼────┐
     │        AI AGENT (Node.js + Express)     │
     │        Deployed on Railway (free tier)  │
     │                                         │
     │  API:                                   │
     │   POST /scan { address }                │
     │   GET  /status/:address                 │
     │   GET  /reports.json (all summaries)    │
     │                                         │
     │  Pipeline:                              │
     │   1. Validate request (filter spam)     │
     │   2. Fetch source (BSCScan API)         │
     │   3. Static pattern analysis            │
     │   4. LLM deep analysis (Claude)         │
     │   5. Generate report                    │
     │   6. Upload to IPFS (Pinata)            │
     │   7. Submit score onchain               │
     │   8. Update reports.json cache          │
     └────────────────┬───────────────────────┘
                      │
             Submit ──┘ (agent wallet)
                      │
     ┌────────────────▼───────────────────────┐
     │        BSC MAINNET                      │
     │                                         │
     │   SecurityOracle.sol                    │
     │   ├── reports mapping                   │
     │   ├── requestAudit() (also via events)  │
     │   ├── submitReport()                    │
     │   ├── getScore() view                   │
     │   ├── getScores() batch view            │
     │   └── getAuditedContracts() paginated   │
     └────────────────────────────────────────┘
```

**Data flow for Explorer page:**
- Agent maintains `reports.json` - a flat JSON file with all report summaries (address, score, timestamp, findings counts)
- Frontend fetches this single file on load - instant, no RPC calls needed
- Individual report detail: fetch from IPFS gateway using ipfsHash from contract
- Onchain data is the source of truth; reports.json is a performance cache

**Spam filtering (agent-side, no onchain fee for MVP):**
- Reject requests for addresses with 0 code (not contracts)
- Rate limit: max 5 scans per minute globally
- Skip addresses already scanned in last 24h (unless force re-scan)
- Queue system: FIFO, max 10 pending, reject overflow

**Stack:**
| Component | Tech | Why |
|-----------|------|-----|
| Smart Contract | Solidity 0.8.25, Foundry | Fast tests, Solidity-native |
| AI Agent + API | Node.js / TypeScript + Express | ethers.js + Anthropic SDK + API in same process |
| LLM | Claude API (claude-sonnet-4-5-20250929) | Best code analysis, fast, affordable |
| Storage | IPFS via Pinata | Decentralized report storage |
| Agent Hosting | Railway free tier | Always-on, auto-deploy from GitHub |
| Frontend | React + Vite + TailwindCSS | Static, deployed to GitHub Pages |
| RPC | BSC public RPC / Ankr | Free tier sufficient |
| Indexing | reports.json cache + RPC fallback | No subgraph needed |

---

## 6. Smart Contract Design

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract SecurityOracle {

    struct Report {
        uint8 riskScore;          // 0-100
        string ipfsHash;          // Full report on IPFS
        uint256 timestamp;
        uint16 findingsCount;     // Total findings
        uint8 criticalCount;
        uint8 highCount;
        uint8 mediumCount;
        uint8 lowCount;
        bool verified;            // Source code verified on BSCScan
    }

    address public agent;         // AI agent address (submitter)
    address public owner;

    mapping(address => Report) public reports;
    mapping(address => bool) public audited;
    address[] public auditedContracts;  // For enumeration

    uint256 public totalAudits;

    event AuditRequested(address indexed target, address indexed requester);
    event ReportSubmitted(address indexed target, uint8 riskScore, string ipfsHash);
    event AgentUpdated(address indexed oldAgent, address indexed newAgent);

    modifier onlyAgent() {
        require(msg.sender == agent, "Only agent");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address _agent) {
        owner = msg.sender;
        agent = _agent;
    }

    function requestAudit(address target) external {
        require(target != address(0), "Zero address");
        require(target.code.length > 0, "Not a contract");
        emit AuditRequested(target, msg.sender);
    }

    function submitReport(
        address target,
        uint8 riskScore,
        string calldata ipfsHash,
        uint16 findingsCount,
        uint8 criticalCount,
        uint8 highCount,
        uint8 mediumCount,
        uint8 lowCount,
        bool verified
    ) external onlyAgent {
        require(riskScore <= 100, "Score out of range");

        reports[target] = Report({
            riskScore: riskScore,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            findingsCount: findingsCount,
            criticalCount: criticalCount,
            highCount: highCount,
            mediumCount: mediumCount,
            lowCount: lowCount,
            verified: verified
        });

        if (!audited[target]) {
            audited[target] = true;
            auditedContracts.push(target);
            totalAudits++;
        }

        emit ReportSubmitted(target, riskScore, ipfsHash);
    }

    function getScore(address target) external view returns (uint8) {
        require(audited[target], "Not audited");
        return reports[target].riskScore;
    }

    /// @notice Batch query scores. Returns 255 for unaudited addresses (no revert).
    function getScores(address[] calldata targets) external view returns (uint8[] memory scores) {
        scores = new uint8[](targets.length);
        for (uint256 i = 0; i < targets.length; i++) {
            scores[i] = audited[targets[i]] ? reports[targets[i]].riskScore : type(uint8).max;
        }
    }

    function isAudited(address target) external view returns (bool) {
        return audited[target];
    }

    /// @notice Paginated access to audited contracts list.
    function getAuditedContracts(uint256 offset, uint256 limit)
        external view returns (address[] memory result)
    {
        uint256 len = auditedContracts.length;
        if (offset >= len) return new address[](0);
        uint256 end = offset + limit > len ? len : offset + limit;
        result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = auditedContracts[i];
        }
    }

    function getAuditedCount() external view returns (uint256) {
        return auditedContracts.length;
    }

    function setAgent(address _agent) external onlyOwner {
        emit AgentUpdated(agent, _agent);
        agent = _agent;
    }
}
```

---

## 7. Competitive Differentiation

| Feature | Aegis | GoPlus | CertiK | Slither |
|---------|-------|--------|--------|---------|
| AI-powered analysis | Yes (LLM) | No (rule-based) | Partial | No |
| Onchain oracle | Yes (queryable) | No (API only) | No | No |
| Permissionless | Yes (anyone requests) | N/A | No ($$$) | Yes (CLI) |
| Source code analysis | Yes (full Solidity) | No (metadata only) | Yes | Yes |
| Free | Yes | Yes (limited) | No ($50K+) | Yes |
| Non-technical users | Yes (paste address) | Partial | No | No |
| Real-time | Yes (event-driven) | Yes | No (weeks) | N/A |
| Decentralized results | Yes (onchain + IPFS) | No (centralized API) | No | No |

**Our moat:** The AI analysis is built by someone who has actually found real vulnerabilities in production contracts (Olas, Kamino, Orderly Network). The detection patterns come from real audit experience, not textbook examples.

---

## 8. Hackathon Scoring Strategy

### Judge Score Optimization (60%)

BNB Chain judges score 0-10 on four equal criteria:

**1. Design & Usability (25%)**
- Clean, polished frontend (not a prototype)
- No wallet connection needed to view reports (low friction)
- Mobile responsive
- Clear visual hierarchy: score gauge, severity badges, code highlights
- Action: Use the frontend-design skill for world-class UI

**2. Technical Implementation & Code Quality (25%)**
- Clean, modular Solidity with NatSpec comments
- TypeScript agent with proper error handling
- Comprehensive test suite (Foundry for contracts, Jest for agent)
- Open source repo with clear README
- Action: Write production-quality code, not hackathon spaghetti

**3. BNB Chain Integration & Ecosystem Fit (25%)**
- Deploy on BSC mainnet (not just testnet)
- Use BSCScan API for source code
- Oracle is BSC infrastructure (other dApps query it)
- Pre-scan popular BSC contracts (PancakeSwap, Venus, WBNB)
- Action: Emphasize "this is BSC infrastructure" in submission

**4. Innovation & Creativity (25%)**
- First decentralized AI security oracle
- Novel: onchain queryable security scores
- AI Build Log bonus: document everything
- Action: Lead with "no one has done this" angle

### Community Vote Optimization (40%)

- **Make it viral:** "Is your BSC contract safe? Check in 30 seconds" - shareable on X
- **Pre-populate:** Scan 50+ popular BSC contracts before submission so the explorer isn't empty
- **Build in public:** Post daily updates on X, tag @BNBCHAIN
- **Unique report URLs:** Each report is shareable (people share their contract's safety score)
- **Clear value prop:** Don't make people think. Paste address → see score. Done.

---

## 9. Development Timeline

### Phase 1: Core Engine (Days 1-3, Feb 10-12)

**Goal: working scan pipeline from address → report**

| Task | Time | Output |
|------|------|--------|
| Smart contract (SecurityOracle.sol + tests) | 5h | Tested contract with batch/pagination |
| Deploy to BSC testnet → verify | 1h | Verified contract |
| BSCScan API integration (flat + JSON input) | 2h | Source code fetcher |
| Static pattern analyzer (10+ patterns) | 4h | Pattern detector |
| Claude LLM analyzer (structured prompts) | 4h | Deep analysis |
| Scoring engine (proportional formula) | 1h | Risk calculator |
| Report generator (JSON + markdown) | 2h | Report output |
| IPFS upload (Pinata) | 1h | Report storage |

### Phase 2: API + Frontend (Days 4-6, Feb 13-15)

**Goal: live agent API + functional frontend**

| Task | Time | Output |
|------|------|--------|
| Agent Express API (POST /scan, GET /status, GET /reports.json) | 3h | API server |
| Scan queue + rate limiting + spam filtering | 2h | Robust pipeline |
| Onchain submission (agent wallet → submitReport) | 2h | End-to-end flow |
| Deploy agent to Railway | 1h | Always-on agent |
| Deploy contract to BSC mainnet | 1h | Live oracle |
| Scan 10 contracts end-to-end on mainnet | 2h | Validated pipeline |
| Frontend scaffolding (React + Vite + Tailwind + Router) | 2h | Project setup |
| Scanner page (hero + search + progress state) | 4h | Landing page |
| Report page (score gauge + findings + onchain proof) | 4h | Report view |

### Phase 3: Polish + Populate (Days 7-9, Feb 16-18)

**Goal: production-quality UI + 50+ pre-scanned contracts**

| Task | Time | Output |
|------|------|--------|
| Explorer page (browse, filter, sort, leaderboard) | 3h | Contract browser |
| Stats page (distribution, common vulns, health) | 2h | Analytics |
| Frontend polish (animations, responsive, dark mode) | 4h | Production UI |
| Pre-scan 50-100 popular BSC contracts | 4h | Populated database |
| Integration guide page (/integrate) | 2h | Developer docs |
| AI Build Log page (/build-log) | 2h | Bonus documentation |
| README + repo cleanup | 1h | Clean submission |
| Demo video recording (3 min) | 2h | Showcase video |

### Phase 4: Submit + Campaign (Day 10, Feb 19)

**Goal: submit and start vote campaign**

| Task | Time | Output |
|------|------|--------|
| Final testing on mainnet (scan unknown contract live) | 1h | Verified working |
| DoraHacks submission (contract addr + tx hashes + demo link + repo) | 1h | Live submission |
| X thread: build-in-public recap + demo | 1h | Community awareness |
| Share in BNB Chain Discord/Telegram | 1h | Community reach |
| Start gathering community votes | ongoing | Vote campaign |

**Buffer:** 2h per phase for unexpected integration issues.

---

## 10. Demo Script (for judges)

**Duration:** 3 minutes

1. **[0:00-0:30] The Problem**
   "BSC has thousands of DeFi contracts. Most are unaudited. Users have no way to check if a contract is safe before depositing funds. CertiK charges $50K+. GoPlus only checks token metadata. There's no free, permissionless, AI-powered way to verify contract security."

2. **[0:30-1:30] Live Demo**
   - Open Aegis dashboard
   - Paste PancakeSwap Router address → show clean report (low risk score, green)
   - Paste a known vulnerable/scam contract → show findings (high risk, red, specific vulnerabilities listed)
   - Click through to IPFS report → show detailed findings
   - Show BSCScan tx → onchain proof

3. **[1:30-2:15] The Oracle**
   - Show Solidity code: `uint8 score = aegis.getScore(contractAddress);`
   - "Any dApp on BSC can now query Aegis to check if a contract is safe before interacting with it. PancakeSwap could check tokens before listing. Wallets could warn users. This is BSC security infrastructure."

4. **[2:15-2:45] Explorer**
   - Show 50+ pre-scanned contracts
   - Score distribution, most common vulnerabilities
   - "This is the security health map of BSC"

5. **[2:45-3:00] AI Build Log + Close**
   - Flash the build log page
   - "Built entirely with AI-assisted development. Every line of code, every test, every design decision documented."
   - "Aegis - making BSC security permissionless."

---

## 11. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| BSCScan API rate limits | Can't fetch source fast enough | Cache aggressively, free API key gives 5 calls/sec (plenty) |
| Claude API costs | Analysis expensive at scale | Sonnet 4.5 is $3/M input. 100 contracts ~ $10 total. Budget $30 |
| False positives | Credibility hit | Static patterns (deterministic) run first, LLM validates. Show confidence levels per finding |
| Gas costs for mainnet | Need BNB for submissions | submitReport ~ 0.001 BNB. 100 reports ~ 0.1 BNB ($30). Trivial |
| Unverified contracts | Can't analyze source | Flag "Unverified - High Risk" + metadata-only analysis (bytecode size, age, tx count) |
| Large multi-file contracts | Exceeds LLM context | Chunk by file, skip OpenZeppelin/standard libs, analyze custom logic only |
| Spam scan requests | Agent burns API credits | Rate limit (5/min), queue cap (10 pending), reject non-contracts, skip re-scans <24h old |
| Agent downtime during judging | Demo breaks | Deploy on Railway (auto-restart), health check endpoint, test 24h before submission |
| Judge pastes unknown address | Blank screen, demo fails | Pre-scan 50-100 popular contracts. For unknowns: clear progress UI with time estimate |
| Low community votes | Miss 40% of score | Build in public on X, pre-populate explorer, shareable report URLs, tag @BNBCHAIN |
| Stale reports for upgraded proxies | Wrong score displayed | Show report timestamp prominently, allow re-scan requests, note "last scanned X days ago" |

---

## 12. Post-Hackathon Vision (for judges)

**Phase 2 (if funded):**
- Continuous monitoring: watch for proxy upgrades, ownership transfers, suspicious txs
- Community verification layer: stake BNB to challenge/confirm AI findings
- Multi-chain expansion: Ethereum, Arbitrum, Base
- Browser extension: security badge on every dApp
- API access: developers query Aegis via REST API
- Governance: transition to DAO for agent management

**Revenue model:**
- Free for basic scans (community good)
- Premium: priority scanning, continuous monitoring, API access
- Protocol integrations: dApps pay for real-time oracle access

This is the story judges want to hear: "This isn't just a hackathon project. This is the beginning of BSC security infrastructure."

---

## 13. File Structure

```
aegis/
├── contracts/
│   ├── src/
│   │   └── SecurityOracle.sol
│   ├── test/
│   │   └── SecurityOracle.t.sol
│   ├── script/
│   │   └── Deploy.s.sol
│   └── foundry.toml
├── agent/
│   ├── src/
│   │   ├── index.ts              # Main entry + Express API server
│   │   ├── api.ts                # POST /scan, GET /status/:addr, GET /reports.json
│   │   ├── queue.ts              # Scan queue (FIFO, rate-limited)
│   │   ├── scanner.ts            # BSCScan source fetcher (handles flat + JSON input)
│   │   ├── analyzer/
│   │   │   ├── static.ts         # Pattern-based analysis (regex + heuristics)
│   │   │   ├── llm.ts            # Claude API analysis (structured prompts)
│   │   │   └── scorer.ts         # Risk score calculator (proportional formula)
│   │   ├── reporter.ts           # Report generator (markdown + JSON)
│   │   ├── ipfs.ts               # Pinata upload
│   │   ├── onchain.ts            # Contract interaction (ethers.js)
│   │   └── cache.ts              # reports.json read/write
│   ├── data/
│   │   └── reports.json          # Cached report summaries (served by API)
│   ├── Dockerfile                # For Railway deployment
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx          # Scanner hero
│   │   │   ├── Report.tsx        # Audit report view
│   │   │   ├── Explorer.tsx      # Browse all audits
│   │   │   ├── Stats.tsx         # Analytics
│   │   │   └── BuildLog.tsx      # AI build log
│   │   ├── components/
│   │   │   ├── ScoreGauge.tsx    # Risk score visualization
│   │   │   ├── FindingCard.tsx   # Individual finding
│   │   │   ├── ContractCard.tsx  # Explorer list item
│   │   │   └── Header.tsx
│   │   ├── hooks/
│   │   │   └── useOracle.ts     # Contract read hooks
│   │   ├── lib/
│   │   │   └── contracts.ts     # ABI + addresses
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── ai/
│   ├── PRD.md                    # This file
│   ├── memory.md                 # Decisions log
│   ├── build-log.md              # AI Build Log for submission
│   └── plan.md                   # Implementation plan
└── README.md
```

---

## 14. Success Criteria

**Minimum viable submission (must hit all):**
- [ ] SecurityOracle.sol deployed and verified on BSC mainnet
- [ ] AI agent successfully scans a contract and submits report onchain
- [ ] Frontend shows report with risk score, findings, and onchain proof
- [ ] At least 20 BSC contracts pre-scanned in the explorer
- [ ] Reproducible: README with setup instructions, demo link
- [ ] DoraHacks submission with onchain proof (contract address + tx hashes)

**Win condition (hit all of the above plus):**
- [ ] 50+ contracts pre-scanned
- [ ] Polished, production-quality frontend
- [ ] AI Build Log page with documented workflow
- [ ] Demo video (3 min)
- [ ] X thread with build-in-public updates
- [ ] Integration guide showing other dApps how to query the oracle
- [ ] Stats page with BSC security health visualization
