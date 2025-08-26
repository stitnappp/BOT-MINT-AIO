import 'dotenv/config';
import fs from 'fs';
import readline from 'readline';
import { ethers } from 'ethers';

/* ===== Terminal helpers ===== */
const CLEAR = '\x1b[2J\x1b[H';
const hideCursor = () => process.stdout.write('\x1b[?25l');
const showCursor  = () => process.stdout.write('\x1b[?25h');
const clearScreen = () => process.stdout.write(CLEAR);
process.on('exit', showCursor);
process.on('SIGINT', () => { showCursor(); process.exit(0); });

/* ===== Colors & Banner ===== */
const WATERMARK = 'ITSMorvo';
const COLORS = [31,33,32,36,34,35];
const color = (c,s)=>`\x1b[${c}m${s}\x1b[0m`;
const rainbow = s => s.split('').map((ch,i)=>color(COLORS[i%COLORS.length],ch)).join('');
const line = (n=64,ch='─')=>ch.repeat(n);
const ASCII = [
  "  _____ _____ _____ __  __            _     ",
  " |_   _|_   _| ____|  \\/  | ___  _ __| | __ ",
  "   | |   | | |  _| | |\\/| |/ _ \\| '__| |/ / ",
  "   | |   | | | |___| |  | | (_) | |  |   <  ",
  "   |_|   |_| |_____|_|  |_|\\___/|_|  |_|\\_\\ ",
  "                                            ",
  "                 ITSMorvo                   "
];

/* ===== ENV ===== */
const ALCHEMY_KEY = process.env.ALCHEMY_KEY || '';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const DRY_RUN = String(process.env.DRY_RUN||'false').toLowerCase()==='true';

function warnStartup(){
  if (!ALCHEMY_KEY) console.log(color(33,'⚠ Alchemy disabled: ALCHEMY_KEY kosong. Pakai RPC publik.'));
  else              console.log(color(32,'✔ Alchemy enabled (pakai .env)'));
  if (!PRIVATE_KEY) console.log(color(31,'❌ PRIVATE_KEY kosong. Menu mint/cek saldo tidak jalan.'));
}
const alchemyLabel = ()=> ALCHEMY_KEY ? color(32,'[Alchemy: ON]') : color(33,'[Alchemy: OFF]');
function printBanner(title='NFT AIO MENU'){
  console.log(''); ASCII.forEach(r=>console.log(rainbow(r)));
  console.log(rainbow(`\n${title} `)+color(36,`(by ${WATERMARK}) `)+alchemyLabel());
  console.log(color(34,line(64)));
}
function printSub(title){ console.log(''); console.log(rainbow(`=== ${title} === `)+color(36,`by ${WATERMARK}`)); console.log(color(34,line(48))); }

/* ===== Readline & utils ===== */
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res=>rl.question(q,a=>res((a||'').trim())));
const yes = s => /^y(es)?$/i.test(s||'');
const fmtEth = v => ethers.formatEther(v ?? 0n);
const loadJSON = (p,f=[]) => fs.existsSync(p) ? (()=>{try{return JSON.parse(fs.readFileSync(p,'utf8'));}catch{return f;}})() : f;
const saveJSON = (p,o) => fs.writeFileSync(p, JSON.stringify(o,null,2));

/* ===== Alchemy mapping (host name) ===== */
const ALCHEMY_HOSTS = {
  mainnet:'eth-mainnet',
  sepolia:'eth-sepolia',
  arbitrum:'arb-mainnet',
  optimism:'opt-mainnet',
  base:'base-mainnet',
  polygon:'polygon-mainnet',
  linea:'linea-mainnet'
};
const aUrl = k => ALCHEMY_KEY && ALCHEMY_HOSTS[k] ? `https://${ALCHEMY_HOSTS[k]}.g.alchemy.com/v2/${ALCHEMY_KEY}` : null;
const rpcList = (k, pubs=[]) => { const a=aUrl(k); return a?[a,...pubs]:pubs; };

