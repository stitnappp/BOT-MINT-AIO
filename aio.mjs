import 'dotenv/config';
import fs from 'fs';
import readline from 'readline';
import { ethers } from 'ethers';

/* ===== Terminal ===== */
const CLEAR = '\x1b[2J\x1b[H';
const hideCursor = () => process.stdout.write('\x1b[?25l');
const showCursor  = () => process.stdout.write('\x1b[?25h');
const clearScreen = () => process.stdout.write(CLEAR);
process.on('exit', showCursor);
process.on('SIGINT', () => { showCursor(); process.exit(0); });

/* ===== UI ===== */
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
  if (!ALCHEMY_KEY) console.log(color(33,'⚠ Alchemy disabled: ALCHEMY_KEY kosong.'));
  else              console.log(color(32,'✔ Alchemy enabled.'));
  if (!PRIVATE_KEY) console.log(color(31,'❌ PRIVATE_KEY kosong. Menu mint/cek saldo tidak jalan.'));
}
const alchemyLabel = ()=> ALCHEMY_KEY ? color(32,'[Alchemy: ON]') : color(33,'[Alchemy: OFF]');
function printBanner(title='NFT AIO MENU'){
  console.log(''); ASCII.forEach(r=>console.log(rainbow(r)));
  console.log(rainbow(`\n${title} `)+color(36,`(by ${WATERMARK}) `)+alchemyLabel());
  console.log(color(34,line(64)));
}
function printSub(title){ console.log(''); console.log(rainbow(`=== ${title} === `)+color(36,`by ${WATERMARK}`)); console.log(color(34,line(48))); }

/* ===== IO ===== */
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res=>rl.question(q,a=>res((a||'').trim())));
const yes = s => /^y(es)?$/i.test(s||'');
const fmtEth = v => ethers.formatEther(v ?? 0n);
const loadJSON = (p,f=[]) => fs.existsSync(p) ? (()=>{try{return JSON.parse(fs.readFileSync(p,'utf8'));}catch{return f;}})() : f;
const saveJSON = (p,o) => fs.writeFileSync(p, JSON.stringify(o,null,2));

/* ===== RPC mapping ===== */
const ALCHEMY_HOSTS = {
  mainnet:'eth-mainnet', sepolia:'eth-sepolia', arbitrum:'arb-mainnet',
  optimism:'opt-mainnet', base:'base-mainnet', polygon:'polygon-mainnet', linea:'linea-mainnet'
};
const aUrl = k => ALCHEMY_KEY && ALCHEMY_HOSTS[k] ? `https://${ALCHEMY_HOSTS[k]}.g.alchemy.com/v2/${ALCHEMY_KEY}` : null;
const rpcList = (k, pubs=[]) => { const a=aUrl(k); return a?[a,...pubs]:pubs; };

