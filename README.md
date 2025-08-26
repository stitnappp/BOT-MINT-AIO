# BOT-MINT-AIO

**AIO NFT Mint Bot**  
by **ITSMorvo** (community fork & patches)

Bot NFT universal untuk mint multi-chain dengan:
- **Auto ABI detection** dari explorer (Etherscan, BaseScan, dsb).
- **No-ABI Blast mode** → override nama fungsi (`mint`, `publicMint`, dll.) dan bot otomatis coba signature umum.
- **Multi-chain support** (Ethereum, Arbitrum, Optimism, Base, Polygon, Linea, zkSync, Scroll, Blast, Mode, Taiko, dll).
- **RPC failover**: Alchemy (jika ada key) → fallback ke RPC publik (1RPC, DRPC, Ankr, dsb).
- **Multi-wallet minting** (paralel, cocok buat farming).
- **Targets.json**: simpan list kontrak yang mau dimint, bisa batch otomatis.
- **Pretty ABI viewer**: lihat fungsi, events, mint candidates langsung dari explorer.

---

## ⚙️ Setup

### 1. Clone repo
```bash
git clone https://github.com/stitnappp/BOT-MINT-AIO.git
cd BOT-MINT-AIO

2. Install dependencies

Pastikan Node.js v18+:

npm install

3. Config .env

Buat file .env di root:

# === Wallet ===
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
# MULTI_PRIVATE_KEYS=0xkey1,0xkey2,0xkey3

# === Alchemy (opsional) ===
ALCHEMY_KEY=your_alchemy_key

# === Explorer API Keys (opsional) ===
ETHERSCAN_API_KEY=
ARBISCAN_API_KEY=
BASESCAN_API_KEY=
OPTIMISTIC_ETHERSCAN_API_KEY=
POLYGONSCAN_API_KEY=
LINEASCAN_API_KEY=
SCROLLSCAN_API_KEY=

# === Debug ===
DRY_RUN=false

4. Run

npm start


---

📑 Features

Menu utama:

1. Cek saldo wallet


2. Mint 1 kontrak (manual, bisa override fungsi)


3. Mint multi target (targets.json)


4. Tambah target


5. Lihat target


6. Hapus target


7. Cek gas sekarang


8. Multi-wallet mint (paralel)


9. Test RPC endpoints (auto pilih tercepat)


10. ABI Finder (lihat fungsi tanpa mint)


11. Keluar



targets.json example:


[
  {
    "name": "Base",
    "contract": "0x1234abcd...",
    "qty": 1,
    "valueEth": "0.001",
    "functionCandidates": ["mint","publicMint"]
  }
]


---

🛠️ Development

Tambahkan chain baru di chains.json:


[
  { "name": "Abstract", "key": "abstract", "rpc": ["https://rpc.abstract.org"] }
]

Bot otomatis merge dengan default chain list.


---

⚠️ Disclaimer

Educational & research purposes only.

Gunakan wallet dummy/testnet dulu sebelum mainnet.

Penulis/kontributor tidak bertanggung jawab atas penggunaan yang salah.



---

---

## 📜 CHANGELOG.md

```markdown
# Changelog

## [1.2.0] – 2025-08-26
### Added
- **No-ABI Blast Mode**: override nama fungsi (contoh `mint`) → bot auto-simulate berbagai signature (`mint(uint256)`, `mint(address,uint256)`, dll) sampai ketemu yang valid.
- **Pretty ABI Viewer**: summary fungsi (write/view/events) + highlight mint candidates.
- **RPC Failover**: Alchemy (jika ada key) → fallback ke RPC publik (DRPC, 1RPC, Ankr).
- **Multi-chain extended**: +Blast, Zora, Mode, Taiko, Monad testnet, dan banyak lainnya.
- **Multi-wallet mint**: support `MULTI_PRIVATE_KEYS` dari `.env` atau `wallets.txt`.

### Changed
- **Refactor `aio.mjs`**: modular ABI fetch, improved menu, clear error handling.
- **Improve `actionTestRPCs`**: pakai `pingRpc` (fetch JSON-RPC dengan timeout) → lebih stabil, tidak spam error "failed to detect network".
- **Provider init**: tidak lagi `send('eth_chainId')` paksa di awal → mengurangi error di RPC publik.
- **Gas estimation**: otomatis +20% buffer sebelum tx.

### Fixed
- Mint error: “Tidak ada fungsi mint yang cocok” → sekarang fallback ke No-ABI Blast.
- Error handling: decode custom revert message (`Error(string)`, `Panic(uint256)`).
- DRY_RUN mode lebih konsisten: simulasi tx dengan data encoded.
- Package.json disinkronisasi dengan ESM + ethers v6.