/* ===== DEFAULT CHAINS (banyak + fallback RPC publik) ===== */
const DEFAULT_CHAINS = [
  { name:'Ethereum Mainnet',   key:'mainnet',   rpc: rpcList('mainnet',  ['https://eth.drpc.org','https://1rpc.io/eth','https://rpc.ankr.com/eth']) },
  { name:'Ethereum Sepolia',   key:'sepolia',   rpc: rpcList('sepolia',  ['https://rpc.sepolia.org','https://1rpc.io/sepolia']) },
  { name:'Arbitrum One',       key:'arbitrum',  rpc: rpcList('arbitrum', ['https://arb1.arbitrum.io/rpc','https://1rpc.io/arb']) },
  { name:'Optimism',           key:'optimism',  rpc: rpcList('optimism', ['https://mainnet.optimism.io','https://1rpc.io/op']) },
  { name:'Base',               key:'base',      rpc: rpcList('base',     ['https://mainnet.base.org','https://1rpc.io/base']) },
  { name:'Polygon PoS',        key:'polygon',   rpc: rpcList('polygon',  ['https://polygon-rpc.com','https://1rpc.io/poly']) },
  { name:'Linea',              key:'linea',     rpc: rpcList('linea',    ['https://rpc.linea.build']) },

  { name:'zkSync Era',         key:'zksync',    rpc:['https://mainnet.era.zksync.io','https://1rpc.io/zksync2'] },
  { name:'Polygon zkEVM',      key:'zkevm',     rpc:['https://zkevm-rpc.com','https://1rpc.io/pzkevm'] },
  { name:'Scroll',             key:'scroll',    rpc:['https://rpc.scroll.io','https://1rpc.io/scroll'] },

  { name:'BNB Smart Chain',    key:'bsc',       rpc:['https://bsc-dataseed.binance.org','https://rpc.ankr.com/bsc'] },
  { name:'Avalanche C-Chain',  key:'avalanche', rpc:['https://api.avax.network/ext/bc/C/rpc','https://1rpc.io/avax/c'] },
  { name:'Fantom Opera',       key:'fantom',    rpc:['https://rpc.fantom.network','https://1rpc.io/ftm'] },
  { name:'Gnosis Chain',       key:'gnosis',    rpc:['https://rpc.gnosischain.com','https://1rpc.io/gnosis'] },
  { name:'Celo',               key:'celo',      rpc:['https://forno.celo.org','https://1rpc.io/celo'] },
  { name:'Cronos',             key:'cronos',    rpc:['https://evm.cronos.org','https://cronos-evm.publicnode.com'] },
  { name:'Kava EVM',           key:'kava',      rpc:['https://evm.kava.io','https://evm.data.kava.io'] },
  { name:'Aurora',             key:'aurora',    rpc:['https://mainnet.aurora.dev','https://1rpc.io/aurora'] },
  { name:'Moonbeam',           key:'moonbeam',  rpc:['https://rpc.api.moonbeam.network','https://1rpc.io/glmr'] },
  { name:'Moonriver',          key:'moonriver', rpc:['https://rpc.api.moonriver.moonbeam.network','https://1rpc.io/movr'] },

  { name:'Arbitrum Nova',      key:'arbnova',   rpc:['https://nova.arbitrum.io/rpc','https://1rpc.io/arb/nova'] },
  { name:'Blast',              key:'blast',     rpc:['https://rpc.blast.io','https://1rpc.io/blast'] },
  { name:'Zora',               key:'zora',      rpc:['https://rpc.zora.energy','https://1rpc.io/zora'] },
  { name:'Mode',               key:'mode',      rpc:['https://mainnet.mode.network','https://1rpc.io/mode'] },
  { name:'Taiko',              key:'taiko',     rpc:['https://rpc.mainnet.taiko.xyz','https://1rpc.io/taiko'] },

  // Testnets
  { name:'Base Sepolia',       key:'base-sepolia', rpc:['https://sepolia.base.org','https://1rpc.io/base/sepolia'] },
  { name:'Optimism Sepolia',   key:'op-sepolia',   rpc:['https://sepolia.optimism.io'] },
  { name:'Arbitrum Sepolia',   key:'arb-sepolia',  rpc:['https://sepolia-rollup.arbitrum.io/rpc'] },
  { name:'Polygon Amoy',       key:'amoy',         rpc:['https://rpc-amoy.polygon.technology'] },
  { name:'Scroll Sepolia',     key:'scroll-sepolia', rpc:['https://sepolia-rpc.scroll.io'] },
  { name:'Linea Sepolia',      key:'linea-sepolia',  rpc:['https://rpc.sepolia.linea.build'] },
  { name:'Blast Sepolia',      key:'blast-sepolia',  rpc:['https://sepolia.blast.io'] },
  { name:'Zora Sepolia',       key:'zora-sepolia',   rpc:['https://sepolia.rpc.zora.energy'] },
  { name:'Mode Sepolia',       key:'mode-sepolia',   rpc:['https://sepolia.mode.network'] },
  { name:'Taiko Hekla',        key:'taiko-hekla',    rpc:['https://hekla.taiko.xyz'] },

  { name:'Monad Testnet',      key:'monadtest',  rpc:['https://testnet-rpc.monad.xyz'] }
];

/* ===== RPC Ping helper (timeout) ===== */
async function pingRpc(url, timeoutMs = 3000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort('timeout'), timeoutMs);
  const started = Date.now();
  try {
    const r = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] })
    });
    const ms = Date.now() - started;
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    if (!j || !j.result) throw new Error('Bad JSON-RPC');
    return { ok: true, ms, chainIdHex: j.result };
  } catch (e) {
    return { ok: false, err: e.message || String(e) };
  } finally {
    clearTimeout(t);
  }
}

/* ===== Chain utils ===== */
const getAllChains = () => {
  const extra = loadJSON('./chains.json', []);
  const map = new Map(DEFAULT_CHAINS.map(c=>[c.key,c]));
  for (const c of extra) if (c?.key&&c?.rpc) map.set(c.key,c);
  return [...map.values()];
};
const rpcFor = (keyOrName, override) => override || (getAllChains().find(c=>c.key===(keyOrName||'').toLowerCase())?.rpc);

