import 'dotenv/config';
import fs from 'fs';
import readline from 'readline';
import { ethers } from 'ethers';

/* ====== Screen Utils (auto clear) ====== */
const CLEAR = '\x1b[2J\x1b[H';
function clearScreen(){ process.stdout.write(CLEAR); }
function hideCursor(){ process.stdout.write('\x1b[?25l'); }
function showCursor(){ process.stdout.write('\x1b[?25h'); }
process.on('exit', showCursor);
process.on('SIGINT', ()=>{ showCursor(); process.exit(0); });

/* ====== Watermark & Coloring ====== */
const WATERMARK = 'ITSMorvo';
const COLORS = [31,33,32,36,34,35]; // r,y,g,c,b,m
const color = (code, s)=>`\x1b[${code}m${s}\x1b[0m`;
const rainbow = (s)=> s.split('').map((ch,i)=>color(COLORS[i%COLORS.length], ch)).join('');
const line = (n=64,ch='─')=>ch.repeat(n);

/* ====== ASCII banner ====== */
const ASCII = [
  " _   _ _______ ______      ___    ___   ___ ",
  "| \\ | |__   __|  ____|    / _ \\  / _ \\ / _ \\",
  "|  \\| |  | |  | |__ _____/ /_\\ \\/ /_\\ \\/ /_\\ \\",
  "| . ` |  | |  |  __|_____|  _  ||  _  ||  _  |",
  "| |\\  |  | |  | |____    | | | || | | || | | |",
  "\\_| \\_/  |_|  |______|   \\_| |_/\\_| |_/\\_| |_/"
];
function printBanner(title='NFT AIO MENU'){
  console.log('');
  ASCII.forEach(r=>console.log(rainbow(r)));
  console.log(rainbow(`\n${title} `)+color(36, `(by ${WATERMARK})`));
  console.log(color(34, line(64)));
}
function printSubBanner(title='Select Chain'){
  console.log('');
  console.log(rainbow(`=== ${title} === `)+color(36, `by ${WATERMARK}`));
  console.log(color(34, line(48)));
}

/* ====== CHAIN LIST (lengkap, bisa override via chains.json) ====== */
const DEFAULT_CHAINS = [
  {
    name: 'Ethereum Mainnet',
    key: 'mainnet',
    rpc: [
      'https://rpc.ankr.com/eth',
      'https://eth.drpc.org',
      'https://1rpc.io/eth'
    ]
  },
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

/* ====== Utils ====== */
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q)=> new Promise(res=> rl.question(q, ans=> res(ans.trim())));
const yes = (s)=> /^y(es)?$/i.test(s || '');

function loadJSON(path, fallback){ if (!fs.existsSync(path)) return fallback; try{ return JSON.parse(fs.readFileSync(path,'utf8')); } catch { return fallback; } }
function saveJSON(path, obj){ fs.writeFileSync(path, JSON.stringify(obj,null,2)); }

function getAllChains(){
  const extra = loadJSON('./chains.json', []);
  const map = new Map(DEFAULT_CHAINS.map(c=>[c.key, c]));
  for (const c of extra) if (c?.key && c?.rpc) map.set(c.key, c); // override by key
  return Array.from(map.values());
}
function rpcFor(nameOrKey, override){
  if (override) return override;
  const all = getAllChains();
  const k = (nameOrKey||'').toLowerCase();
  return all.find(c=>c.key===k)?.rpc || null;
}
function fmtEth(wei){ return ethers.formatEther(wei ?? 0n); }

async function notify(text){
  const { TG_BOT_TOKEN, TG_CHAT_ID } = process.env;
  if (!TG_BOT_TOKEN || !TG_CHAT_ID) return;
  try{
    await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method:'POST',
      headers:{ 'content-type':'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text })
    });
  }catch{}
}

/* ====== RPC Checker / Selector ====== */
const rpcCache = new Map(); // key -> bestUrl (session)

/* helper timeout */
function timeoutAfter(ms){
  return new Promise((_,rej)=> setTimeout(()=>rej(new Error('timeout')), ms));
}

/** Ping satu RPC. Return { ok, url, ms, chainId } */
async function pingRpc(url, ms = 5000){   // TIMEOUT DIPERPANJANG 5s
  const start = Date.now();
  try{
    const p = new ethers.JsonRpcProvider(url);
    const chainIdHex = await Promise.race([ p.send('eth_chainId', []), timeoutAfter(ms) ]);
    const chainId = Number(chainIdHex);
    return { ok:true, url, ms: Date.now()-start, chainId };
  }catch(e){
    return { ok:false, url, ms: Infinity, error: e?.shortMessage ?? e?.message ?? String(e) };
  }
}

