import 'dotenv/config';
import fs from 'fs';
import readline from 'readline';
import { ethers } from 'ethers';

/* =========================
   CHAIN LIST (LENGKAP)
   - Kamu bisa menambah/override via chains.json
   - Format chains.json: [{ "name":"Nama", "key":"unik", "rpc":"https://..." }, ...]
   ========================= */
const DEFAULT_CHAINS = [
  // Ethereum + testnet
  { name: 'Ethereum Mainnet', key: 'mainnet',  rpc: 'https://cloudflare-eth.com' },
  { name: 'Ethereum Sepolia', key: 'sepolia',  rpc: 'https://rpc.sepolia.org' },

  // Major L2s
  { name: 'Arbitrum One',     key: 'arbitrum', rpc: 'https://arb1.arbitrum.io/rpc' },
  { name: 'Arbitrum Nova',    key: 'arbnova',  rpc: 'https://nova.arbitrum.io/rpc' },
  { name: 'Optimism',         key: 'optimism', rpc: 'https://mainnet.optimism.io' },
  { name: 'Base',             key: 'base',     rpc: 'https://mainnet.base.org' },
  { name: 'Blast',            key: 'blast',    rpc: 'https://rpc.blast.io' },
  { name: 'Zora',             key: 'zora',     rpc: 'https://rpc.zora.energy' },
  { name: 'Mode',             key: 'mode',     rpc: 'https://mainnet.mode.network' },
  { name: 'Taiko',            key: 'taiko',    rpc: 'https://rpc.mainnet.taiko.xyz' },
  { name: 'Linea',            key: 'linea',    rpc: 'https://rpc.linea.build' },
  { name: 'Scroll',           key: 'scroll',   rpc: 'https://rpc.scroll.io' },
  { name: 'Mantle',           key: 'mantle',   rpc: 'https://rpc.mantle.xyz' },

  // ZK / alt L2
  { name: 'zkSync Era',       key: 'zksync',   rpc: 'https://mainnet.era.zksync.io' },
  { name: 'Polygon zkEVM',    key: 'zkevm',    rpc: 'https://zkevm-rpc.com' },

  // Popular alt-L1 / sidechains
  { name: 'Polygon PoS',      key: 'polygon',  rpc: 'https://rpc.ankr.com/polygon' },
  { name: 'BNB Smart Chain',  key: 'bsc',      rpc: 'https://bsc-dataseed1.bnbchain.org' },
  { name: 'opBNB',            key: 'opbnb',    rpc: 'https://opbnb-mainnet-rpc.bnbchain.org' },
  { name: 'Avalanche C-Chain',key: 'avalanche',rpc: 'https://api.avax.network/ext/bc/C/rpc' },
  { name: 'Fantom Opera',     key: 'fantom',   rpc: 'https://rpc.fantom.network' },
  { name: 'Gnosis',           key: 'gnosis',   rpc: 'https://rpc.gnosischain.com' },
  { name: 'Celo',             key: 'celo',     rpc: 'https://forno.celo.org' },
  { name: 'Cronos',           key: 'cronos',   rpc: 'https://evm.cronos.org' },
  { name: 'Moonbeam',         key: 'moonbeam', rpc: 'https://rpc.api.moonbeam.network' },
  { name: 'Moonriver',        key: 'moonriver',rpc: 'https://rpc.api.moonriver.moonbeam.network' },
  { name: 'Kava EVM',         key: 'kava',     rpc: 'https://evm.kava.io' },
  { name: 'Metis Andromeda',  key: 'metis',    rpc: 'https://andromeda.metis.io' },
  { name: 'Telos EVM',        key: 'telos',    rpc: 'https://mainnet.telos.net/evm' },
  { name: 'Fuse',             key: 'fuse',     rpc: 'https://rpc.fuse.io' },
  { name: 'Aurora',           key: 'aurora',   rpc: 'https://mainnet.aurora.dev' },
  { name: 'OKX Chain (OKTC)', key: 'oktc',     rpc: 'https://exchainrpc.okex.org' },
  { name: 'Boba',             key: 'boba',     rpc: 'https://mainnet.boba.network' },
  { name: 'Rootstock (RSK)',  key: 'rsk',      rpc: 'https://public-node.rsk.co' },
  { name: 'Klaytn',           key: 'klaytn',   rpc: 'https://klaytn.blockpi.network/v1/rpc/public' },
  { name: 'Astar EVM',        key: 'astar',    rpc: 'https://evm.astar.network' },
  { name: 'Canto',            key: 'canto',    rpc: 'https://canto.gravitychain.io:8545' },
  { name: 'Core DAO',         key: 'core',     rpc: 'https://rpc.coredao.org' },
  { name: 'Shimmer EVM',      key: 'shimmer',  rpc: 'https://json-rpc.evm.shimmer.network' },
  { name: 'Cronos zkEVM',     key: 'cronosz',  rpc: 'https://evm-zkevm.cronos.org' },
  { name: 'Palm',             key: 'palm',     rpc: 'https://palm-mainnet.public.blastapi.io' }
];