/* ===== Default chains ===== */
const DEFAULT_CHAINS = [
  { name:'Ethereum Mainnet', key:'mainnet', rpc: rpcList('mainnet',['https://eth.drpc.org','https://1rpc.io/eth','https://rpc.ankr.com/eth']) },
  { name:'Ethereum Sepolia', key:'sepolia', rpc: rpcList('sepolia',['https://rpc.sepolia.org','https://1rpc.io/sepolia']) },
  { name:'Arbitrum One', key:'arbitrum', rpc: rpcList('arbitrum',['https://arb1.arbitrum.io/rpc','https://1rpc.io/arb']) },
  { name:'Optimism', key:'optimism', rpc: rpcList('optimism',['https://mainnet.optimism.io','https://1rpc.io/op']) },
  { name:'Base', key:'base', rpc: rpcList('base',['https://mainnet.base.org','https://1rpc.io/base']) },
  { name:'Polygon PoS', key:'polygon', rpc: rpcList('polygon',['https://polygon-rpc.com','https://1rpc.io/poly']) },
  { name:'Linea', key:'linea', rpc: rpcList('linea',['https://rpc.linea.build']) },
  { name:'zkSync Era', key:'zksync', rpc:['https://mainnet.era.zksync.io','https://1rpc.io/zksync2'] },
  { name:'Polygon zkEVM', key:'zkevm', rpc:['https://zkevm-rpc.com','https://1rpc.io/pzkevm'] },
  { name:'Scroll', key:'scroll', rpc:['https://rpc.scroll.io','https://1rpc.io/scroll'] },
  { name:'BNB Smart Chain', key:'bsc', rpc:['https://bsc-dataseed.binance.org','https://rpc.ankr.com/bsc'] },
  { name:'Avalanche C-Chain', key:'avalanche', rpc:['https://api.avax.network/ext/bc/C/rpc','https://1rpc.io/avax/c'] },
  { name:'Fantom Opera', key:'fantom', rpc:['https://rpc.fantom.network','https://1rpc.io/ftm'] },
  { name:'Gnosis Chain', key:'gnosis', rpc:['https://rpc.gnosischain.com','https://1rpc.io/gnosis'] },
  { name:'Celo', key:'celo', rpc:['https://forno.celo.org','https://1rpc.io/celo'] },
  { name:'Cronos', key:'cronos', rpc:['https://evm.cronos.org','https://cronos-evm.publicnode.com'] },
  { name:'Kava EVM', key:'kava', rpc:['https://evm.kava.io','https://evm.data.kava.io'] },
  { name:'Aurora', key:'aurora', rpc:['https://mainnet.aurora.dev','https://1rpc.io/aurora'] },
  { name:'Moonbeam', key:'moonbeam', rpc:['https://rpc.api.moonbeam.network','https://1rpc.io/glmr'] },
  { name:'Moonriver', key:'moonriver', rpc:['https://rpc.api.moonriver.moonbeam.network','https://1rpc.io/movr'] },
  { name:'Arbitrum Nova', key:'arbnova', rpc:['https://nova.arbitrum.io/rpc','https://1rpc.io/arb/nova'] },
  { name:'Blast', key:'blast', rpc:['https://rpc.blast.io','https://1rpc.io/blast'] },
  { name:'Zora', key:'zora', rpc:['https://rpc.zora.energy','https://1rpc.io/zora'] },
  { name:'Mode', key:'mode', rpc:['https://mainnet.mode.network','https://1rpc.io/mode'] },
  { name:'Taiko', key:'taiko', rpc:['https://rpc.mainnet.taiko.xyz','https://1rpc.io/taiko'] },
  { name:'Base Sepolia', key:'base-sepolia', rpc:['https://sepolia.base.org','https://1rpc.io/base/sepolia'] },
  { name:'Optimism Sepolia', key:'op-sepolia', rpc:['https://sepolia.optimism.io'] },
  { name:'Arbitrum Sepolia', key:'arb-sepolia', rpc:['https://sepolia-rollup.arbitrum.io/rpc'] },
  { name:'Polygon Amoy', key:'amoy', rpc:['https://rpc-amoy.polygon.technology'] },
  { name:'Scroll Sepolia', key:'scroll-sepolia', rpc:['https://sepolia-rpc.scroll.io'] },
  { name:'Linea Sepolia', key:'linea-sepolia', rpc:['https://rpc.sepolia.linea.build'] },
  { name:'Blast Sepolia', key:'blast-sepolia', rpc:['https://sepolia.blast.io'] },
  { name:'Zora Sepolia', key:'zora-sepolia', rpc:['https://sepolia.rpc.zora.energy'] },
  { name:'Mode Sepolia', key:'mode-sepolia', rpc:['https://sepolia.mode.network'] },
  { name:'Taiko Hekla', key:'taiko-hekla', rpc:['https://hekla.taiko.xyz'] },
  { name:'Monad Testnet', key:'monadtest', rpc:['https://testnet-rpc.monad.xyz'] }
];

/* ===== RPC ping helper ===== */
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

