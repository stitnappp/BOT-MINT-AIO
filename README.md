# NFT AIO Mint Bot

An **All-in-One NFT Minting Bot** built with Node.js and Ethers.js.  
Supports multiple EVM-compatible chains (Ethereum L1 & L2, Polygon, BSC, Arbitrum, Optimism, zkSync, Linea, Scroll, etc.).  
Features include single contract minting, multi-chain minting, gas checker, and multi-wallet parallel execution.

---

## Features

- **Chain Selection by Number** – Easy menu to pick supported chains (Ethereum, L2s, zk-rollups, alt L1s).
- **Single Contract Mint** – Mint NFTs from any contract interactively.
- **Multi-Chain Minting** – Add multiple projects in `targets.json` and mint all at once.
- **Parallel Multi-Wallet Minting** – Mint across several wallets simultaneously.
- **Gas Price Checker** – Check real-time gas price on any supported chain.
- **Customizable** – Add your own RPC endpoints and chains via `chains.json`.
- **Dry Run Mode** – Simulate transactions without broadcasting (for testing).
- **Telegram Notifications (Optional)** – Get mint status updates directly in Telegram.

---

## Requirements

- [Node.js](https://nodejs.org/) (v16+ recommended)
- npm (comes with Node.js)
- A GitHub account (for repo versioning, optional)

---

## Installation

Clone this repository and install dependencies:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
npm install


---

Configuration

Create a .env file in the project root (never commit this file, it's ignored by .gitignore):

PRIVATE_KEY=0xYOUR_PRIVATE_KEY
DRY_RUN=false
TG_BOT_TOKEN=your_telegram_bot_token   # optional
TG_CHAT_ID=your_chat_id                # optional
MULTI_PRIVATE_KEYS=0xkey1,0xkey2       # optional (for parallel minting)

For reference, you can also create a .env.example template like this (safe for repo):

PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
DRY_RUN=false
TG_BOT_TOKEN=your_telegram_bot_token_here
TG_CHAT_ID=your_telegram_chat_id_here
MULTI_PRIVATE_KEYS=0xkey1,0xkey2


---

Usage

Run the bot:

node aio.mjs

You'll see an interactive menu:

=== NFT AIO MENU ===
1) Check wallet balance
2) Mint single contract (manual)
3) Mint multi-chain (targets.json)
4) Add new target
5) View targets
6) Delete target
7) Check current gas price
8) Parallel mint (multi-wallet)
0) Exit

Follow the on-screen prompts to perform actions.


---

Adding Chains

By default, the bot includes many chains (Ethereum, L2s, zk-rollups, alt L1s).

To add custom chains, create a chains.json file:


[
  { "name": "ZKFair", "key": "zkfair", "rpc": "https://rpc.zkfair.io" },
  { "name": "Sei EVM", "key": "sei", "rpc": "https://evm-rpc.sei-apis.com" }
]

The bot will automatically load these chains and display them in the numbered menu.


---

Adding Mint Targets

Use menu option 4) Add target or edit targets.json manually:

[
  {
    "name": "mainnet",
    "contract": "0xCONTRACT_ADDRESS",
    "qty": 1,
    "valueEth": "0.05",
    "functionCandidates": ["mint","publicMint"],
    "rpc": "https://YOUR_CUSTOM_RPC (optional)"
  }
]


---

Notes & Security

Never commit your .env file or private keys to GitHub (use .env.example as a safe template).

Use dry run mode (DRY_RUN=true) to test without broadcasting transactions.

For best performance, use your own RPC endpoints (Alchemy, Infura, QuickNode, etc.) instead of public ones.

Gas costs vary per chain; always double-check before minting.



---

License

MIT License – feel free to use and modify.


---

Disclaimer

This bot is for educational purposes only. You are responsible for any transactions executed. Use at your own risk.

---

Would you like me to **add badges** (Node.js version, License, etc.) and **screenshots of the menu** for a more professional GitHub page? Or should I keep it simple like above?