/* =========================
   UTIL & CORE
   ========================= */
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, ans => res(ans.trim())));
const yes = (s) => /^y(es)?$/i.test(s || '');

function loadJSON(path, fallback) { if (!fs.existsSync(path)) return fallback; try { return JSON.parse(fs.readFileSync(path,'utf8')); } catch { return fallback; } }
function saveJSON(path, obj) { fs.writeFileSync(path, JSON.stringify(obj, null, 2)); }

function getAllChains() {
  const extra = loadJSON('./chains.json', []);
  // dedupe by key (extra overrides default with same key)
  const map = new Map(DEFAULT_CHAINS.map(c => [c.key, c]));
  for (const c of extra) if (c?.key && c?.rpc) map.set(c.key, c);
  return Array.from(map.values());
}

function rpcFor(nameOrKey, override) {
  if (override) return override;
  const all = getAllChains();
  const k = (nameOrKey || '').toLowerCase();
  return all.find(c => c.key === k)?.rpc || null;
}

function fmtEth(wei) { return ethers.formatEther(wei ?? 0n); }

async function notify(text) {
  const { TG_BOT_TOKEN, TG_CHAT_ID } = process.env;
  if (!TG_BOT_TOKEN || !TG_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text })
    });
  } catch {}
}

/* =========================
   PICK CHAIN (dengan nomor, auto-paging)
   ========================= */
async function pickChain() {
  const CHAINS = getAllChains();
  const PAGE = 12; // tampil 12 per halaman biar enak di Termux
  let page = 0;

  while (true) {
    const start = page * PAGE;
    const slice = CHAINS.slice(start, start + PAGE);
    console.log('\nPilih Chain:');
    slice.forEach((c, i) => console.log(`${i + 1}) ${c.name}`));
    const extraIdx = slice.length + 1;
    const nextIdx  = slice.length + 2;
    const prevIdx  = slice.length + 3;
    console.log(`${extraIdx}) Lainnya (isi manual)`);
    if (start + PAGE < CHAINS.length) console.log(`${nextIdx}) Halaman berikutnya ▶`);
    if (page > 0)                     console.log(`${prevIdx}) ◀ Halaman sebelumnya`);

    const ans = await ask('Nomor: ');
    const num = Number(ans);

    if (num >= 1 && num <= slice.length) {
      return { key: slice[num - 1].key, rpc: slice[num - 1].rpc };
    }

    if (num === extraIdx) {
      const manualKey = await ask('Nama chain (bebas): ');
      const manualRpc = await ask('RPC (kosongkan utk pakai default bawaan script): ');
      return { key: manualKey, rpc: manualRpc || null };
    }

    if (num === nextIdx && (start + PAGE) < CHAINS.length) { page++; continue; }
    if (num === prevIdx && page > 0) { page--; continue; }

    console.log('Pilihan tidak dikenal. Coba lagi.');
  }
}

/* =========================
   ETHERS & MINT CORE
   ========================= */
const DEFAULT_FUNCS = ['mint','publicMint','mintPublic','safeMint','claim'];

async function getProvider(rpcUrl) {
  if (!rpcUrl) throw new Error('RPC URL tidak diketahui.');
  return new ethers.JsonRpcProvider(rpcUrl);
}
async function getWalletByKey(pk, rpcUrl) {
  const provider = await getProvider(rpcUrl);
  return new ethers.Wallet(pk, provider);
}
async function getWallet(rpcUrl) {
  const { PRIVATE_KEY } = process.env;
  if (!PRIVATE_KEY) throw new Error('PRIVATE_KEY belum diisi di .env');
  return getWalletByKey(PRIVATE_KEY, rpcUrl);
}