/** Dari string/array RPC, pilih yang tercepat (dengan cache) */
async function selectBestRpc(rpcSpec){
  const list = Array.isArray(rpcSpec) ? rpcSpec : [rpcSpec];
  const key = list.join('|');
  if (rpcCache.has(key)) return rpcCache.get(key);

  const results = await Promise.allSettled(list.map(u=> pingRpc(u)));
  const oks = results
    .filter(r=> r.status==='fulfilled' && r.value.ok)
    .map(r=> r.value)
    .sort((a,b)=> a.ms - b.ms);

  if (oks.length){
    rpcCache.set(key, oks[0].url);
    return oks[0].url;
  }
  rpcCache.set(key, list[0]);
  return list[0];
}

/* ====== Provider with fallback + best pick ====== */
async function getProvider(rpcUrl) {
  if (!rpcUrl) throw new Error('RPC URL tidak diketahui.');
  const first = await selectBestRpc(rpcUrl);
  const urls = Array.isArray(rpcUrl)
    ? [first, ...rpcUrl.filter(u=>u!==first)]
    : [first];

  let lastErr;
  for (const url of urls) {
    try {
      const p = new ethers.JsonRpcProvider(url);
      await p.send('eth_chainId', []);
      return p;
    } catch (e) {
      lastErr = e;
      console.log(color(33, `RPC gagal: ${url} → mencoba fallback lain...`));
    }
  }
  throw lastErr || new Error('Semua RPC gagal.');
}

async function getWalletByKey(pk, rpcUrl){
  const provider = await getProvider(rpcUrl);
  return new ethers.Wallet(pk, provider);
}
async function getWallet(rpcUrl){
  const { PRIVATE_KEY } = process.env;
  if (!PRIVATE_KEY) throw new Error('PRIVATE_KEY belum diisi di .env');
  return getWalletByKey(PRIVATE_KEY, rpcUrl);
}

/* ====== Contract helpers ====== */
const DEFAULT_FUNCS = ['mint','publicMint','mintPublic','safeMint','claim'];

function buildAbi(funcNames){
  const set = new Set();
  for (const fn of funcNames){
    set.add(`function ${fn}() payable`);
    set.add(`function ${fn}(uint256 quantity) payable`);
  }
  set.add('function saleActive() view returns (bool)');
  set.add('function price() view returns (uint256)');
  set.add('function mintPrice() view returns (uint256)');
  set.add('function cost() view returns (uint256)');
  return [...set];
}
async function smartPick(contract, fn, qty, overrides){
  try{ await contract[fn].staticCall(overrides); return { fn, withQty:false }; }catch{}
  try{ await contract[fn].staticCall(qty, overrides); return { fn, withQty:true }; }catch{}
  return null;
}
async function discoverPrice(contract){
  for (const f of ['price','mintPrice','cost']){
    if (typeof contract[f] === 'function'){
      try{ const v = await contract[f](); if (v > 0n) return v; }catch{}
    }
  }
  return null;
}
function calcValueWei({ valueEth, pricePerNftEth, qty }){
  if (valueEth != null && valueEth !== '') return ethers.parseEther(String(valueEth));
  if (pricePerNftEth != null && pricePerNftEth !== '') return ethers.parseEther(String(pricePerNftEth)) * BigInt(qty || 1);
  return 0n;
}
async function mintCore({ wallet, contractAddr, qty, valueWei, fnList }){
  const abi = buildAbi(fnList);
  const c = new ethers.Contract(contractAddr, abi, wallet);
  const fee = await wallet.provider.getFeeData();
  const overrides = (fee.maxFeePerGas || fee.maxPriorityFeePerGas)
    ? { value: valueWei, maxFeePerGas: fee.maxFeePerGas, maxPriorityFeePerGas: fee.maxPriorityFeePerGas }
    : { value: valueWei, gasPrice: fee.gasPrice };

  let picked = null;
  for (const fn of fnList){ picked = await smartPick(c, fn, qty, overrides); if (picked) break; }
  if (!picked) throw new Error('Tidak ada fungsi mint yang cocok.');

  try{
    const est = picked.withQty ? await c.estimateGas[picked.fn](qty, overrides)
                               : await c.estimateGas[picked.fn](overrides);
    overrides.gasLimit = (est * 120n) / 100n;
  }catch{}

  const dry = (process.env.DRY_RUN || 'false').toLowerCase() === 'true';
  if (dry) return { dryRun:true, hash:null, status:1 };

  const tx = picked.withQty ? await c[picked.fn](qty, overrides)
                            : await c[picked.fn](overrides);
  const rcpt = await tx.wait();
  return { dryRun:false, hash:tx.hash, status:rcpt.status, block:rcpt.blockNumber, fn:picked.fn, withQty:picked.withQty };
}