async function getProvider(rpcUrl){
  const u = Array.isArray(rpcUrl)?rpcUrl[0]:rpcUrl;
  // Jangan paksa call saat init; biarkan ethers resolve saat getNetwork() dipanggil.
  return new ethers.JsonRpcProvider(u);
}
async function getWallet(rpcUrl){
  if (!PRIVATE_KEY) throw new Error('PRIVATE_KEY belum diisi');
  const p = await getProvider(rpcUrl);
  return new ethers.Wallet(PRIVATE_KEY, p);
}
async function getWalletByKey(pk, rpcUrl){
  const p = await getProvider(rpcUrl);
  return new ethers.Wallet(pk, p);
}

/* ===== Explorers & ABI fetch ===== */
const EXPLORERS = {
  mainnet : { base:'https://api.etherscan.io/api',            env:'ETHERSCAN_API_KEY' },
  sepolia : { base:'https://api-sepolia.etherscan.io/api',    env:'ETHERSCAN_API_KEY' },
  arbitrum: { base:'https://api.arbiscan.io/api',             env:'ARBISCAN_API_KEY' },
  arbnova : { base:'https://api-nova.arbiscan.io/api',        env:'ARBISCAN_API_KEY' },
  optimism: { base:'https://api-optimistic.etherscan.io/api', env:'OPTIMISTIC_ETHERSCAN_API_KEY' },
  base    : { base:'https://api.basescan.org/api',            env:'BASESCAN_API_KEY' },
  polygon : { base:'https://api.polygonscan.com/api',         env:'POLYGONSCAN_API_KEY' },
  linea   : { base:'https://api.lineascan.build/api',         env:'LINEASCAN_API_KEY' },
  scroll  : { base:'https://api.scrollscan.com/api',          env:'SCROLLSCAN_API_KEY' },
  monadtest:{base:'https://testnet-explorer.monad.xyz/api',   env:'' }
};
const fetchJson = async u => { const r=await fetch(u); if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); };
async function getAbiFromExplorer(chainKey,address){
  const x=EXPLORERS[(chainKey||'').toLowerCase()]; if(!x) return null;
  const key = x.env ? (process.env[x.env]||'') : '';
  const u = new URL(x.base);
  u.searchParams.set('module','contract'); u.searchParams.set('action','getabi'); u.searchParams.set('address',address);
  if (key) u.searchParams.set('apikey',key);
  try{
    const data = await fetchJson(u.toString());
    if (data?.status==='1' && data?.result) {
      const parsed = JSON.parse(data.result);
      if (Array.isArray(parsed)) return parsed;
    }
  }catch{}
  return null;
}

/* ====== Pretty ABI Viewer ====== */
const pad = (s, n) => (s.length >= n ? s : s + ' '.repeat(n - s.length));
const col = (c, s) => `\x1b[${c}m${s}\x1b[0m`;
function formatArgs(inputs = []) { return inputs.map(i => `${i.type}${i.name ? ' ' + i.name : ''}`).join(', '); }
function shortSig(item) { return `${item.name || '(noname)'}(${formatArgs(item.inputs)})`; }
function groupAbi(abi) {
  const fn = abi.filter(x => x?.type === 'function');
  const ev = abi.filter(x => x?.type === 'event');
  const write = fn.filter(x => x.stateMutability !== 'view' && x.stateMutability !== 'pure');
  const read  = fn.filter(x => x.stateMutability === 'view' || x.stateMutability === 'pure');
  const mint  = write.filter(x => {
    const n = (x.name || '').toLowerCase();
    return n.includes('mint') || n.includes('claim') || x.stateMutability === 'payable';
  });
  return { write, read, ev, mint };
}
function printSection(title, list, colorCode = 36) {
  if (!list.length) return;
  console.log(col(colorCode, `\n▸ ${title} (${list.length})`));
  const head = `${pad('#', 3)}  ${pad('Function', 44)}  ${pad('mut', 12)}`;
  console.log(color(34, head));
  list.forEach((item, i) => {
    const sig = shortSig(item);
    const mut = item.stateMutability || '';
    console.log(color(mut === 'payable' ? 33 : (mut === 'nonpayable' ? 35 : 32),
      `${pad(String(i + 1), 3)}  ${pad(sig, 44)}  ${pad(mut, 12)}`));
  });
}
async function printAbiReportPretty(abi) {
  if (!Array.isArray(abi) || !abi.length) {
    console.log('❌ ABI kosong atau tidak valid.');
    return { writeFns: [], mintCandidates: [] };
  }
  const { write, read, ev, mint } = groupAbi(abi);
  console.log(color(36, '\nABI Summary'));
  console.log(color(34, '───────────'));
  console.log(`  ${color(33,'Mint candidates')} : ${mint.length}`);
  console.log(`  ${color(35,'Write/Payable   ')} : ${write.length}`);
  console.log(`  ${color(32,'Read-only       ')} : ${read.length}`);
  console.log(`  ${color(36,'Events          ')} : ${ev.length}`);
  if (mint.length) printSection('Mint Candidates', mint, 33);
  if (write.length) printSection('Write / Payable', write, 35);
  if (read.length)  printSection('Read-only (view/pure)', read, 32);
  if (ev.length) {
    console.log(color(36, `\n▸ Events (${ev.length})`));
    ev.slice(0, 12).forEach((e, i) => console.log(`  ${i + 1}. ${shortSig(e)}`));
    if (ev.length > 12) console.log(`  … +${ev.length - 12} more`);
  }
  return { writeFns: write, mintCandidates: mint };
}

