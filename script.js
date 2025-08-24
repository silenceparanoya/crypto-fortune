/* ========= PERSISTENT STATE ========= */
const STORAGE_KEY = 'cf_demo_v3';
const state = {
  stars: 0,
  inventory: [],
  ref: { clicks: 0, joins: 0, earn: 0 },
  rounds: [] // { mult, time }
};
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) Object.assign(state, JSON.parse(raw));
  }catch{}
  if(!state.stars) state.stars = 1500; // стартовый баланс
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
function setBalanceView(){ $('#stars-balance').textContent = state.stars.toLocaleString('ru-RU'); }
function toast(msg, id='toast'){ const t = $('#'+id); t.textContent = msg; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'), 1600); }

/* ========= ITEMS (NFT) ========= */
const ITEMS = [
  { id:'peach', name:'Персик', emoji:'🍑', rarity:'common', value:120, minTier:'bronze' },
  { id:'clover', name:'Клевер', emoji:'🍀', rarity:'common', value:140, minTier:'bronze' },
  { id:'duck', name:'Утенок', emoji:'🦆', rarity:'common', value:160, minTier:'bronze' },
  { id:'cat', name:'Котик', emoji:'🐱', rarity:'common', value:180, minTier:'bronze' },
  { id:'panda', name:'Панда', emoji:'🐼', rarity:'rare', value:320, minTier:'bronze' },
  { id:'fox', name:'Лис', emoji:'🦊', rarity:'rare', value:380, minTier:'bronze' },
  { id:'ufo', name:'НЛО', emoji:'🛸', rarity:'rare', value:450, minTier:'bronze' },
  { id:'rainbow', name:'Радуга', emoji:'🌈', rarity:'rare', value:520, minTier:'silver' },
  { id:'unicorn', name:'Единорог', emoji:'🦄', rarity:'epic', value:1200, minTier:'silver' },
  { id:'dragon', name:'Дракон', emoji:'🐉', rarity:'epic', value:1600, minTier:'silver' },
  { id:'wizard', name:'Волшебник', emoji:'🧙', rarity:'epic', value:2200, minTier:'silver' },
  { id:'diamond', name:'Алмаз', emoji:'💎', rarity:'epic', value:2600, minTier:'gold' },
  { id:'crown', name:'Корона', emoji:'👑', rarity:'legendary', value:5200, minTier:'gold' },
  { id:'phoenix', name:'Феникс', emoji:'🔥', rarity:'legendary', value:7400, minTier:'gold' },
];
const TIERS = {
  bronze:{ price:200,  weights:{ common:70, rare:25, epic:5, legendary:0.5 } },
  silver:{ price:1500, weights:{ common:35, rare:45, epic:18, legendary:2 } },
  gold:{   price:10000,weights:{ common:10, rare:35, epic:40, legendary:15 } },
};
function labelRarity(r){ return ({common:'Обычный',rare:'Редкий',epic:'Эпический',legendary:'Легендарный'})[r]||r; }
function tierAllowedItem(tier, it){ const order=['bronze','silver','gold']; return order.indexOf(it.minTier) <= order.indexOf(tier); }

/* ========= NAV ========= */
function showView(id){
  $$('.view').forEach(v=>v.classList.remove('active'));
  $('#view-'+id).classList.add('active');
  if(id==='inventory') renderInventory();
  if(id==='referral') renderReferral();
  if(id==='roulette') resetResult();
  if(id==='play') crashResizeCanvas();
}
function bindNav(){
  $$('.tab-btn').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  $$('[data-goto]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.goto)));
}

/* ========= REFERRAL ========= */
function ensureRefLink(){ const url=new URL(location.href); const me='cf_demo_user'; url.searchParams.set('ref', me); $('#ref-link').textContent = url.toString(); }
function renderReferral(){ ensureRefLink(); $('#ref-clicks').textContent=state.ref.clicks??0; $('#ref-joins').textContent=state.ref.joins??0; $('#ref-earn').textContent=`${state.ref.earn??0} ⭐`; }
function bindReferral(){ $('#copy-ref').addEventListener('click',async()=>{ try{await navigator.clipboard.writeText($('#ref-link').textContent.trim()); toast('Ссылка скопирована');}catch{} }); }

/* ========= INVENTORY ========= */
function renderInventory(){
  const grid=$('#inventory-grid'), empty=$('#empty-inventory'); grid.innerHTML='';
  if(!state.inventory.length){ empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  state.inventory.forEach((it, idx)=>{
    const card=document.createElement('div'); card.className='card';
    card.innerHTML=`
      <div class="card-head">
        <div class="emoji">${it.emoji}</div>
        <div>
          <div class="item-name">${it.name}</div>
          <div class="badge">${labelRarity(it.rarity)}</div>
        </div>
      </div>
      <div class="row">
        <div class="price">${it.value.toLocaleString('ru-RU')} ⭐</div>
        <button class="ghost sell">Продать</button>
      </div>`;
    card.querySelector('.sell').addEventListener('click', ()=>{
      state.stars += it.value; state.inventory.splice(idx,1); saveState(); setBalanceView(); renderInventory();
      toast(`+${it.value.toLocaleString('ru-RU')} ⭐`);
    });
    grid.appendChild(card);
  });
}

/* ========= ROULETTE ========= */
let spinning=false, currentPrize=null;
function weightedRandom(tier){
  const w=TIERS[tier].weights; const roll=Math.random()*(w.common+w.rare+w.epic+(w.legendary||0)); let acc=0;
  for(const k of ['common','rare','epic','legendary']){ acc += (w[k]||0); if(roll<=acc) return k; }
  return 'common';
}
function choosePrize(tier){
  const rarity=weightedRandom(tier);
  const pool=ITEMS.filter(it=>it.rarity===rarity && tierAllowedItem(tier,it));
  const arr=pool.length?pool:ITEMS.filter(it=>tierAllowedItem(tier,it));
  return arr[Math.floor(Math.random()*arr.length)];
}
function buildTrack(target){
  const track=$('#wheel-track'); track.innerHTML='';
  const filler=[]; for(let i=0;i<28;i++) filler.push(ITEMS[Math.floor(Math.random()*ITEMS.length)]);
  const targetIndex=22+Math.floor(Math.random()*3); filler.splice(targetIndex,0,target);
  filler.forEach(it=>{
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`<div class="i-emoji">${it.emoji}</div><div class="i-name">${it.name}</div><div class="i-rare">${labelRarity(it.rarity)}</div>`;
    track.appendChild(el);
  });
  return targetIndex;
}
function animateSpinToIndex(targetIndex){
  const track=$('#wheel-track'), wheel=$('#wheel');
  track.style.transition='none'; track.style.transform='translateX(0px)';
  const it=$$('.item', track)[0].getBoundingClientRect(); const itemW=it.width+12;
  const center=(wheel.getBoundingClientRect().width/2)-(it.width/2);
  const dist=targetIndex*itemW-center; const time=4600+Math.floor(Math.random()*650); const bez='cubic-bezier(0.08,0.88,0.13,1)';
  requestAnimationFrame(()=>{ track.style.transition=`transform ${time}ms ${bez}`; track.style.transform=`translateX(${-dist}px)`; });
  return new Promise(res=>{ const onEnd=()=>{track.removeEventListener('transitionend',onEnd);res();}; track.addEventListener('transitionend',onEnd); });
}
function resetResult(){ $('#spin-result').classList.add('hidden'); currentPrize=null; }
async function spin(tier){
  if(spinning) return;
  const price=TIERS[tier].price;
  if(state.stars<price){ toast(`Не хватает ⭐ (нужно ${price})`); return; }
  spinning=true; state.stars-=price; saveState(); setBalanceView();
  const prize=choosePrize(tier); currentPrize=structuredClone(prize);
  const idx=buildTrack(prize); await animateSpinToIndex(idx);
  $('#res-emoji').textContent=prize.emoji; $('#res-name').textContent=prize.name; $('#res-rare').textContent=labelRarity(prize.rarity);
  $('#sell-amount').textContent=prize.value.toLocaleString('ru-RU'); $('#spin-result').classList.remove('hidden'); spinning=false;
}
function bindRoulette(){
  $$('.spin-btn').forEach(b=>b.addEventListener('click',()=>spin(b.dataset.tier)));
  $('#btn-take').addEventListener('click',()=>{ if(!currentPrize)return; state.inventory.push(currentPrize); saveState(); renderInventory(); resetResult(); toast(`Получено: ${currentPrize.name}`); });
  $('#btn-sell').addEventListener('click',()=>{ if(!currentPrize)return; const v=currentPrize.value; state.stars+=v; saveState(); setBalanceView(); resetResult(); toast(`+${v.toLocaleString('ru-RU')} ⭐`); });
}

/* ========= CRASH — CONTINUOUS ROUNDS ========= */
const NAMES = ["Luna","Max","Arty","Mira","Ken","Sol","Niko","Foxy","Dino","Ari","Maks","Rai","Neo","Eli","Kiki","Nana","Kira","Vik","Leo","Kat"];
const AVA  = ["🦊","🐼","🐵","🐱","🐸","🐯","🦄","🐶","🦁","🐨","🐷","🐹","🐰","🐻","🐼","🐲","🦉","🐧","🐙","🐳"];
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

const crash = {
  // canvas & draw
  canvas: null, ctx: null, w: 0, h: 0, raf: 0,
  // round machine
  state: 'countdown',     // countdown | running | boom | cooldown
  countdown: 5.0,
  startTime: 0,
  mult: 1.0,
  crashAt: 1.0,
  // user
  queued: false,
  queuedBet: 0,
  queuedAuto: 1.7,
  activeBet: 0,
  cashed: false,
  // participants
  bots: [],
  feed: []
};

function crashResizeCanvas(){
  const c = $('#crash-canvas');
  const rect = c.parentElement.getBoundingClientRect();
  c.width = Math.floor(rect.width*2);
  c.height = Math.floor(rect.height*2);
  crash.w = c.width; crash.h = c.height; crash.canvas = c; crash.ctx = c.getContext('2d');
  crashDrawFrame();
}

function crashRandomPoint(){
  // 90% ≤ 2x, 9% 2–5x, 1% >5x
  const r = Math.random();
  if (r < 0.90) return 1.05 + Math.random()*0.95;  // 1.05–2.0
  if (r < 0.99) return 2.0 + Math.random()*3.0;    // 2–5
  return 5.0 + Math.random()*10.0;                 // 5–15
}

function crashFormatMult(x){ return (x).toFixed(2)+'×'; }
function crashSetBadge(text){ $('#crash-badge').textContent=text; }
function setStatus(text){ $('#crash-status').textContent=text; }
function setMultText(x){ $('#crash-mult').textContent = crashFormatMult(x); }
function setControls(){
  $('#crash-cashout').disabled = !(crash.state==='running' && crash.activeBet>0 && !crash.cashed);
  $('#crash-leave').disabled = !crash.queued;
  $('#queued-hint').classList.toggle('hidden', !crash.queued);
}

function addFeed(msg, good=true){
  const el = document.createElement('div');
  el.className = 'feed-item';
  el.innerHTML = `<span>${msg}</span><span class="${good?'pos':'neg'}">${good?'+':'–'}</span>`;
  $('#crash-feed').prepend(el);
  const list = $$('#crash-feed .feed-item'); if(list.length>50) list.pop().remove();
}
function addRound(mult){
  state.rounds.unshift({ mult, time: Date.now() });
  if(state.rounds.length>30) state.rounds.length = 30;
  const wrap = $('#rounds-feed'); wrap.innerHTML = '';
  state.rounds.forEach(r=>{
    const d = document.createElement('div'); d.className='feed-item';
    d.innerHTML = `<span>Раунд</span><span>${crashFormatMult(r.mult)}</span>`;
    wrap.appendChild(d);
  });
  saveState();
}

function renderPlayersGrid(){
  const g = $('#players-grid'); g.innerHTML='';
  crash.bots.forEach(b=>{
    const a = document.createElement('div'); a.className='avatar'; a.title = `${b.name} • ${b.bet}⭐`;
    a.textContent = b.ava; g.appendChild(a);
  });
}

// fake participants for round
function buildBots(){
  const count = 8 + Math.floor(Math.random()*10);
  crash.bots = [];
  for(let i=0;i<count;i++){
    const bet = [20,30,50,100,150,200,250,300,500][Math.floor(Math.random()*9)];
    // авто-кэш в основном 1.1–2.2, иногда выше
    let auto = 1.1 + Math.random()*1.1;
    if(Math.random()<0.12) auto = 2.5 + Math.random()*2.5;
    crash.bots.push({ name: pick(NAMES), ava: pick(AVA), bet, auto, alive: true });
  }
  renderPlayersGrid();
}

function crashDrawFrame(){
  const ctx = crash.ctx; if(!ctx) return;
  const w=crash.w, h=crash.h; ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,w,h);

  // soft grid
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = '#2a584a';
  ctx.beginPath();
  for(let x=0;x<w;x+=80){ ctx.moveTo(x,0); ctx.lineTo(x,h); }
  for(let y=0;y<h;y+=80){ ctx.moveTo(0,y); ctx.lineTo(w,y); }
  ctx.stroke();
  ctx.globalAlpha = 1;

  // path
  ctx.strokeStyle = '#2bd3a4';
  ctx.lineWidth = 4;
  ctx.beginPath();
  const dur = Math.max(0, (Date.now()-crash.startTime)/1000);
  const maxT = (crash.state==='running') ? dur : (crash.state==='boom' ? Math.log(crash.crashAt)/0.32 : 0);
  const k = 0.32;
  for(let t=0;t<=maxT;t+=0.02){
    const m = Math.exp(k*t);
    const nx = Math.min(1,(m-1)/10), ny = nx;
    const x = 40 + (w-120)*nx;
    const y = h-60 - (h-140)*ny;
    if(t===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.stroke();

  // Boom label
  if(crash.state==='boom'){
    ctx.fillStyle = '#ff7a7a';
    ctx.beginPath(); ctx.arc(w-100, 60, 18, 0, Math.PI*2); ctx.fill();
    ctx.font = 'bold 36px ui-sans-serif'; ctx.fillStyle = '#ff7a7a';
    ctx.fillText('BOOM!', w-210, 70);
  }

  // Rocket emoji position
  const rocket = $('#rocket');
  if(crash.state==='running'){
    const t = (Date.now()-crash.startTime)/1000;
    const m = Math.exp(0.32*t);
    const px = 40 + ( (rocket.parentElement.getBoundingClientRect().width*2 - 200) ) * Math.min(1,(m-1)/10);
    const py = (rocket.parentElement.getBoundingClientRect().height*2 - 120) - ( (rocket.parentElement.getBoundingClientRect().height*2 - 220) )*Math.min(1,(m-1)/10);
    rocket.style.transform = `translate(${px/2}px, ${py/2}px) rotate(-12deg)`;
  }else{
    rocket.style.transform = `translate(0px,0px)`;
  }
}

/* ----- Round state machine ----- */
function toCountdown(sec=5){
  crash.state='countdown'; crash.countdown=sec; crash.cashed=false; crash.activeBet=0; setMultText(1.00);
  setStatus('Следующий старт через '+crash.countdown.toFixed(1)+'s');
  crashSetBadge('Подготовка…'); setControls();
}
function toRunning(){
  crash.state='running'; crash.startTime=Date.now(); crash.crashAt=crashRandomPoint(); crash.cashed=false;
  crashSetBadge('Летим…'); setStatus('Идёт раунд');
  // если пользователь в очереди — списываем ставку
  if(crash.queued){
    const bet = Math.max(1, Math.floor( +$('#crash-bet').value || crash.queuedBet ));
    if(bet>state.stars){ crash.queued=false; setControls(); toast('Не хватает ⭐ на ставку', 'crash-toast'); }
    else{
      state.stars -= bet; setBalanceView(); saveState();
      crash.activeBet = bet; crash.queuedBet = bet; crash.queuedAuto = Math.max(1.01, +$('#auto-cash').value || 1.7);
      addFeed(`Ты вошёл: ${bet} ⭐ • авто ${crash.queuedAuto.toFixed(2)}×`);
    }
  }
  setControls();
}
function toBoom(){
  crash.state='boom';
  setStatus('Взорвалась на '+crashFormatMult(crash.crashAt));
  crashSetBadge('💥 Boom');
  // проигрыш пользователя, если не кэшаутнул
  if(crash.activeBet>0 && !crash.cashed){
    addFeed(`Ты проиграл ставку ${crash.activeBet} ⭐`, false);
  }
  // закрываем раунд
  addRound(crash.crashAt);
  // сбрасываем активную ставку
  crash.activeBet = 0;
  // небольшая «вспышка»
  $('#rocket').style.transition='filter 120ms'; $('#rocket').style.filter='drop-shadow(0 0 16px rgba(255,80,80,.9))';
  setTimeout(()=>$('#rocket').style.filter='',160);
}
function toCooldown(sec=5){
  crash.state='cooldown'; crash.countdown=sec;
  crashSetBadge('Ожидание…'); setStatus('Новый раунд скоро');
}

/* Main loop */
function loop(){
  // timers
  if(crash.state==='countdown' || crash.state==='cooldown'){
    crash.countdown -= 0.016;
    if(crash.state==='countdown'){
      setStatus('Следующий старт через '+Math.max(0,crash.countdown).toFixed(1)+'s');
      if(crash.countdown<=0){ buildBots(); toRunning(); }
    }else if(crash.state==='cooldown'){
      if(crash.countdown<=0) toCountdown(5);
    }
  }
  // running
  if(crash.state==='running'){
    const t = (Date.now()-crash.startTime)/1000;
    crash.mult = Math.max(1.0, Math.exp(0.32*t));
    setMultText(crash.mult);

    // авто-кэш юзера
    if(crash.activeBet>0 && !crash.cashed && crash.mult>=crash.queuedAuto){
      doCashout(true);
    }

    // боты кэшаутят
    crash.bots.forEach(b=>{
      if(b.alive && crash.mult>=b.auto){
        b.alive=false;
        const win = Math.floor(b.bet*b.auto);
        addFeed(`${b.ava} ${b.name} забрал на ${b.auto.toFixed(2)}×  (+${win}⭐)`);
      }
    });

    // конец
    if(crash.mult>=crash.crashAt){
      toBoom();
      toCooldown(5);
    }
  }

  // draw
  crashDrawFrame();
  crash.raf = requestAnimationFrame(loop);
}

/* User actions */
function queueJoin(){
  crash.queued = true;
  crash.queuedBet = Math.max(1, Math.floor(+$('#crash-bet').value||100));
  crash.queuedAuto = Math.max(1.01, +$('#auto-cash').value||1.7);
  setControls();
  toast('Ты в очереди на следующий раунд', 'crash-toast');
}
function leaveQueue(){
  crash.queued = false; setControls();
  toast('Ты покинул очередь', 'crash-toast');
}
function doCashout(auto=false){
  if(!(crash.state==='running' && crash.activeBet>0 && !crash.cashed)) return;
  crash.cashed = true;
  const payout = Math.floor(crash.activeBet * crash.mult);
  state.stars += payout; setBalanceView(); saveState();
  addFeed(`Ты ${auto?'авто-':''}забрал на ${crashFormatMult(crash.mult)}  (+${payout}⭐)`);
  $('#confetti').classList.remove('hidden'); setTimeout(()=>$('#confetti').classList.add('hidden'), 900);
}

function bindCrashUI(){
  window.addEventListener('resize', crashResizeCanvas);
  $('#join-next').addEventListener('click', queueJoin);
  $('#crash-leave').addEventListener('click', leaveQueue);
  $('#crash-cashout').addEventListener('click', ()=>doCashout(false));
  // быстрые кнопки ставки
  $$('.stake-buttons button').forEach(b=>{
    b.addEventListener('click',()=>{
      const inp=$('#crash-bet'); let v=+inp.value||0;
      if(b.dataset.bmul){ v=Math.max(1, Math.floor(v*+b.dataset.bmul)); }
      if(b.dataset.bmax){ v = state.stars; }
      inp.value = Math.max(1, Math.floor(v));
    });
  });
  // актив (звезды единственные сейчас)
  $$('.asset-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{ if(btn.classList.contains('disabled')) return; $$('.asset-btn').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); });
  });
}

/* ========= INIT ========= */
function initCrash(){
  crashResizeCanvas();
  buildBots();
  toCountdown(5);
  loop();
  setControls();
  $('#crash-ticker').textContent = 'Онлайн-режим: раунды идут непрерывно. Стань участником следующего раунда!';
}

/* ========= BOOT ========= */
loadState(); setBalanceView();
bindNav(); bindReferral(); bindRoulette(); bindCrashUI(); initCrash();
showView('home');
