/* ========= STATE ========= */
const STORAGE_KEY = 'cf_demo_v2';
const state = { stars: 0, inventory: [], ref: { clicks: 0, joins: 0, earn: 0 }, history: [] };
function loadState(){ try{const raw=localStorage.getItem(STORAGE_KEY); if(raw)Object.assign(state, JSON.parse(raw)); if(!state.stars)state.stars=1000;}catch{state.stars=1000;} }
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
function setBalanceView(){ $('#stars-balance').textContent = state.stars.toLocaleString('ru-RU'); }
function toast(msg, id='toast'){ const t = $('#'+id); t.textContent = msg; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'), 1800); }

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
function tierAllowedItem(tier, it){ const order=['bronze','silver','gold']; return order.indexOf(it.minTier) <= order.indexOf(tier); }
function labelRarity(r){ return ({common:'Обычный',rare:'Редкий',epic:'Эпический',legendary:'Легендарный'})[r]||r; }

/* ========= NAV ========= */
function showView(id){ $$('.view').forEach(v=>v.classList.remove('active')); $('#view-'+id).classList.add('active'); if(id==='inventory')renderInventory(); if(id==='referral')renderReferral(); if(id==='roulette')resetResult(); if(id==='play') crashResizeCanvas(); }
function bindNav(){ $$('.tab-btn').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view))); $$('[data-goto]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.goto))); }

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
  const filler=[]; for(let i=0;i<24;i++) filler.push(ITEMS[Math.floor(Math.random()*ITEMS.length)]);
  const targetIndex=20+Math.floor(Math.random()*3); filler.splice(targetIndex,0,target);
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
  const items=$$('.item', track); const sample=items[0].getBoundingClientRect(); const itemW=sample.width+12;
  const center=(wheel.getBoundingClientRect().width/2)-(sample.width/2);
  const dist=targetIndex*itemW-center; const time=4500+Math.floor(Math.random()*600); const bez='cubic-bezier(0.08,0.88,0.13,1)';
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
  $('#btn-take').addEventListener('click',()=>{ if(!currentPrize)return; state.inventory.push(currentPrize); state.history.push({t:Date.now(),action:'take',item:currentPrize.id}); saveState(); renderInventory(); resetResult(); toast(`Получено: ${currentPrize.name}`); });
  $('#btn-sell').addEventListener('click',()=>{ if(!currentPrize)return; const v=currentPrize.value; state.stars+=v; state.history.push({t:Date.now(),action:'sell',item:currentPrize.id,value:v}); saveState(); setBalanceView(); resetResult(); toast(`+${v.toLocaleString('ru-RU')} ⭐`); });
}