/* ===== ABI Finder flow ===== */
async function abiFinderFlow(chainKey, contractAddr, ask) {
  console.log('🔎 Mengambil ABI dari explorer…');
  const abi = await getAbiFromExplorer(chainKey, contractAddr);
  if (!abi) {
    console.log('⚠ ABI explorer tidak ditemukan. Akan fallback.');
    return { abi: null, fnList: null };
  }
  const { writeFns, mintCandidates } = await printAbiReportPretty(abi);
  let names = (mintCandidates.length ? mintCandidates : writeFns)
    .map(x => x.name).filter(Boolean);
  names = Array.from(new Set(names));

  console.log(color(36, '\n== ABI Finder Options =='));
  console.log('  1) Pakai kandidat otomatis');
  console.log('  2) Ketik nama fungsi manual');
  console.log('  3) Salin daftar kandidat (comma-separated)');
  console.log('  4) Simpan ABI ke file (abi-<address>.json)');
  console.log('  5) Fallback default');
  const pick = await ask('Nomor (1/2/3/4/5): ');

  if (pick === '3') {
    console.log('\nNama kandidat:\n' + names.join(','));
    return { abi, fnList: names };
  }
  if (pick === '4') {
    const fname = `abi-${contractAddr.toLowerCase()}.json`;
    fs.writeFileSync(fname, JSON.stringify(abi, null, 2));
    console.log(`✔ Tersimpan: ${fname}`);
    return { abi, fnList: names };
  }
  if (pick === '2') {
    const m = await ask('Masukkan nama fungsi (pisahkan koma): ');
    const l = m.split(',').map(s => s.trim()).filter(Boolean);
    if (l.length) return { abi, fnList: l };
    return { abi, fnList: names };
  }
  if (pick === '1') return { abi, fnList: names };
  return { abi, fnList: null };
}

/* ===== Mint core (ethers v6) + No-ABI Blast ===== */
const DEFAULT_FUNCS = ['mint','publicMint','mintPublic','safeMint','claim','mintTo','mintNFT'];

function buildAbi(funcs){
  const set=new Set();
  for (const f of funcs){
    set.add(`function ${f}() payable`);
    for (const t of ['uint256','uint64','uint32']){
      set.add(`function ${f}(${t} quantity) payable`);
      set.add(`function ${f}(address to, ${t} quantity) payable`);
      set.add(`function ${f}(${t} quantity, address to) payable`);
    }
  }
  set.add('function price() view returns (uint256)');
  set.add('function mintPrice() view returns (uint256)');
  set.add('function cost() view returns (uint256)');
  return [...set];
}
function toSignatureFromItem(item){
  const name = item.name || '';
  const types = (item.inputs||[]).map(i => i.type).join(',');
  return `${name}(${types})`;
}
async function smartPick(c,fn,qty,o){
  try{ await c[fn].staticCall(o); return {fn,mode:'noarg'}; }catch{}
  try{ await c[fn].staticCall(qty,o); return {fn,mode:'qty'}; }catch{}
  try{ await c[fn].staticCall(c.runner.address,qty,o); return {fn,mode:'to_qty'}; }catch{}
  try{ await c[fn].staticCall(qty,c.runner.address,o); return {fn,mode:'qty_to'}; }catch{}
  return null;
}
function loosePickByAbi(abi, fnName) {
  const it = (abi||[]).find(x=>x?.type==='function' && x.name===fnName);
  if (!it) return null;
  const ins = (it.inputs||[]);
  const sig = toSignatureFromItem(it);
  if (ins.length===0) return { fn:fnName, sig, mode:'noarg' };
  if (ins.length===1 && /^uint(256|64|32)$/.test(ins[0].type)) return { fn:fnName, sig, mode:'qty' };
  if (ins.length===2) {
    const a=ins[0].type, b=ins[1].type;
    if (a==='address' && /^uint(256|64|32)$/.test(b)) return { fn:fnName, sig, mode:'to_qty' };
    if (/^uint(256|64|32)$/.test(a) && b==='address') return { fn:fnName, sig, mode:'qty_to' };
  }
  return { fn:fnName, sig, mode:'unknown' };
}

/* ===== No-ABI probing helpers ===== */
const COMMON_MINT_NAMES = [
  'mint', 'publicMint', 'safeMint', 'mintPublic', 'mintNFT',
  'purchase', 'buy', 'claim', 'whitelistMint', 'allowlistMint'
];
function signatureCandidatesFor(name) {
  return [
    `function ${name}() payable`,
    `function ${name}(uint256 quantity) payable`,
    `function ${name}(address to, uint256 quantity) payable`,
    `function ${name}(uint256 quantity, address to) payable`,
    `function ${name}(uint256 quantity, bytes32[] proof) payable`,
    `function ${name}(bytes32[] proof, uint256 quantity) payable`,
    `function ${name}(address to, uint256 quantity, bytes32[] proof) payable`
  ];
}
async function simulateBySignature(contract, iface, sig, args, valueWei = 0n) {
  try {
    const data = iface.encodeFunctionData(sig, args);
    await contract.runner.call({ to: contract.target, data, value: valueWei });
    return true;
  } catch { return false; }
}

