// ====== Telegram ======
const tg = window.Telegram?.WebApp;
try { tg?.expand(); tg?.setHeaderColor?.("#0f2d2b"); } catch(e){}

// ====== State (LocalStorage) ======
const state = {
  coins: Number(localStorage.getItem("cf_coins") || 500),   // стартовый бонус
  stars: Number(localStorage.getItem("cf_stars") || 0),
  infected: Number(localStorage.getItem("cf_infected") || 0),
  curedPct: Number(localStorage.getItem("cf_cured") || 0),
  inventory: JSON.parse(localStorage.getItem("cf_inventory") || "[]"),
  history: JSON.parse(localStorage.getItem("cf_history") || "[]"),
  username: (tg?.initDataUnsafe?.user?.username ? "@"+tg.initDataUnsafe.user.username : "webapp_user"),
  name: (tg?.initDataUnsafe?.user?.first_name || "Игрок"),
  uid: (tg?.initDataUnsafe?.user?.id || 123456),
};
function save(){
  localStorage.setItem("cf_coins", state.coins);
  localStorage.setItem("cf_stars", state.stars);
  localStorage.setItem("cf_infected", state.infected);
  localStorage.setItem("cf_cured", state.curedPct);
  localStorage.setItem("cf_inventory", JSON.stringify(state.inventory));
  localStorage.setItem("cf_history", JSON.stringify(state.history));
}
function fmt(n){ return new Intl.NumberFormat("ru-RU").format(Math.trunc(n)); }
function toast(text){
  const el = document.getElementById("toast");
  el.textContent = text;
  el.classList.add("show");
  setTimeout(()=> el.classList.remove("show"), 1600);
}

// ====== Top balances & profile render ======
const coinsTop = document.getElementById("coinsTop");
const starsTop = document.getElementById("starsTop");
function renderBalances(){
  coinsTop.textContent = fmt(state.coins);
  starsTop.textContent = fmt(state.stars);
  // Profile mirrors
  document.getElementById("coinsProfile").textContent = fmt(state.coins);
  document.getElementById("starsProfile").textContent = fmt(state.stars);
  document.getElementById("infectedProfile").textContent = fmt(state.infected);
  document.getElementById("curedProfile").textContent = state.curedPct + "%";
}
renderBalances();

// ====== Navigation ======
const screens = document.querySelectorAll(".screen");
const navBtns = document.querySelectorAll(".nav-btn");
function openScreen(id){
  screens.forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  navBtns.forEach(b=>b.classList.toggle("active", b.dataset.open === id));
  if(id === "screen-inventory") renderInventory();
  if(id === "screen-history") renderHistory();
  if(id === "screen-tasks") renderTasks();
  if(id === "screen-more-tasks") renderMoreTasks();
  if(id === "screen-leaderboard") renderLeaderboard();
  if(id === "screen-profile") renderProfile();
}
document.querySelectorAll("[data-open]").forEach(b=>{
  b.addEventListener("click", ()=> openScreen(b.dataset.open));
});
// nav bar
navBtns.forEach(b=> b.addEventListener("click", ()=> openScreen(b.dataset.open)));

// ====== Profile ======
function avatarUrl(seed){
  // DiceBear initials / thumbs — быстрый генератор
  return `https://api.dicebear.com/8.x/thumbs/png?seed=${encodeURIComponent(seed)}&shapeColor=28a745,1fb0ff,f6cc3d,23c5a6`;
}
function renderProfile(){
  document.getElementById("profileName").textContent = state.name;
  const av = document.getElementById("profileAvatar");
  av.src = avatarUrl(state.username || "user");
  av.alt = state.name;
}
document.getElementById("btnProfile").onclick = ()=> openScreen("screen-profile");

