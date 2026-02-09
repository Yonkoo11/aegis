# Aegis Implementation Plan

## Phase 1: Core Engine (Today - Feb 12)

### Step 1: Smart Contract ✅ DONE
- [x] Init Foundry project in contracts/
- [x] Write SecurityOracle.sol (batch queries, pagination, re-audit support)
- [x] Write comprehensive Foundry tests (28/28 passing)
- [ ] Deploy to BSC testnet + verify

### Step 2: AI Agent Scaffolding ✅ DONE
- [x] Init Node.js/TypeScript project in agent/
- [x] BSCScan API source fetcher (scanner.ts - handles flat + JSON input)
- [x] Static pattern analyzer (static.ts - 16 patterns)
- [x] Claude LLM analyzer (llm.ts - structured prompts)
- [x] Scoring engine (scorer.ts - proportional formula)
- [x] Report generator (reporter.ts - JSON + markdown)
- [x] IPFS upload via Pinata (ipfs.ts)
- [x] Onchain submission (onchain.ts)
- [x] CLI scan tool (scan-cli.ts) - tested against PancakeSwap Router

### Step 3: Agent API + Queue ✅ DONE
- [x] Express server (api.ts - POST /scan, GET /status, GET /reports.json)
- [x] Scan queue with rate limiting (queue.ts - FIFO, 5/min, 10 cap)
- [x] reports.json cache (cache.ts)
- [ ] End-to-end test with BSCScan API key: address → full analysis → IPFS → onchain

### Step 4: NEXT
- [ ] Get BSCScan API key and test full pipeline with real source code
- [ ] Test LLM analysis on a real contract
- [ ] Deploy to BSC testnet
- [ ] Start frontend

## Phase 2: Frontend (Feb 13-15)
- [ ] React + Vite + Tailwind scaffold
- [ ] Scanner page (hero + search + progress)
- [ ] Report page (score gauge + findings)
- [ ] Explorer page (browse + filter)
- [ ] Connect to agent API

## Phase 3: Polish + Deploy (Feb 16-18)
- [ ] Deploy contract to BSC mainnet
- [ ] Deploy agent to Railway
- [ ] Deploy frontend to GitHub Pages
- [ ] Pre-scan 50-100 BSC contracts
- [ ] Stats page, Build Log page
- [ ] Demo video

## Phase 4: Submit (Feb 19)
- [ ] Final mainnet testing
- [ ] DoraHacks submission
- [ ] X campaign