async function discoverPrice(c){
  for (const f of ['price','mintPrice','cost']){
    if (typeof c[f]==='function'){
      try{ const v=await c[f](); if (v>0n) return v; }catch{}
    }
  }
  return null;
}
const toWei = (eth)=> (eth!=null && eth!=='') ? ethers.parseEther(String(eth)) : 0n;

async function mintCore({ wallet, contractAddr, qty, valueWei, fnList, abiOverride }){
  const hasRealAbi = Array.isArray(abiOverride) && abiOverride.length;
  const abi = hasRealAbi ? abiOverride : buildAbi(fnList);

  const c = new ethers.Contract(contractAddr, abi, wallet);

  let val = valueWei ?? 0n;
  if (val === 0n) { try{ const p=await discoverPrice(c); if(p&&p>0n) val=p*(qty??1n);}catch{} }

  const fee = await wallet.provider.getFeeData();
  const overrides = (fee.maxFeePerGas || fee.maxPriorityFeePerGas)
    ? { value: val, maxFeePerGas: fee.maxFeePerGas, maxPriorityFeePerGas: fee.maxPriorityFeePerGas }
    : { value: val, gasPrice: fee.gasPrice };

  // ==== PICK FUNCTION ====
  let picked = null;

  // 1) Ada ABI asli → signature penuh
  if (hasRealAbi){
    for (const fn of fnList){
      const lp = loosePickByAbi(abi, fn);
      if (lp) { picked = lp; break; }
    }
  }

  // 2) No-ABI Blast: explorer gagal + user override → coba signature umum (simulasi)
  if (!picked && !hasRealAbi && Array.isArray(fnList) && fnList.length) {
    const baseName = fnList[0];
    const fragStrings = [
      ...signatureCandidatesFor(baseName),
      ...COMMON_MINT_NAMES.filter(n => n !== baseName).flatMap(signatureCandidatesFor)
    ];
    const iface = new ethers.Interface(fragStrings);
    const probe = new ethers.Contract(contractAddr, iface, wallet);

    const argSets = [
      [],                              // ()
      [qty],                           // (uint256)
      [wallet.address, qty],           // (address,uint256)
      [qty, wallet.address]            // (uint256,address)
    ];

    outer:
    for (const frag of fragStrings) {
      const sig = frag.replace(/^function\s+/, '').replace(/\s+payable$/, '');
      for (const argsTry of argSets) {
        const ok = await simulateBySignature(probe, iface, sig, argsTry, val);
        if (ok) {
          const mode =
            argsTry.length === 0 ? 'noarg' :
            (argsTry.length === 1 ? 'qty' :
            (argsTry[0] === wallet.address ? 'to_qty' : 'qty_to'));
          picked = { fn: sig.split('(')[0], sig, mode };
          break outer;
        }
      }
    }
  }

  // 3) Fallback heuristik lama
  if (!picked){
    for (const fn of fnList){ picked=await smartPick(c,fn,qty,overrides); if(picked) break; }
  }

  if (!picked) throw new Error('Tidak ada fungsi mint yang cocok');

  // ==== EXECUTION ====
  try{
    if (DRY_RUN){
      if (picked.sig){
        const iface = new ethers.Interface(abi);
        const data =
          picked.mode==='noarg' ? iface.encodeFunctionData(picked.sig, []) :
          picked.mode==='qty'    ? iface.encodeFunctionData(picked.sig, [qty]) :
          picked.mode==='to_qty' ? iface.encodeFunctionData(picked.sig, [wallet.address, qty]) :
          picked.mode==='qty_to' ? iface.encodeFunctionData(picked.sig, [qty, wallet.address]) :
                                   iface.encodeFunctionData(picked.sig, []);
        await c.runner.call({ to: c.target, data, value: overrides.value || 0n });
        return { dryRun:true, hash:null, status:1, fn:picked.fn, sig:picked.sig, mode:picked.mode };
      } else {
        await c.runner.call({ to: c.target, data: '0x', value: overrides.value || 0n });
        return { dryRun:true, hash:null, status:1, fn:picked.fn, mode:picked.mode };
      }
    }

    // Estimasi gas (best-effort)
    try{
      if (picked.sig){
        const fn = c.getFunction(picked.sig);
        let est;
        if (picked.mode==='noarg')       est = await c.estimateGas[picked.sig](overrides);
        else if (picked.mode==='qty')    est = await c.estimateGas[picked.sig](qty, overrides);
        else if (picked.mode==='to_qty') est = await c.estimateGas[picked.sig](wallet.address, qty, overrides);
        else if (picked.mode==='qty_to') est = await c.estimateGas[picked.sig](qty, wallet.address, overrides);
        if (est) overrides.gasLimit = (est*120n)/100n;
      } else {
        let est;
        if (picked.mode==='noarg')       est = await c.estimateGas[picked.fn](overrides);
        else if (picked.mode==='qty')    est = await c.estimateGas[picked.fn](qty, overrides);
        else if (picked.mode==='to_qty') est = await c.estimateGas[picked.fn](wallet.address, qty, overrides);
        else                             est = await c.estimateGas[picked.fn](qty, wallet.address, overrides);
        if (est) overrides.gasLimit = (est*120n)/100n;
      }
    }catch{}

    // Kirim tx
    let tx, rcpt;
    if (picked.sig){
      const fn = c.getFunction(picked.sig);
      if (picked.mode==='noarg')        tx = await fn(overrides);
      else if (picked.mode==='qty')     tx = await fn(qty, overrides);
      else if (picked.mode==='to_qty')  tx = await fn(wallet.address, qty, overrides);
      else if (picked.mode==='qty_to')  tx = await fn(qty, wallet.address, overrides);
      else                              tx = await fn(overrides);
    } else {
      if (picked.mode==='noarg')        tx = await c[picked.fn](overrides);
      else if (picked.mode==='qty')     tx = await c[picked.fn](qty, overrides);
      else if (picked.mode==='to_qty')  tx = await c[picked.fn](wallet.address, qty, overrides);
      else                              tx = await c[picked.fn](qty, wallet.address, overrides);
    }

    rcpt = await tx.wait();
    return {
      dryRun:false, hash:tx.hash, status:rcpt.status, block:rcpt.blockNumber,
      fn:picked.fn, sig:picked.sig, mode:picked.mode
    };
  }catch(e){
    // diagnostics
    let msg = e.reason || e.shortMessage || e.message || String(e);
    const data = e?.data || e?.error?.data;
    if (typeof data === 'string' && data.startsWith('0x') && data.length >= 10) {
      const selector = data.slice(0, 10).toLowerCase();
      if (selector === '0x08c379a0') {
        try { const ifaceErr = new ethers.Interface(['error Error(string)']); const [reason] = ifaceErr.decodeErrorResult('Error(string)', data); msg = `revert: ${reason}`; } catch {}
      } else if (selector === '0x4e487b71') { msg = 'revert: Panic(uint256)'; }
      else { msg += ` (revert selector: ${selector})`; }
    }
    throw new Error(msg);
  }
}

