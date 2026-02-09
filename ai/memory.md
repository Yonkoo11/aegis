# Aegis - Project Memory

## Project
- **What:** Decentralized AI Security Oracle for BNB Chain
- **Hackathon:** Good Vibes Only: OpenClaw Edition ($100K pool)
- **Deadline:** Feb 19, 2026 15:00 UTC
- **Track:** AI Agents

## Key Decisions
- Deploy on BSC mainnet (not opBNB) so other dApps can query the oracle
- Full reports on IPFS, only score + hash onchain (gas efficiency)
- Node.js/TypeScript for agent (ethers.js + Anthropic SDK in same runtime)
- React + Vite + Tailwind for frontend, deploy to GitHub Pages
- Foundry for smart contracts (fast, Solidity-native tests)
- Claude Sonnet 4.5 for LLM analysis (best code understanding, affordable)

## Architecture
- SecurityOracle.sol: onchain registry of audit reports
- AI Agent: event listener → BSCScan fetch → static analysis → LLM analysis → IPFS upload → onchain submit
- Frontend: scanner, report view, explorer, stats, build log

## Competitive Edge
- Built by actual auditor (found bugs in Olas, Kamino, Orderly)
- Real vulnerability detection, not ChatGPT wrapper
- Onchain oracle (queryable by other dApps) vs centralized APIs
- Permissionless vs CertiK's $50K+ audits