/* ====== Picker Chain (nomor + paging + clear) ====== */
async function pickChain(){
  const CHAINS = getAllChains();
  const PAGE = 12;
  let page = 0;

  while(true){
    clearScreen();
    const start = page * PAGE;
    const slice = CHAINS.slice(start, start + PAGE);

    printSubBanner('Select Chain');
    slice.forEach((c,i)=>{
      const idx = color(COLORS[i%COLORS.length], `${i+1}`);
      console.log(`${idx}) ${c.name}`);
    });

    const extraIdx = slice.length + 1;
    const nextIdx  = slice.length + 2;
    const prevIdx  = slice.length + 3;

    console.log(color(36, `${extraIdx}) Lainnya (manual RPC)`));
    if (start + PAGE < CHAINS.length) console.log(color(33, `${nextIdx}) Next Page ▶`));
    if (page > 0)                     console.log(color(33, `${prevIdx}) ◀ Prev Page`));

    const num = Number(await ask(color(35,'Nomor: ')));

    if (num >= 1 && num <= slice.length) {
      return { key: slice[num-1].key, rpc: slice[num-1].rpc };
    }
    if (num === extraIdx) {
      const manualKey = await ask('Nama chain (bebas): ');
      const manualRpc = await ask('RPC (kosongkan utk default): ');
      return { key: manualKey, rpc: manualRpc || null };
    }
    if (num === nextIdx && (start + PAGE) < CHAINS.length){ page++; continue; }
    if (num === prevIdx && page > 0){ page--; continue; }

    console.log(color(31,'Pilihan tidak dikenal. Coba lagi.'));
  }
}

/* ====== Actions ====== */
async function actionCheckBalance(){
  clearScreen();
  try {
    const { key: chain, rpc } = await pickChain();
    const url = rpc || rpcFor(chain);
    if (!url) {
      console.log('RPC untuk chain ini tidak ditemukan. Tambahkan di chains.json.');
      await ask('\n(Enter untuk kembali)');
      return;
    }
    const wallet = await getWallet(url);
    const [bal, net] = await Promise.all([
      wallet.provider.getBalance(wallet.address),
      wallet.provider.getNetwork()
    ]);
    console.log(`\nAlamat: ${wallet.address}\nChain: ${net.name} (${net.chainId})\nSaldo: ${fmtEth(bal)} native\n`);
  } catch (e) {
    console.log('\nGagal cek saldo.');
    console.log('Alasan:', e.shortMessage ?? e.message);
    console.log('\nTips: jalankan menu 9) Test RPCs atau isi RPC pribadi di chains.json');
  }
  await ask('\n(Enter untuk kembali)');
}

async function actionMintSingle(){
  clearScreen();
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

  try{
    const abiInfo = buildAbi(fnList);
    const cInfo = new ethers.Contract(contract, abiInfo, wallet);
    const [net, p] = await Promise.all([wallet.provider.getNetwork(), discoverPrice(cInfo)]);
    console.log(`\nChain: ${net.name} (${net.chainId})`);
    if (valueWei === 0n && p) console.log('Harga deteksi:', fmtEth(p), 'per NFT');
  }catch{}

  try{
    const res = await mintCore({ wallet, contractAddr: contract, qty, valueWei, fnList });
    if (res.dryRun){
      console.log('DRY_RUN=true → simulasi OK (tidak kirim tx).');
      await notify(`✅ [DRY] Mint OK di ${chain}\nKontrak: ${contract}\nWallet: ${wallet.address}`);
    }else{
      console.log(`Tx: ${res.hash}\nStatus: ${res.status ? 'BERHASIL' : 'GAGAL'} • block ${res.block}`);
      await notify(`✅ Mint ${res.status ? 'BERHASIL' : 'GAGAL'} di ${chain}\nFn: ${res.fn}\nTx: ${res.hash}`);
    }
  }catch(e){
    console.log('Error:', e.reason ?? e.shortMessage ?? e.message);
    await notify(`❌ Mint gagal di ${chain}\nAlasan: ${e.shortMessage ?? e.message}`);
  }
  await ask('\n(Enter untuk kembali)');
}