// ====== Exchange (Coins -> Stars) ======
document.getElementById("btnExchange").onclick = ()=>{
  // курс: 1000 монет = 1 ⭐
  const rate = 1000;
  const can = Math.floor(state.coins / rate);
  if(!can) return toast("Мало монет для обмена (нужно ≥ 1000)");
  state.coins -= can * rate;
  state.stars += can;
  state.history.unshift({ t: Date.now(), text: `Обменял ${fmt(can*rate)}🪙 → ${fmt(can)}⭐` });
  save(); renderBalances(); renderHistory();
  toast(`+${fmt(can)}⭐`);
};

// ====== Invite + Leaderboard buttons on Home ======
document.getElementById("btnInvite").onclick = ()=>{
  const refId = state.uid;
  const link = `https://t.me/YOUR_BOT_USERNAME?start=${refId}`;
  navigator.clipboard?.writeText(link);
  toast("Реферальная ссылка скопирована");
};
document.getElementById("btnLeaderboard").onclick = ()=> openScreen("screen-leaderboard");

// ====== Carousel (рефералка / промо, автосвитч) ======
const carousel = document.getElementById("carousel");
const banners = [
  {
    icon:"⭐", title:"Партнёрская программа 100%",
    sub:"Зови друзей и получай ⭐ с каждой оплаты",
    cta:"Пригласить друга", onClick: ()=> document.getElementById("btnInvite").click()
  },
  {
    icon:"🛒", title:"Скоро Магазин",
    sub:"Скины, бустеры и спецпредложения",
    cta:"Магазин", onClick: ()=> openScreen("screen-store")
  },
];
let bannerIdx = 0;
function renderBanner(){
  const b = banners[bannerIdx % banners.length];
  carousel.innerHTML = `
    <div class="banner">
      <div class="icon">${b.icon}</div>
      <div>
        <div class="title">${b.title}</div>
        <div class="sub">${b.sub}</div>
      </div>
      <div class="cta">
        <button class="btn ghost" id="bannerBtn">${b.cta}</button>
      </div>
    </div>
  `;
  document.getElementById("bannerBtn").onclick = b.onClick;
  bannerIdx++;
}
renderBanner();
setInterval(renderBanner, 5200);

// ====== Coin rain (на главной) ======
function startCoinRain(){
  const cont = document.getElementById("coinRain");
  cont.innerHTML = "";
  for(let i=0;i<20;i++){
    const c = document.createElement("div");
    c.className = "coin";
    const left = Math.random()*100;
    const delay = Math.random()*1.5;
    const dur = 3.5 + Math.random()*2.0;
    c.style.left = left+"vw";
    c.style.animationDelay = delay+"s, "+delay+"s";
    c.style.setProperty("--dur", dur+"s");
    cont.appendChild(c);
  }
}
startCoinRain();

// ====== Tasks ======
const daily = [
  { id:"bonus", icon:"📅", title:"Ежедневный бонус", sub:"+5,000 монет", reward:5000 },
  { id:"share", icon:"📣", title:"Поделиться историей", sub:"+20,000 монет", reward:20000 },
  { id:"join",  icon:"📢", title:"Подписаться на канал", sub:"+8,000 монет", reward:8000 },
];
const quests = [
  { id:"inv10",   icon:"👥", title:"Заразить 10 друзей",  sub:"+50,000 монет", reward:50000 },
  { id:"inv50",   icon:"👥", title:"Заразить 50 друзей",  sub:"+100,000 монет", reward:100000 },
  { id:"inv100",  icon:"👥", title:"Заразить 100 друзей + NFT «Plague Doctor»", reward:200000, nft:true },
];
const bigQuests = [
  { id:"inv200",  icon:"👥", title:"Заразить 200 друзей",  sub:"+300,000 монет", reward:300000 },
  { id:"inv1000", icon:"👥", title:"Заразить 1000 друзей + NFT «Чумной доктор»", reward:1000000, nft:true },
];
const done = JSON.parse(localStorage.getItem("cf_done") || "{}");
function saveDone(){ localStorage.setItem("cf_done", JSON.stringify(done)); }

