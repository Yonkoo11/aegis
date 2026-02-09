# Aegis - AI Build Log

This document captures every AI-assisted decision, code generation, and iteration during the development of Aegis. Submitted as part of the AI Build Log bonus for the Good Vibes Only: OpenClaw Edition hackathon.

---

## Session 1: Ideation & PRD (Feb 9, 2026)

**AI Tool:** Claude Code (claude-opus-4-6)

### Idea Generation
- Prompted Claude with hackathon requirements, personal skills (smart contract auditing, AI tooling), and constraints (10-day timeline)
- AI generated 3 candidate ideas, compared against 5 externally sourced ideas
- Convergence: both independent analyses identified "AI Security Oracle" as the strongest idea
- Key AI insight: framing as "oracle" (infrastructure) rather than "scanner" (tool) maximizes judge scores

### PRD Generation
- AI researched: BSCScan API capabilities, existing tools (GoPlus, CertiK, Slither), BNB Chain judging criteria, past hackathon winners
- Generated comprehensive PRD including: technical architecture, smart contract design, scoring formula, 10-day timeline, demo script
- Human review: approved architecture, refined scoring weights, confirmed feasibility

### Decisions Made With AI
1. BSC mainnet over opBNB (queryability by other dApps)
2. IPFS for reports (cost vs onchain storage)
3. Layered analysis (static patterns + LLM) for accuracy
4. Risk score 0-100 scale with color-coded thresholds