/* ===== Explorer ABI ===== */
const EXPLORERS = {
  mainnet:{base:'https://api.etherscan.io/api',env:'ETHERSCAN_API_KEY'},
  sepolia:{base:'https://api-sepolia.etherscan.io/api',env:'ETHERSCAN_API_KEY'},
  arbitrum:{base:'https://api.arbiscan.io/api',env:'ARBISCAN_API_KEY'},
  arbnova:{base:'https://api-nova.arbiscan.io/api',env:'ARBISCAN_API_KEY'},
  optimism:{base:'https://api-optimistic.etherscan.io/api',env:'OPTIMISTIC_ETHERSCAN_API_KEY'},
  base:{base:'https://api.basescan.org/api',env:'BASESCAN_API_KEY'},
  polygon:{base:'https://api.polygonscan.com/api',env:'POLYGONSCAN_API_KEY'},
  linea:{base:'https://api.lineascan.build/api',env:'LINEASCAN_API_KEY'},
  scroll:{base:'https://api.scrollscan.com/api',env:'SCROLLSCAN_API_KEY'},
  monadtest:{base:'https://testnet-explorer.monad.xyz/api',env:''}
};
const fetchJson = async u => { const r=await fetch(u); if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); };
async function getAbiFromExplorer(chainKey,address){
  const x=EXPLORERS[(chainKey||'').toLowerCase()]; if(!x) return null;
  const key = x.env ? (process.env[x.env]||'') : '';
  const u = new URL(x.base);
  u.searchParams.set('module','contract');
  u.searchParams.set('action','getabi');
  u.searchParams.set('address',address);
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

/* ===== ABI Pretty ===== */
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

/* ===== ABI Finder Flow ===== */
async function abiFinderFlow(chainKey, contractAddr, askFn) {
  console.log('🔎 Mengambil ABI dari explorer…');
  const abi = await getAbiFromExplorer(chainKey, contractAddr);
  if (!abi) {
    console.log('⚠ ABI explorer tidak ditemukan. Akan fallback.');
    return { abi: null, fnList: null };
  }
  const { writeFns, mintCandidates } = await printAbiReportPretty(abi);
  let names = (mintCandidates.length ? mintCandidates : writeFns).map(x => x.name).filter(Boolean);
  names = Array.from(new Set(names));
  console.log(color(36, '\n== ABI Finder Options =='));
  console.log('  1) Pakai kandidat otomatis');
  console.log('  2) Ketik nama fungsi manual');
  console.log('  3) Salin daftar kandidat');
  console.log('  4) Simpan ABI ke file');
  console.log('  5) Fallback default');
  const pick = await askFn('Nomor (1/2/3/4/5): ');
  if (pick === '3') { console.log('\nNama kandidat:\n' + names.join(',')); return { abi, fnList: names }; }
  if (pick === '4') { const fname = `abi-${contractAddr.toLowerCase()}.json`; fs.writeFileSync(fname, JSON.stringify(abi, null, 2)); console.log(`✔ Tersimpan: ${fname}`); return { abi, fnList: names }; }
  if (pick === '2') { const m = await askFn('Masukkan nama fungsi (pisahkan koma): '); const l = m.split(',').map(s=>s.trim()).filter(Boolean); return { abi, fnList: l.length?l:names }; }
  if (pick === '1') return { abi, fnList: names };
  return { abi, fnList: null };
}

/* ===== Mint core ===== */
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
const COMMON_MINT_NAMES = ['mint','publicMint','safeMint','mintPublic','mintNFT','purchase','buy','claim','whitelistMint','allowlistMint'];
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
  let picked = null;
  if (hasRealAbi){
    for (const fn of fnList){ const lp = loosePickByAbi(abi, fn); if (lp){ picked = lp; break; } }
  }
  if (!picked && !hasRealAbi && Array.isArray(fnList) && fnList.length) {
    const baseName = fnList[0];
    const fragStrings = [
      ...signatureCandidatesFor(baseName),
      ...COMMON_MINT_NAMES.filter(n => n !== baseName).flatMap(signatureCandidatesFor)
    ];
    const iface = new ethers.Interface(fragStrings);
    const probe = new ethers.Contract(contractAddr, iface, wallet);
    const argSets = [ [], [qty], [wallet.address, qty], [qty, wallet.address] ];
    outer:
    for (const frag of fragStrings) {
      const sig = frag.replace(/^function\s+/, '').replace(/\s+payable$/, '');
      for (const argsTry of argSets) {
        const ok = await simulateBySignature(probe, iface, sig, argsTry, val);
        if (ok) {
          const mode = argsTry.length===0?'noarg':argsTry.length===1?'qty':(argsTry[0]===wallet.address?'to_qty':'qty_to');
          picked = { fn: sig.split('(')[0], sig, mode };
          break outer;
        }
      }
    }
  }
  if (!picked){
    for (const fn of fnList){ picked=await smartPick(c,fn,qty,overrides); if(picked) break; }
  }
  if (!picked) throw new Error('Tidak ada fungsi mint yang cocok');
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
    try{
      if (picked.sig){
        const fn = c.getFunction(picked.sig);
        let est;
        if (picked.mode==='noarg')       est = await c.estimateGas[picked.sig](overrides);
        else if (picked.mode==='qty')    est = await c.estimateGas[picked.sig](qty, overrides);
        else if (picked.mode==='to_qty') est = await c.estimateGas[picked.sig](wallet.address, qty, overrides);
        else if (picked.mode==='qty_to')