function buildAbi(funcNames) {
  const set = new Set();
  for (const fn of funcNames) {
    set.add(`function ${fn}() payable`);
    set.add(`function ${fn}(uint256 quantity) payable`);
  }
  set.add('function saleActive() view returns (bool)');
  set.add('function price() view returns (uint256)');
  set.add('function mintPrice() view returns (uint256)');
  set.add('function cost() view returns (uint256)');
  return [...set];
}

async function smartPick(contract, fn, qty, overrides) {
  try { await contract[fn].staticCall(overrides); return { fn, withQty:false }; } catch {}
  try { await contract[fn].staticCall(qty, overrides); return { fn, withQty:true }; } catch {}
  return null;
}

async function discoverPrice(contract) {
  for (const f of ['price','mintPrice','cost']) {
    if (typeof contract[f] === 'function') {
      try { const v = await contract[f](); if (v > 0n) return v; } catch {}
    }
  }
  return null;
}

function calcValueWei({ valueEth, pricePerNftEth, qty }) {
  if (valueEth != null && valueEth !== '') return ethers.parseEther(String(valueEth));
  if (pricePerNftEth != null && pricePerNftEth !== '') return ethers.parseEther(String(pricePerNftEth)) * BigInt(qty || 1);
  return 0n;
}

async function mintCore({ wallet, contractAddr, qty, valueWei, fnList }) {
  const abi = buildAbi(fnList);
  const c = new ethers.Contract(contractAddr, abi, wallet);
  const fee = await wallet.provider.getFeeData();
  const overrides = (fee.maxFeePerGas || fee.maxPriorityFeePerGas)
    ? { value: valueWei, maxFeePerGas: fee.maxFeePerGas, maxPriorityFeePerGas: fee.maxPriorityFeePerGas }
    : { value: valueWei, gasPrice: fee.gasPrice };

  // pilih fungsi
  let picked = null;
  for (const fn of fnList) { picked = await smartPick(c, fn, qty, overrides); if (picked) break; }
  if (!picked) throw new Error('Tidak ada fungsi mint yang cocok.');

  // estimasi gas + buffer
  try {
    const est = picked.withQty ? await c.estimateGas[picked.fn](qty, overrides)
                               : await c.estimateGas[picked.fn](overrides);
    overrides.gasLimit = (est * 120n) / 100n;
  } catch {}

  const dry = (process.env.DRY_RUN || 'false').toLowerCase() === 'true';
  if (dry) return { dryRun: true, hash: null, status: 1 };

  const tx = picked.withQty ? await c[picked.fn](qty, overrides)
                            : await c[picked.fn](overrides);
  const rcpt = await tx.wait();
  return { dryRun: false, hash: tx.hash, status: rcpt.status, block: rcpt.blockNumber, fn: picked.fn, withQty: picked.withQty };
}

/* =========================
   MENU ACTIONS
   ========================= */
async function actionCheckBalance() {
  const { key: chain, rpc } = await pickChain();
  const url = rpc || rpcFor(chain);
  const wallet = await getWallet(url);
  const [bal, net] = await Promise.all([wallet.provider.getBalance(wallet.address), wallet.provider.getNetwork()]);
  console.log(`\nAlamat: ${wallet.address}\nChain: ${net.name} (${net.chainId})\nSaldo: ${fmtEth(bal)} native\n`);
}

