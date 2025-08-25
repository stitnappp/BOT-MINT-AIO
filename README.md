# NFT AIO Bot (by ITSMorvo)

A powerful and flexible **NFT Minting All-in-One Bot** built with **Node.js** and **ethers.js v6**.  
Supports multiple EVM chains, automatic ABI detection, multi-wallet parallel minting, and more.

---

## Features
- **Automatic Minting** on multiple EVM chains (Ethereum, Polygon, Arbitrum, Optimism, Base, Linea, Scroll, zkSync, BSC, etc.).
- **Multi-wallet Parallel Minting**: run mints for multiple wallets at once.
- **Automatic ABI Finder**: fetch ABI from explorer and suggest mint functions.
- **Fallback minimal ABI**: if explorer ABI fails.
- **Check balance & gas** with status info (low/medium/high).
- **RPC Tester**: scan all RPCs and pick fastest one.
- **Dynamic Chain Picker** with pagination & manual RPC.
- **DRY-RUN Mode**: simulate mint without sending tx (set `DRY_RUN=true` in `.env`).
- **Targets File (targets.json)**: store multiple contracts for batch mints.

---

## Requirements
- **Node.js v18+**
- **npm or yarn**
- **Alchemy API Key** (optional but recommended for stable RPC)
- **Private Key** of your wallet (use test wallets first!)

---

## Installation
```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
npm install

Create a .env file (copy the template):

# Required
PRIVATE_KEY=your_private_key_here

# Optional Alchemy API Key
ALCHEMY_KEY=your_alchemy_api_key_here

# Simulation mode (true/false)
DRY_RUN=false

# Optional: API keys for explorers (for ABI fetch)
ETHERSCAN_API_KEY=
POLYGONSCAN_API_KEY=
ARBISCAN_API_KEY=
BASESCAN_API_KEY=
LINEASCAN_API_KEY=
SCROLLSCAN_API_KEY=


---

Usage

Run the bot:

node aio.mjs

Or if you set a script in package.json:

npm start

Menu options:

1. Check balance


2. Mint single contract (manual + ABI Finder)


3. Mint multiple contracts (targets.json)


4. Add target


5. View targets


6. Delete target


7. Check gas price


8. Mint parallel (multi-wallet)


9. Test RPCs


10. ABI Finder only (no mint)


11. Exit




---

Targets File (Example)

Add a targets.json:

[
  {
    "name": "sepolia",
    "contract": "0x1234...abcd",
    "qty": 1,
    "valueEth": "0.001",
    "functionCandidates": ["mint","claim"]
  }
]


---

Changelog

v2.0 – 2025-08-25

Added ABI Finder UI (with mint candidate suggestions)

Improved fallback mint detection (works even if static call fails)

Enhanced gas checker with low/medium/high status

Added support for many EVM chains (incl. testnets)

Added RPC scanner and fastest RPC picker

Added DRY_RUN simulation mode

Improved multi-wallet parallel mint

UI: colorful ASCII banner and dynamic menu (ITSMorvo watermark)

Security: moved API keys to .env (no hardcoded API keys)



---

Disclaimer

Use this bot at your own risk.
Always test on testnets before mainnet.
The author is not responsible for any financial losses.