/* ===== Actions ===== */
async function actionCheckBalance(){
  clearScreen();
  try{
    const { key, rpc } = await pickChain();
    const url = rpc || rpcFor(key);
    const w = await getWallet(url);
    const [bal, net] = await Promise.all([
      w.provider.getBalance(w.address),
      w.provider.getNetwork()
    ]);
    console.log(`\nAlamat: ${w.address}\nChain : ${net.name} (${net.chainId})\nSaldo : ${fmtEth(bal)} native\n`);
  }catch(e){ console.log('Gagal cek saldo:', e.reason||e.message); }
  await ask('\n(Enter untuk kembali)');
}

async function actionMintSingle(){
  clearScreen();
  const { key, rpc } = await pickChain();
  const contract = await ask('Alamat kontrak: ');
  const qty = BigInt(Number(await ask('Qty (default 1): ')) || 1);
  const valueEth = await ask('Total value ETH (default 0): ');

  const { abi, fnList } = await abiFinderFlow(key, contract, ask);
  const override = await ask('Override nama fungsi? (y/N): ');
  let fnListFinal = fnList;
  if (yes(override)){
    const raw = await ask('Masukkan nama fungsi (pisahkan koma): ');
    fnListFinal = raw.split(',').map(s=>s.trim()).filter(Boolean);
  }
  const selected = (fnListFinal && fnListFinal.length) ? fnListFinal : DEFAULT_FUNCS;

  try{
    const w = await getWallet(rpc || rpcFor(key));
    const res = await mintCore({
      wallet:w, contractAddr:contract, qty,
      valueWei: (valueEth && valueEth!=='') ? ethers.parseEther(String(valueEth)) : undefined,
      fnList:selected, abiOverride: abi||undefined
    });
    console.log(res.dryRun ? 'DRY_RUN=true → simulasi OK.' :
      `Tx: ${res.hash} • ${res.status?'OK':'FAIL'}${res.sig?` • sig=${res.sig}`:''}`);
  }catch(e){ console.log('Error:', e.reason||e.shortMessage||e.message); }
  await ask('\n(Enter untuk kembali)');
}