async function actionMintSingle() {
  const { key: chain, rpc } = await pickChain();
  const contract = await ask('Alamat kontrak: ');
  const qtyNum = Number(await ask('Qty (default 1): ')) || 1;
  const valueEth = await ask('Total value ETH (default 0): ');
  const url = rpc || rpcFor(chain);
  const wallet = await getWallet(url);

  const fnListRaw = await ask('Coba fungsi mint (pisahkan koma, kosong=default): ');
  const fnList = fnListRaw ? fnListRaw.split(',').map(s=>s.trim()).filter(Boolean) : DEFAULT_FUNCS;
  const qty = BigInt(qtyNum);
  const valueWei = calcValueWei({ valueEth, qty: qtyNum });

  try {
    const abiInfo = buildAbi(fnList);
    const cInfo = new ethers.Contract(contract, abiInfo, wallet);
    const [net, p] = await Promise.all([wallet.provider.getNetwork(), discoverPrice(cInfo)]);
    console.log(`\nChain: ${net.name} (${net.chainId})`);
    if (valueWei === 0n && p) console.log('Harga deteksi:', fmtEth(p), 'per NFT');
  } catch {}

  try {
    const res = await mintCore({ wallet, contractAddr: contract, qty, valueWei, fnList });
    if (res.dryRun) {
      console.log('DRY_RUN=true → simulasi OK (tidak kirim tx).');
      await notify(`✅ [DRY] Mint OK di ${chain}\nKontrak: ${contract}\nWallet: ${wallet.address}`);
    } else {
      console.log(`Tx: ${res.hash}\nStatus: ${res.status ? 'BERHASIL' : 'GAGAL'} • block ${res.block}`);
      await notify(`✅ Mint ${res.status ? 'BERHASIL' : 'GAGAL'} di ${chain}\nFn: ${res.fn}\nTx: ${res.hash}`);
    }
  } catch (e) {
    console.log('Error:', e.reason ?? e.shortMessage ?? e.message);
    await notify(`❌ Mint gagal di ${chain}\nAlasan: ${e.shortMessage ?? e.message}`);
  }
}

async function actionMintOmni() {
  const targets = loadJSON('./targets.json', []);
  if (!targets.length) return console.log('targets.json kosong.');
  console.log(`Menjalankan ${targets.length} target…`);
  for (const t of targets) {
    try {
      const url = rpcFor(t.name || t.chain, t.rpc);
      const wallet = await getWallet(url);
      const fnList = t.functionCandidates?.length ? t.functionCandidates : DEFAULT_FUNCS;
      const qty = BigInt(String(t.qty ?? 1));
      const valueWei = calcValueWei({ valueEth: t.valueEth, pricePerNftEth: t.pricePerNftEth, qty: t.qty });
      const net = await wallet.provider.getNetwork();
      console.log(`\n=== ${t.name || net.name} (${net.chainId}) ===`);
      const res = await mintCore({ wallet, contractAddr: t.contract, qty, valueWei, fnList });
      if (res.dryRun) console.log('DRY_RUN=true → simulasi OK (skip kirim).');
      else console.log(`Tx: ${res.hash} • ${res.status ? 'BERHASIL' : 'GAGAL'}`);
    } catch (e) {
      console.log('Error target:', e.reason ?? e.shortMessage ?? e.message);
    }
  }
}

async function actionAddTarget() {
  const { key: chainKey, rpc } = await pickChain();
  const contract = await ask('Alamat kontrak: ');
  const qty = Number(await ask('Qty (default 1): ')) || 1;
  const val = await ask('Total value (ETH) untuk semua qty (enter utk skip): ');
  const ppn = val ? '' : await ask('pricePerNftEth (enter utk 0 / bila pakai total di atas): ');
  const fns = await ask('functionCandidates (pisahkan koma, kosong=default): ');

  const targets = loadJSON('./targets.json', []);
  targets.push({
    name: chainKey,
    contract,
    qty,
    valueEth: val || undefined,
    pricePerNftEth: ppn || undefined,
    rpc: rpc || undefined,
    functionCandidates: fns ? fns.split(',').map(s => s.trim()).filter(Boolean) : undefined
  });
  saveJSON('./targets.json', targets);
  console.log('Target ditambahkan.');
}

async function actionListTargets() {
  const targets = loadJSON('./targets.json', []);
  if (!targets.length) return console.log('targets.json kosong.');
  console.log('\nDaftar target:');
  targets.forEach((t, i) => {
    const price = (t.valueEth != null) ? `value=${t.valueEth}` :
                  (t.pricePerNftEth != null) ? `ppn=${t.pricePerNftEth}` : 'value=0';
    const rpcTag = t.rpc ? ' • custom RPC' : '';
    console.log(`${i+1}) ${t.name} • ${t.contract} • qty=${t.qty ?? 1} • ${price}${rpcTag}`);
  });
}

async function actionDeleteTarget() {
  const targets = loadJSON('./targets.json', []);
  if (!targets.length) return console.log('targets.json kosong.');
  await actionListTargets();
  const idx = Number(await ask('Hapus nomor: ')) - 1;
  if (idx < 0 || idx >= targets.length) return console.log('Nomor tidak valid.');
  const sure = await ask(`Yakin hapus ${targets[idx].name}? (y/N): `);
  if (!yes(sure)) return console.log('Batal.');
  targets.splice(idx, 1);
  saveJSON('./targets.json', targets);
  console.log('Terhapus.');
}