async function actionMintOmni(){
  clearScreen();
  const targets = loadJSON('./targets.json', []);
  if (!targets.length) return console.log('targets.json kosong.');
  console.log(`Menjalankan ${targets.length} target…`);
  for (const t of targets){
    try{
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
    }catch(e){
      console.log('Error target:', e.reason ?? e.shortMessage ?? e.message);
    }
  }
  await ask('\n(Enter untuk kembali)');
}

async function actionAddTarget(){
  clearScreen();
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
  await ask('\n(Enter untuk kembali)');
}

async function actionListTargets(){
  clearScreen();
  const targets = loadJSON('./targets.json', []);
  if (!targets.length) { console.log('targets.json kosong.'); await ask('\n(Enter untuk kembali)'); return; }
  console.log('\nDaftar target:');
  targets.forEach((t,i)=>{
    const price = (t.valueEth != null) ? `value=${t.valueEth}`
                : (t.pricePerNftEth != null) ? `ppn=${t.pricePerNftEth}` : 'value=0';
    const rpcTag = t.rpc ? ' • custom RPC' : '';
    console.log(`${i+1}) ${t.name} • ${t.contract} • qty=${t.qty ?? 1} • ${price}${rpcTag}`);
  });
  await ask('\n(Enter untuk kembali)');
}

async function actionDeleteTarget(){
  clearScreen();
  const targets = loadJSON('./targets.json', []);
  if (!targets.length) { console.log('targets.json kosong.'); await ask('\n(Enter untuk kembali)'); return; }
  await actionListTargets();
  const idx = Number(await ask('Hapus nomor: ')) - 1;
  if (idx < 0 || idx >= targets.length) { console.log('Nomor tidak valid.'); await ask('\n(Enter untuk kembali)'); return; }
  const sure = await ask(`Yakin hapus ${targets[idx].name}? (y/N): `);
  if (!yes(sure)) { console.log('Batal.'); await ask('\n(Enter untuk kembali)'); return; }
  targets.splice(idx,1);
  saveJSON('./targets.json', targets);
  console.log('Terhapus.');
  await ask('\n(Enter untuk kembali)');
}

async function actionGasNow(){
  clearScreen();
  try{
    const { key: chain, rpc } = await pickChain();
    const url = rpc || rpcFor(chain);
    const provider = await getProvider(url);
    const [net, fee] = await Promise.all([provider.getNetwork(), provider.getFeeData()]);
    console.log(`\nChain: ${net.name} (${net.chainId})`);
    if (fee.maxFeePerGas && fee.maxPriorityFeePerGas){
      console.log(`maxFeePerGas   : ${ethers.formatUnits(fee.maxFeePerGas,'gwei')} gwei`);
      console.log(`maxPriorityFee : ${ethers.formatUnits(fee.maxPriorityFeePerGas,'gwei')} gwei`);
    }else{
      console.log(`gasPrice       : ${ethers.formatUnits(fee.gasPrice ?? 0n,'gwei')} gwei`);
    }
  }catch(e){
    console.log('Gagal membaca gas:', e.shortMessage ?? e.message);
  }
  await ask('\n(Enter untuk kembali)');
}

/* ====== NEW: Scan & Pick Fastest RPCs ====== */
async function actionTestRPCs(){
  clearScreen();
  const CHAINS = getAllChains();
  console.log('Testing RPC endpoints… (timeout 5s tiap endpoint)\n');

  for (const c of CHAINS){
    const list = Array.isArray(c.rpc) ? c.rpc : [c.rpc];
    const results = await Promise.allSettled(list.map(u=> pingRpc(u)));
    const oks = results.filter(r=>r.status==='fulfilled' && r.value.ok).map(r=>r.value).sort((a,b)=>a.ms-b.ms);
    const fails = results.filter(r=>r.status==='fulfilled' && !r.value.ok).map(r=>r.value);

    if (oks.length){
      rpcCache.set(list.join('|'), oks[0].url);
      console.log(`${color(32,'✔')} ${c.name} → fastest ${color(36,oks[0].url)} (${oks[0].ms} ms)`);
    } else {
      console.log(`${color(31,'✖')} ${c.name} → no working RPC`);
    }
    if (fails.length){
      fails.slice(0,3).forEach(f=> console.log(`   ${color(33,'• fail')} ${f.url} (${f.error})`));
    }
  }
  console.log('\nSelesai. Cache RPC terbaik tersimpan untuk sesi ini.');
  await ask('\n(Enter untuk kembali)');
}