function renderTaskList(holder, arr){
  holder.innerHTML = "";
  for(const t of arr){
    const row = document.createElement("div");
    row.className = "task";
    row.innerHTML = `
      <div class="icon">${t.icon}</div>
      <div>
        <div class="title">${t.title}</div>
        <div class="sub">${t.sub || ""}</div>
      </div>
      <div>
        <button class="btn ${done[t.id]?'ghost':''}" id="t_${t.id}">
          ${done[t.id] ? "Готово ✓" : "ПРОВЕРИТЬ"}
        </button>
      </div>
    `;
    holder.appendChild(row);
    document.getElementById(`t_${t.id}`).onclick = ()=>{
      if(done[t.id]) return toast("Уже получено");
      done[t.id] = true; saveDone();
      state.coins += t.reward || 0;
      if(t.nft){
        state.inventory.unshift({title:"NFT Mystery Box", desc:"Выигран за квест"});
      }
      state.history.unshift({ t: Date.now(), text:`Квест: «${t.title}» +${fmt(t.reward||0)}🪙` });
      save(); renderBalances(); renderInventory(); renderHistory();
      renderTasks();
      toast("+ награда");
    };
  }
}
function renderTasks(){
  renderTaskList(document.getElementById("dailyList"), daily);
  renderTaskList(document.getElementById("questList"), quests);
}
document.getElementById("btnMoreTasks").onclick = ()=> openScreen("screen-more-tasks");
function renderMoreTasks(){
  renderTaskList(document.getElementById("bigQuestList"), bigQuests);
}

// ====== Leaderboard (200 фейков) ======
let LB = [];
function seededRandom(seed){
  // xorshift32
  let x = seed || 123456789;
  return ()=> (x ^= x<<13, x ^= x>>>17, x ^= x<<5, (x>>>0) / 4294967296);
}
function generateLeaderboard(){
  const rnd = seededRandom((state.uid % 999999) + 12345);
  const topics = ["NFT","DeFi","Web3","Crypto","AI","GameFi","Meme","DAO","Builder","Trader"];
  const namesA = ["Neo","Artem","Luna","Maks","Ilya","Vlad","Eren","Noah","Lira","Kira","Zoe","Inna","Dora","Kane","Rey","Kali","Nova","Mina","Maya","Sage"];
  const namesB = ["Labs","Dream","Vision","Node","Chain","X","Corp","DAO","Art","Vault","Hub","Meta","Net","Flow","LabsX","Prime","Fox","Wolf","Bear","Monk"];
  LB = [];
  for(let i=0;i<200;i++){
    const nA = namesA[Math.floor(rnd()*namesA.length)];
    const nB = namesB[Math.floor(rnd()*namesB.length)];
    const topic = topics[Math.floor(rnd()*topics.length)];
    const name = `${nA} ${topic} ${nB}`;
    const score = Math.floor(rnd()*500_000_000) + 50_000;
    const avatar = avatarUrl(name + i);
    LB.push({name, score, avatar});
  }
  // Вставим игрока в топ случайно
  LB.splice(Math.floor(rnd()*LB.length), 0, {
    name: (state.name || "Ты") + " #S", score: Math.max(state.stars*1_000_000 + state.coins*1000, 148),
    avatar: avatarUrl(state.username || "you")
  });
  LB.sort((a,b)=> b.score - a.score);
}
generateLeaderboard();

function renderLeaderboard(){
  const hold = document.getElementById("leaderboardList");
  hold.innerHTML = "";
  LB.forEach((u, i)=>{
    const row = document.createElement("div");
    row.className = "lb-row";
    row.innerHTML = `
      <div class="rank">${i+1}</div>
      <div style="display:flex;gap:10px;align-items:center">
        <img src="${u.avatar}" class="avatar" alt="">
        <div class="lb-name">${u.name}</div>
      </div>
      <div class="lb-score">🦠 ${fmt(u.score)}</div>
    `;
    hold.appendChild(row);
  });
}
document.querySelectorAll(".tab").forEach(t=>{
  t.addEventListener("click", ()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    t.classList.add("active");
    // у друзей просто покажем подмножество
    if(t.dataset.tab === "friends"){
      const small = LB.slice(0,10);
      const hold = document.getElementById("leaderboardList");
      hold.innerHTML = "";
      small.forEach((u, i)=>{
        const row = document.createElement("div");
        row.className = "lb-row";
        row.innerHTML = `
          <div class="rank">${i+1}</div>
          <div style="display:flex;gap:10px;align-items:center">
            <img src="${u.avatar}" class="avatar" alt="">
            <div class="lb-name">${u.name}</div>
          </div>
          <div class="lb-score">🦠 ${fmt(u.score)}</div>
        `;
        hold.appendChild(row);
      });
    } else {
      renderLeaderboard();
    }
  });
});

