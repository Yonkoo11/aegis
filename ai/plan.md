# Aegis Implementation Plan

## Phase 1: Core Engine (Today - Feb 12)

### Step 1: Smart Contract ← NOW
- [ ] Init Foundry project in contracts/
- [ ] Write SecurityOracle.sol (from PRD spec)
- [ ] Write comprehensive Foundry tests
- [ ] Deploy to BSC testnet + verify

### Step 2: AI Agent Scaffolding
- [ ] Init Node.js/TypeScript project in agent/
- [ ] BSCScan API source fetcher (scanner.ts)
- [ ] Static pattern analyzer (static.ts)
- [ ] Claude LLM analyzer (llm.ts)
- [ ] Scoring engine (scorer.ts)
- [ ] Report generator (reporter.ts)
- [ ] IPFS upload via Pinata (ipfs.ts)
- [ ] Onchain submission (onchain.ts)

### Step 3: Agent API + Queue
- [ ] Express server (api.ts)
- [ ] Scan queue with rate limiting (queue.ts)
- [ ] reports.json cache (cache.ts)
- [ ] End-to-end test: address → report → IPFS → onchain

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
