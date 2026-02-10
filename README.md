# Aegis - Decentralized AI Security Oracle

**The first permissionless, AI-powered smart contract security oracle on BNB Chain.**

Paste any contract address. Get an instant AI security audit. Results stored onchain and on IPFS - queryable by any dApp.

**[Live Demo](https://yonkoo11.github.io/aegis/)** | **[Verified Contract](https://testnet.bscscan.com/address/0x6d884cd49245161a6826aba46d5d6e95918a1f8f#code)** | **[Sample IPFS Report](https://gateway.pinata.cloud/ipfs/QmNimG5LhujAh8iRrXkKCBBWX7ULnUt6sTySP8u2X7iDKX)**

---

## Why Aegis

| Existing Tools | Limitation | Aegis |
|---|---|---|
| CertiK | $50K-$200K, weeks-long | Free, instant |
| GoPlus | Token metadata only, no code analysis | Full source code analysis with AI |
| Slither/Mythril | CLI tools, no onchain presence | Onchain oracle queryable by dApps |
| De.Fi Scanner | Surface-level checks | Deep vulnerability detection |

**The gap:** No free, permissionless security scoring system that lives onchain for other dApps to query. Aegis fills it.

---

## Architecture

```
User pastes address
        |
        v
  +------------------+
  |   Aegis Agent    |  Node.js + TypeScript
  |                  |
  |  1. BSCScan API  |  Fetch verified source code
  |  2. Static       |  Pattern matching (40+ rules)
  |  3. Claude AI    |  Deep vulnerability analysis
  |  4. Scorer       |  Risk score 0-100
  |  5. IPFS         |  Full report pinned to Pinata
  |  6. Onchain      |  Score + hash to SecurityOracle
  +------------------+
        |
        v
  +------------------+
  | SecurityOracle   |  Solidity smart contract (BSC)
  |   .sol           |
  |  - getScore()    |  Any dApp can query
  |  - getReport()   |  Score, findings, IPFS hash
  |  - isAudited()   |  Boolean check
  +------------------+
        |
        v
  +------------------+
  |   Frontend       |  Svelte + Vite + TailwindCSS
  |                  |
  |  - Scanner       |  Paste address, get results
  |  - Explorer      |  Browse all audited contracts
  |  - Report        |  Detailed findings + severity
  |  - Stats         |  Ecosystem risk overview
  +------------------+
```

---

## Integrate Aegis Into Your dApp

Any smart contract on BNB Chain can query Aegis before interacting with an unknown contract:

```solidity
interface IAegis {
    function getScore(address target) external view returns (uint8);
    function isAudited(address target) external view returns (bool);
}

contract MyDeFiProtocol {
    IAegis constant aegis = IAegis(0x6D884cD49245161A6826AbA46D5D6E95918a1F8f);

    function deposit(address vault) external {
        require(aegis.isAudited(vault), "Vault not audited");
        require(aegis.getScore(vault) < 50, "Risk too high");
        // proceed with deposit...
    }
}
```

---

## Deployed Contracts

| Network | Address | Status |
|---|---|---|
| BSC Testnet | [`0x6D884cD49245161A6826AbA46D5D6E95918a1F8f`](https://testnet.bscscan.com/address/0x6d884cd49245161a6826aba46d5d6e95918a1f8f#code) | Verified |

**Agent Wallet:** `0x15545100bf579a5a6492499126E2b076a6890b98`

**Onchain Proof:** [First audit tx](https://testnet.bscscan.com/tx/0x1dfc82233509b9de662c83acdc3d19cc1a3474a2cbe069a56115a9ff6b126fac) - PancakeSwap Router scored 43/100 (Medium Risk)

---

## Run Locally

### Prerequisites
- Node.js 18+
- [Foundry](https://getfoundry.sh) (for contracts)
- BSCScan API key (free at bscscan.com)

### Agent
```bash
cd agent
cp .env.example .env
# Fill in BSCSCAN_API_KEY, ANTHROPIC_API_KEY
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5175/aegis/
```

### Smart Contracts
```bash
cd contracts
forge build
forge test
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity, Foundry, OpenZeppelin |
| AI Agent | Node.js, TypeScript, ethers.js, Anthropic Claude Sonnet 4.5 |
| Analysis | 40+ static patterns + LLM deep analysis |
| Storage | IPFS (Pinata), BSC onchain |
| Frontend | Svelte, Vite, TailwindCSS |
| Deployment | GitHub Pages (frontend), BSC Testnet (contracts) |

---

## What Makes This Real

- **Built by an actual smart contract auditor** who has found vulnerabilities in production protocols (Olas, Kamino, Orderly Network)
- **35 real BSC contracts scanned** - PancakeSwap, Venus, WBNB, CAKE, USDT, and more
- **Not a ChatGPT wrapper** - combines static pattern analysis with targeted LLM deep analysis
- **Onchain oracle** - not just a tool, but infrastructure other dApps can build on
- **IPFS persistence** - full reports are immutable and permanent
- **Entirely vibe-coded with Claude** - from smart contracts to frontend to this README

---

## License

MIT