// ====== Inventory ======
function renderInventory(){
  const list = document.getElementById("inventory-list");
  const empty = document.getElementById("inventory-empty");
  list.innerHTML = "";
  if(state.inventory.length === 0){ empty.style.display = "block"; return; }
  empty.style.display = "none";
  for(const item of state.inventory){
    const div = document.createElement("div");
    div.className = "inv-item";
    div.innerHTML = `<div style="font-weight:900">${item.title}</div><div class="muted">${item.desc||""}</div>`;
    list.appendChild(div);
  }
}
document.getElementById("btn-withdraw").onclick = ()=> toast("Вывод скоро");
document.getElementById("btn-sell").onclick = ()=> toast("Биржа скоро");

// ====== History ======
function renderHistory(){
  const list = document.getElementById("historyList");
  list.innerHTML = "";
  if(state.history.length === 0){
    const p = document.createElement("p"); p.className="muted"; p.textContent="История пуста";
    list.appendChild(p); return;
  }
  state.history.slice(0,50).forEach(h=>{
    const row = document.createElement("div");
    row.className = "history-row";
    const d = new Date(h.t);
    row.innerHTML = `<span>${h.text}</span><span class="muted">${d.toLocaleString()}</span>`;
    list.appendChild(row);
  });
}

// ====== Roulette ======
const wheel = document.getElementById("wheel");
let spinning = false;
function spin(price){
  price = Number(price);
  if(spinning) return;
  if(state.stars < price){
    return toast(`Не хватает ⭐: нужно ${fmt(price)}, у тебя ${fmt(state.stars)}`);
  }
  spinning = true;
  state.stars -= price; save(); renderBalances();

  const outcomes = [
    { t:"⭐ 50 Stars", stars:50 },
    { t:"⭐ 200 Stars", stars:200 },
    { t:"🎁 NFT подарок", stars:0, nft:true },
    { t:"❌ Ничего", stars:0 },
    { t:"⭐ 500 Stars", stars:500 },
  ];
  const prize = outcomes[Math.floor(Math.random()*outcomes.length)];

  const turns = 6 + Math.floor(Math.random()*3);
  wheel.style.transition = "transform 2.2s cubic-bezier(.2,.8,.2,1)";
  wheel.style.transform = `rotate(${turns*360}deg)`;

  setTimeout(()=>{
    wheel.style.transition = ""; wheel.style.transform = "";
    let msg = `Результат: ${prize.t}`;
    if(prize.stars){
      state.stars += prize.stars;
      state.history.unshift({ t: Date.now(), text:`Рулетка: +${fmt(prize.stars)}⭐` });
    }
    if(prize.nft){
      state.inventory.unshift({ title:"NFT Mystery Box", desc:"Выигран в рулетке" });
      state.history.unshift({ t: Date.now(), text:`Рулетка: 🎁 NFT Mystery Box` });
      renderInventory();
    }
    save(); renderBalances(); renderHistory();
    toast(msg);
    spinning = false;
  }, 2300);
}
document.querySelectorAll("[data-spin]").forEach(b=> b.addEventListener("click", ()=> spin(b.dataset.spin)));

// ====== Init profile avatar/name ======
renderProfile();
renderHistory();
renderInventory();
renderTasks();
renderLeaderboard();