function listTargets(){
  const targets = loadJSON('./targets.json', []);
  targets.forEach((t,i)=>{
    const price = (t.valueEth!=null)?`value=${t.valueEth}`:(t.pricePerNftEth!=null)?`ppn=${t.pricePerNftEth}`:'value=0';
    console.log(`${i+1}) ${t.name} • ${t.contract} • qty=${t.qty??1} • ${price}${t.rpc?' • custom RPC':''}`);
  });
  return targets;
}
async function actionMintOmni(){
  clearScreen();
  const targets = loadJSON('./targets.json', []);
  if (!targets.length){ console.log('targets.json kosong.'); await ask('\n(Enter untuk kembali)'); return; }
  console.log(`Menjalankan ${targets.length} target…`);
  for (const t of targets){
    try{
      const url = rpcFor(t.name||t.chain, t.rpc);
      const w = await getWallet(url);
      const fnList = t.functionCandidates?.length ? t.functionCandidates : DEFAULT_FUNCS;
      const qty = BigInt(String(t.qty ?? 1));
      const val = (t.valueEth!=null&&t.valueEth!=='') ? ethers.parseEther(String(t.valueEth))
                 : (t.pricePerNftEth!=null&&t.pricePerNftEth!=='') ? ethers.parseEther(String(t.pricePerNftEth))*qty
                 : 0n;

      let abi = null;
      const keyForAbi = (t.name||t.chain||'').toLowerCase();
      if (keyForAbi) abi = await getAbiFromExplorer(keyForAbi, t.contract);

      const net = await w.provider.getNetwork();
      console.log(`\n=== ${t.name || net.name} (${net.chainId}) ===`);
      const res = await mintCore({ wallet:w, contractAddr:t.contract, qty, valueWei:val, fnList, abiOverride:abi });
      console.log(res.dryRun ? '[DRY] OK' :
        `Tx ${res.hash} • ${res.status?'OK':'FAIL'}${res.sig?` • sig=${res.sig}`:''}`);
    }catch(e){ console.log('Target error:', e.reason||e.shortMessage||e.message); }
  }
  await ask('\n(Enter untuk kembali)');
}
async function actionAddTarget(){
  clearScreen();
  const { key, rpc } = await pickChain();
  const contract = await ask('Alamat kontrak: ');
  const qty = Number(await ask('Qty (default 1): ')) || 1;
  const val = await ask('Total value (ETH) utk semua qty (enter utk skip): ');
  const ppn = val ? '' : await ask('pricePerNftEth (enter=0 / bila pakai total di atas): ');
  const fns = await ask('functionCandidates (pisahkan koma, kosong=default): ');

  const targets = loadJSON('./targets.json', []);
  targets.push({
    name:key, contract, qty,
    valueEth: val || undefined,
    pricePerNftEth: ppn || undefined,
    rpc: rpc || undefined,
    functionCandidates: fns ? fns.split(',').map(s=>s.trim()).filter(Boolean) : undefined
  });
  saveJSON('./targets.json', targets);
  console.log('Target ditambahkan.');
  await ask('\n(Enter untuk kembali)');
}

/* ===== Test RPCs (pakai pingRpc) ===== */
async function actionTestRPCs(){
  clearScreen();
  const CHAINS = getAllChains();
  console.log('Testing RPC endpoints…\n');

  const CONCURRENCY = 4;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  for (const c of CHAINS){
    const urls = Array.isArray(c.rpc) ? c.rpc : [c.rpc].filter(Boolean);
    if (!urls.length) { console.log(`${color(31,'✖')} ${c.name} → no RPC configured`); continue; }

    const results = [];
    for (let i=0; i<urls.length; i+=CONCURRENCY){
      await Promise.all(
        urls.slice(i, i+CONCURRENCY).map(async (u, idx) => {
          if (i || idx) await sleep(120);
          const res = await pingRpc(u, 3500);
          results.push({ url: u, ...res });
        })
      );
    }

    const oks = results.filter(r => r.ok).sort((a,b) => a.ms - b.ms);
    if (oks.length) {
      const fastest = oks[0];
      console.log(`${color(32,'✔')} ${c.name} → fastest ${color(36,fastest.url)} (${fastest.ms} ms)`);
    } else {
      const uniqErr = [...new Set(results.map(r => r.err || 'unknown'))].slice(0,2).join(' | ');
      console.log(`${color(31,'✖')} ${c.name} → all RPC failed (${uniqErr})`);
    }
  }
  await ask('\n(Enter untuk kembali)');
}