/* ====== Multi-wallet parallel ====== */
function loadMultiKeys(){
  const list = [];
  if (process.env.MULTI_PRIVATE_KEYS) list.push(...process.env.MULTI_PRIVATE_KEYS.split(',').map(s=>s.trim()).filter(Boolean));
  if (fs.existsSync('./wallets.txt')){
    const lines = fs.readFileSync('./wallets.txt','utf8').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    list.push(...lines);
  }
  return Array.from(new Set(list));
}

async function actionParallelMint(){
  clearScreen();
  const targets = loadJSON('./targets.json', []);
  if (!targets.length) { console.log('targets.json kosong.'); await ask('\n(Enter untuk kembali)'); return; }
  await actionListTargets();
  const idx = Number(await ask('Pilih target nomor: ')) - 1;
  if (idx < 0 || idx >= targets.length) { console.log('Nomor tidak valid.'); await ask('\n(Enter untuk kembali)'); return; }
  const t = targets[idx];

  const keys = loadMultiKeys();
  if (!keys.length) { console.log('Tidak ada private key untuk multi-wallet.'); await ask('\n(Enter untuk kembali)'); return; }

  const url = rpcFor(t.name || t.chain, t.rpc);
  const fnList = t.functionCandidates?.length ? t.functionCandidates : DEFAULT_FUNCS;
  const qty = BigInt(String(t.qty ?? 1));
  const valueWei = calcValueWei({ valueEth: t.valueEth, pricePerNftEth: t.pricePerNftEth, qty: t.qty });

  console.log(`Menjalankan paralel ${keys.length} wallet pada ${t.name} ${t.contract}`);
  const results = await Promise.allSettled(keys.map(async (pk,i)=>{
    const wallet = await getWalletByKey(pk, url);
    await new Promise(r=>setTimeout(r, i*250));
    return mintCore({ wallet, contractAddr: t.contract, qty, valueWei, fnList });
  }));

  results.forEach((r,i)=>{
    if (r.status === 'fulfilled'){
      const v = r.value;
      console.log(`#${i+1} ${keys[i].slice(0,10)}… ⇒ ${v.dryRun?'[DRY]':v.status?'OK':'FAIL'} ${v.hash ?? ''}`);
    }else{
      console.log(`#${i+1} error:`, r.reason?.message ?? r.reason);
    }
  });
  await ask('\n(Enter untuk kembali)');
}

/* ====== Menu Utama ====== */
async function mainMenu(){
  clearScreen();
  printBanner('NFT AIO MENU');

  console.log(color(32,'1) ')+'Cek saldo');
  console.log(color(33,'2) ')+'Mint 1 kontrak (manual)');
  console.log(color(36,'3) ')+'Mint multi-chain (targets.json)');
  console.log(color(34,'4) ')+'Tambah target');
  console.log(color(35,'5) ')+'Lihat target');
  console.log(color(31,'6) ')+'Hapus target');
  console.log(color(33,'7) ')+'Cek gas sekarang');
  console.log(color(32,'8) ')+'Mint paralel multi-wallet');
  console.log(color(36,'9) ')+'Test RPCs (scan & pick fastest)');
  console.log(color(36,'0) ')+'Keluar');

  const c = await ask(color(35,'Pilih nomor: '));
  if (!/^[0-9]$/.test(c)) {                 // VALIDASI INPUT
    console.log(color(31,'Masukan tidak valid. Pilih angka di daftar.'));
    await ask('\n(Enter untuk kembali)');
    return mainMenu();
  }

  switch(c){
    case '1': await actionCheckBalance(); break;
    case '2': await actionMintSingle(); break;
    case '3': await actionMintOmni(); break;
    case '4': await actionAddTarget(); break;
    case '5': await actionListTargets(); break;
    case '6': await actionDeleteTarget(); break;
    case '7': await actionGasNow(); break;
    case '8': await actionParallelMint(); break;
    case '9': await actionTestRPCs(); break;
    case '0': rl.close(); return;
    default: console.log(color(31,'Pilihan tidak dikenal.'));
  }
  return mainMenu();
}

/* ====== Start ====== */
clearScreen();
hideCursor();
mainMenu().catch(e => { console.error('Fatal:', e); showCursor(); rl.close(); });