async function actionGasNow() {
  const { key: chain, rpc } = await pickChain();
  const url = rpc || rpcFor(chain);
  const provider = await getProvider(url);
  const [net, fee] = await Promise.all([provider.getNetwork(), provider.getFeeData()]);
  console.log(`\nChain: ${net.name} (${net.chainId})`);
  if (fee.maxFeePerGas && fee.maxPriorityFeePerGas) {
    console.log(`maxFeePerGas   : ${ethers.formatUnits(fee.maxFeePerGas, 'gwei')} gwei`);
    console.log(`maxPriorityFee : ${ethers.formatUnits(fee.maxPriorityFeePerGas, 'gwei')} gwei`);
  } else {
    console.log(`gasPrice       : ${ethers.formatUnits(fee.gasPrice ?? 0n, 'gwei')} gwei`);
  }
}

// Multi-wallet paralel
function loadMultiKeys() {
  const list = [];
  if (process.env.MULTI_PRIVATE_KEYS) list.push(...process.env.MULTI_PRIVATE_KEYS.split(',').map(s=>s.trim()).filter(Boolean));
  if (fs.existsSync('./wallets.txt')) {
    const lines = fs.readFileSync('./wallets.txt','utf8').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    list.push(...lines);
  }
  return Array.from(new Set(list));
}

async function actionParallelMint() {
  const targets = loadJSON('./targets.json', []);
  if (!targets.length) return console.log('targets.json kosong.');
  await actionListTargets();
  const idx = Number(await ask('Pilih target nomor: ')) - 1;
  if (idx < 0 || idx >= targets.length) return console.log('Nomor tidak valid.');
  const t = targets[idx];

  const keys = loadMultiKeys();
  if (!keys.length) return console.log('Tidak ada private key untuk multi-wallet.');

  const url = rpcFor(t.name || t.chain, t.rpc);
  const fnList = t.functionCandidates?.length ? t.functionCandidates : DEFAULT_FUNCS;
  const qty = BigInt(String(t.qty ?? 1));
  const valueWei = calcValueWei({ valueEth: t.valueEth, pricePerNftEth: t.pricePerNftEth, qty: t.qty });

  console.log(`Menjalankan paralel ${keys.length} wallet pada ${t.name} ${t.contract}`);
  const results = await Promise.allSettled(keys.map(async (pk, i) => {
    const wallet = await getWalletByKey(pk, url);
    await new Promise(r => setTimeout(r, i * 250)); // stagger biar nonce/fee beda
    return mintCore({ wallet, contractAddr: t.contract, qty, valueWei, fnList });
  }));

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      const v = r.value;
      console.log(`#${i+1} ${keys[i].slice(0,10)}… ⇒ ${v.dryRun?'[DRY]':v.status?'OK':'FAIL'} ${v.hash ?? ''}`);
    } else {
      console.log(`#${i+1} error:`, r.reason?.message ?? r.reason);
    }
  });
}

/* =========================
   MENU UTAMA
   ========================= */
async function mainMenu() {
  console.log('\n=== NFT AIO MENU ===');
  console.log('1) Cek saldo');
  console.log('2) Mint 1 kontrak (manual)');
  console.log('3) Mint multi-chain (targets.json)');
  console.log('4) Tambah target');
  console.log('5) Lihat target');
  console.log('6) Hapus target');
  console.log('7) Cek gas sekarang');
  console.log('8) Mint paralel multi-wallet');
  console.log('0) Keluar');
  const c = await ask('Pilih nomor: ');
  switch (c) {
    case '1': await actionCheckBalance(); break;
    case '2': await actionMintSingle(); break;
    case '3': await actionMintOmni(); break;
    case '4': await actionAddTarget(); break;
    case '5': await actionListTargets(); break;
    case '6': await actionDeleteTarget(); break;
    case '7': await actionGasNow(); break;
    case '8': await actionParallelMint(); break;
    case '0': rl.close(); return;
    default: console.log('Pilihan tidak dikenal.');
  }
  return mainMenu();
}

mainMenu().catch(e => { console.error('Fatal:', e); rl.close(); });