/* ===== Multi-wallet ===== */
function loadMultiKeys(){
  const arr=[];
  if (process.env.MULTI_PRIVATE_KEYS) arr.push(...process.env.MULTI_PRIVATE_KEYS.split(',').map(s=>s.trim()).filter(Boolean));
  if (fs.existsSync('./wallets.txt')) arr.push(...fs.readFileSync('./wallets.txt','utf8').split(/\r?\n/).map(s=>s.trim()).filter(Boolean));
  return [...new Set(arr)];
}
async function actionParallelMint(){
  clearScreen();
  const targets = loadJSON('./targets.json', []);
  if (!targets.length){ console.log('targets.json kosong.'); await ask('\n(Enter untuk kembali)'); return; }
  console.log('Daftar target:'); listTargets();
  const idx = Number(await ask('\nPilih target nomor: ')) - 1;
  if (idx<0||idx>=targets.length){ console.log('Nomor tidak valid.'); await ask('\n(Enter untuk kembali)'); return; }
  const t = targets[idx];
  const keys = loadMultiKeys();
  if (!keys.length){ console.log('Tidak ada private key multi-wallet. Isi MULTI_PRIVATE_KEYS atau wallets.txt'); await ask('\n(Enter untuk kembali)'); return; }

  const url = rpcFor(t.name||t.chain, t.rpc);
  const fnList = t.functionCandidates?.length ? t.functionCandidates : DEFAULT_FUNCS;
  const qty = BigInt(String(t.qty ?? 1));
  const val = (t.valueEth!=null&&t.valueEth!=='') ? ethers.parseEther(String(t.valueEth))
            : (t.pricePerNftEth!=null&&t.pricePerNftEth!=='') ? ethers.parseEther(String(t.pricePerNftEth))*qty
            : 0n;

  console.log(`Menjalankan paralel ${keys.length} wallet pada ${t.name} • ${t.contract}`);
  const out = await Promise.allSettled(keys.map(async (pk,i)=>{
    try{
      await new Promise(r=>setTimeout(r,i*200));
      const w = await getWalletByKey(pk, url);
      let abi=null; const keyForAbi=(t.name||t.chain||'').toLowerCase();
      if (keyForAbi) { try{ abi=await getAbiFromExplorer(keyForAbi,t.contract);}catch{} }
      const res = await mintCore({ wallet:w, contractAddr:t.contract, qty, valueWei:val, fnList, abiOverride:abi });
      return { ok:true, res };
    }catch(e){ return { ok:false, err:e.reason||e.shortMessage||e.message||String(e) }; }
  }));
  console.log('\nHasil:');
  out.forEach((r,i)=>{
    const tag = keys[i].slice(0,10)+'…';
    if (r.status==='fulfilled' && r.value.ok) {
      const v=r.value.res; console.log(`#${i+1} ${tag} → ${v.status?'OK':'FAIL'} ${v.hash||''}${v.sig?` • sig=${v.sig}`:''}`);
    } else if (r.status==='fulfilled') {
      console.log(`#${i+1} ${tag} → ERROR: ${r.value.err}`);
    } else {
      console.log(`#${i+1} ${tag} → ERROR: ${r.reason?.message||r.reason}`);
    }
  });
  await ask('\n(Enter untuk kembali)');
}

/* ===== ABI Finder standalone (Menu 10) ===== */
async function actionAbiFinder() {
  clearScreen();
  const { key } = await pickChain();
  const address = await ask('Alamat kontrak: ');
  try {
    const abi = await getAbiFromExplorer(key, address);
    if (!abi) console.log('⚠ ABI tidak ditemukan di explorer.');
    else      await printAbiReportPretty(abi);
  } catch (e) {
    console.log('Gagal ambil ABI:', e.message || e);
  }
  await ask('\n(Enter untuk kembali)');
}

/* ===== Chain picker (paging) ===== */
async function pickChain(){
  clearScreen(); printSub('Select Chain');
  const CHAINS = getAllChains(); const PAGE=12; let page=0;
  while(true){
    const start=page*PAGE, slice=CHAINS.slice(start,start+PAGE);
    slice.forEach((c,i)=>console.log(`${color(COLORS[i%COLORS.length],String(i+1))}) ${c.name}`));
    const extra=slice.length+1, next=slice.length+2, prev=slice.length+3;
    console.log(color(36,`${extra}) Lainnya (manual RPC)`));
    if (start+PAGE<CHAINS.length) console.log(color(33,`${next}) Next Page ▶`));
    if (page>0) console.log(color(33,`${prev}) ◀ Prev Page`));
    const n = Number(await ask(color(35,'Nomor: ')));
    if (n>=1 && n<=slice.length) return { key:slice[n-1].key, rpc:slice[n-1].rpc };
    if (n===extra){ const k=await ask('Nama chain: '); const r=await ask('RPC (kosong=default): '); return { key:k, rpc:r||null }; }
    if (n===next && start+PAGE<CHAINS.length){ page++; continue; }
    if (n===prev && page>0){ page--; continue; }
    console.log(color(31,'Masukan tidak valid.')); 
  }
}

/* ===== Menu ===== */
async function mainMenu(){
  clearScreen(); hideCursor(); printBanner('NFT AIO MENU');
  console.log(color(32,'1) ')+'Cek saldo');
  console.log(color(33,'2) ')+'Mint 1 kontrak (manual + ABI Finder)');
  console.log(color(36,'3) ')+'Mint multi-chain (targets.json)');
  console.log(color(34,'4) ')+'Tambah target');
  console.log(color(35,'5) ')+'Lihat target');
  console.log(color(31,'6) ')+'Hapus target');
  console.log(color(33,'7) ')+'Cek gas sekarang');
  console.log(color(32,'8) ')+'Mint paralel multi-wallet');
  console.log(color(36,'9) ')+'Test RPCs (scan)');
  console.log(color(35,'10) ')+'ABI Finder (cek fungsi tanpa mint)');
  console.log(color(36,'0) ')+'Keluar');
  const c = await ask(color(35,'Pilih nomor: '));
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
    case '10': await actionAbiFinder(); break;
    case '0': rl.close(); return;
    default: console.log(color(31,'Masukan tidak valid.')); await ask('\n(Enter untuk kembali)');
  }
  return mainMenu();
}

/* ===== Start ===== */
clearScreen();
warnStartup();
mainMenu().catch(e=>{ showCursor(); console.error('Fatal:', e); rl.close(); });