/* ========= CRASH (DEMO) ========= */
const crash = {
  canvas: null, ctx: null,
  w: 0, h: 0,
  running: false, exploded: false, cashed: false,
  startTime: 0, mult: 1.0, crashAt: 1.0, bet: 0, locked: 0,
  raf: 0
};
function crashResizeCanvas(){
  const c = $('#crash-canvas');
  const rect = c.parentElement.getBoundingClientRect();
  c.width = Math.floor(rect.width*2); c.height = Math.floor(rect.height*2);
  crash.w = c.width; crash.h = c.height; crash.canvas = c; crash.ctx = c.getContext('2d'); crashDrawFrame();
}
function crashRandomPoint(){
  // распределение, чаще низкие значения, иногда высоко:
  // 90% ≤ 2.0x, 9% 2–5x, 1% >5x
  const r = Math.random();
  if (r < 0.90) return 1.1 + Math.random()*0.9;       // 1.1–2.0
  if (r < 0.99) return 2.0 + Math.random()*3.0;       // 2–5
  return 5.0 + Math.random()*10.0;                    // 5–15
}
function crashSetStatus(text){ $('#crash-status').textContent=text; }
function crashFormatMult(x){ return x.toFixed(2)+'×'; }
function crashUpdateUI(){
  $('#crash-mult').textContent = crashFormatMult(crash.mult);
  $('#crash-start').disabled = crash.running;
  $('#crash-cashout').disabled = !(crash.running && !crash.exploded);
  $('#crash-reset').disabled = !(crash.exploded || crash.cashed);
}
function crashDrawFrame(){
  const ctx = crash.ctx; if(!ctx) return;
  const w=crash.w, h=crash.h; ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,w,h);

  // сетка/звёзды
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = '#2a584a';
  ctx.beginPath();
  for(let x=0;x<w;x+=80){ ctx.moveTo(x,0); ctx.lineTo(x,h); }
  for(let y=0;y<h;y+=80){ ctx.moveTo(0,y); ctx.lineTo(w,y); }
  ctx.stroke();
  ctx.globalAlpha = 1;

  // кривая траектории (лог-спираль)
  ctx.strokeStyle = '#2bd3a4';
  ctx.lineWidth = 4;
  ctx.beginPath();
  const dur = Math.max(1, (Date.now()-crash.startTime)/1000);
  const maxT = crash.running ? dur : 0;
  const k = 0.32; // скорость роста
  for(let t=0;t<maxT;t+=0.02){
    const m = Math.exp(k*t); // множитель
    const x = 40 + (w-120) * Math.min(1, (m-1)/10); // нормируем
    const y = h-60 - (h-140) * Math.min(1, (m-1)/10);
    if(t===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.stroke();

  // отметка «взорвался»
  if(crash.exploded){
    ctx.fillStyle = '#ff7a7a';
    ctx.beginPath(); ctx.arc(w-100, 60, 18, 0, Math.PI*2); ctx.fill();
    ctx.font = 'bold 36px ui-sans-serif'; ctx.fillStyle = '#ff7a7a';
    ctx.fillText('BOOM!', w-210, 70);
  }

  // позиция ракеты (двигаем emoji элемент)
  const rocket = $('#rocket');
  if(crash.running){
    const t = (Date.now()-crash.startTime)/1000;
    const m = Math.exp(0.32*t);
    const px = 40 + ( (rocket.parentElement.getBoundingClientRect().width*2 - 200) ) * Math.min(1,(m-1)/10);
    const py = (rocket.parentElement.getBoundingClientRect().height*2 - 120) - ( (rocket.parentElement.getBoundingClientRect().height*2 - 220) )*Math.min(1,(m-1)/10);
    rocket.style.transform = `translate(${px/2}px, ${py/2}px) rotate(-12deg)`;
  }else{
    rocket.style.transform = `translate(0px,0px)`;
  }
}
function crashLoop(){
  if(!crash.running){ crashDrawFrame(); return; }
  const t = (Date.now()-crash.startTime)/1000;
  crash.mult = Math.max(1.0, Math.exp(0.32*t)); // растёт экспоненциально
  $('#crash-mult').textContent = crashFormatMult(crash.mult);

  if(crash.mult >= crash.crashAt){
    // взрыв
    crash.exploded = true; crash.running = false;
    crashSetStatus('Взорвалась на '+crashFormatMult(crash.crashAt));
    $('#crash-cashout').disabled = true;
    $('#crash-reset').disabled = false;
    // ставка сгорела — уже списали при старте
    state.history.push({t:Date.now(),action:'crash_boom',bet:crash.bet,at:crash.crashAt});
    saveState();
    // анимация вспышки
    const rocket = $('#rocket'); rocket.style.transition='filter 120ms'; rocket.style.filter='drop-shadow(0 0 16px rgba(255,80,80,.9))'; setTimeout(()=>{rocket.style.filter='';},160);
  }else{
    crashSetStatus('Летим…'); 
    crash.raf = requestAnimationFrame(crashLoop);
  }
  crashDrawFrame();
  crashUpdateUI();
}
function crashStart(){
  if(crash.running) return;
  const bet = Math.max(1, Math.floor( +$('#crash-bet').value || 0 ));
  if(bet>state.stars){ toast(`Не хватает ⭐`, 'crash-toast'); return; }
  state.stars -= bet; setBalanceView(); saveState();

  crash.bet = bet; crash.locked = bet;
  crash.mult = 1.0; crash.crashAt = crashRandomPoint();
  crash.running = true; crash.exploded = false; crash.cashed=false;
  crash.startTime = Date.now(); crashSetStatus('Старт!');
  crashUpdateUI();
  cancelAnimationFrame(crash.raf);
  crashLoop();
}
function crashCashout(){
  if(!crash.running || crash.exploded) return;
  crash.running=false; crash.cashed=true;
  const payout = Math.floor(crash.bet * crash.mult);
  state.stars += payout; setBalanceView(); saveState();
  crashSetStatus('Забрано на '+crashFormatMult(crash.mult)+` (+${payout} ⭐)`);
  state.history.push({t:Date.now(),action:'crash_cashout',bet:crash.bet,at:crash.mult,payout});
  crashUpdateUI(); crashDrawFrame();
}
function crashReset(){
  crash.running=false; crash.exploded=false; crash.cashed=false; crash.mult=1.0;
  crashSetStatus('Готов к старту'); crashUpdateUI(); crashDrawFrame();
}
function bindCrash(){
  crashResizeCanvas(); window.addEventListener('resize', crashResizeCanvas);
  $('#crash-start').addEventListener('click', crashStart);
  $('#crash-cashout').addEventListener('click', crashCashout);
  $('#crash-reset').addEventListener('click', crashReset);
  // быстрые кнопки ставки
  $$('.stake-buttons button').forEach(b=>{
    b.addEventListener('click',()=>{
      const inp=$('#crash-bet'); let v=+inp.value||0;
      if(b.dataset.bmul){ v=Math.max(1, Math.floor(v*+b.dataset.bmul)); }
      if(b.dataset.bmax){ v = state.stars; }
      inp.value = Math.max(1, Math.floor(v));
    });
  });
  // выбор актива (пока только stars)
  $$('.asset-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(btn.classList.contains('disabled')) return;
      $$('.asset-btn').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

/* ========= INIT ========= */
loadState(); setBalanceView();
bindNav(); bindReferral(); bindRoulette(); bindCrash();
showView('home');
