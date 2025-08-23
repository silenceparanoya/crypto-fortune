// Init Telegram WebApp
const tg = window.Telegram?.WebApp;
try { tg?.expand(); } catch(e){}

// ----- Simple state (localStorage) -----
const state = {
  balance: Number(localStorage.getItem("balance") || 0),
  inventory: JSON.parse(localStorage.getItem("inventory") || "[]"),
};
function save(){
  localStorage.setItem("balance", String(state.balance));
  localStorage.setItem("inventory", JSON.stringify(state.inventory));
}
function fmt(n){ return new Intl.NumberFormat("ru-RU").format(n); }

// ----- UI helpers -----
const menu = document.getElementById("menu");
const screens = document.querySelectorAll(".screen");
function openScreen(id){
  menu.style.display = "none";
  screens.forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  if(id === "referral") renderReferral();
  if(id === "inventory") renderInventory();
}
function back(){
  screens.forEach(s => s.classList.remove("active"));
  menu.style.display = "flex";
}

// buttons wiring
document.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => openScreen(b.dataset.open)));
document.querySelectorAll("[data-back]").forEach(b => b.addEventListener("click", back));

// ----- Referral -----
function renderReferral(){
  document.getElementById("balance").textContent = fmt(state.balance);
}
document.getElementById("btn-promo").onclick = () => alert("Скоро промо-баннеры и UTM-ссылки 🚀");
document.getElementById("btn-invite").onclick = () => {
  const refId = tg?.initDataUnsafe?.user?.id || Math.floor(Math.random()*1e6);
  const link = `https://t.me/YOUR_BOT_USERNAME?start=${refId}`;
  navigator.clipboard?.writeText(link);
  alert(`Реф.ссылка скопирована:\n${link}`);
};

// ----- Inventory -----
function renderInventory(){
  const list = document.getElementById("inventory-list");
  const empty = document.getElementById("inventory-empty");
  list.innerHTML = "";
  if(state.inventory.length === 0){ empty.style.display = "block"; return; }
  empty.style.display = "none";
  for(const item of state.inventory){
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h4>${item.title}</h4><p>${item.desc}</p>`;
    list.appendChild(card);
  }
}
document.getElementById("btn-withdraw").onclick = () => alert("Вывод скоро будет доступен ❌");
document.getElementById("btn-sell").onclick = () => alert("Внутренняя биржа скоро будет доступна 💱");

// ----- Roulette -----
const wheel = document.getElementById("wheel");
let spinning = false;

function spin(price){
  price = Number(price);
  if(spinning) return;
  if(state.balance < price){
    alert(`Недостаточно ⭐. Нужно ${fmt(price)}⭐, у тебя ${fmt(state.balance)}⭐`);
    return;
  }
  spinning = true;
  state.balance -= price; save(); renderReferral();

  const outcomes = [
    { t: "⭐ 50 Stars", stars: 50 },
    { t: "⭐ 200 Stars", stars: 200 },
    { t: "🎁 NFT подарок", stars: 0, nft: true },
    { t: "❌ Ничего", stars: 0 },
    { t: "⭐ 500 Stars", stars: 500 },
  ];
  const prize = outcomes[Math.floor(Math.random() * outcomes.length)];

  // простая анимация вращения
  const turns = 6 + Math.floor(Math.random()*3);
  wheel.style.transition = "transform 2.2s cubic-bezier(.2,.8,.2,1)";
  wheel.style.transform = `rotate(${turns*360}deg)`;

  setTimeout(() => {
    wheel.style.transition = ""; wheel.style.transform = "";
    if(prize.stars) { state.balance += prize.stars; save(); renderReferral(); }
    if(prize.nft){
      state.inventory.push({ title: "NFT Mystery Box", desc: "Можно вывести или продать за ⭐" });
      save(); renderInventory();
    }
    alert(`Результат: ${prize.t}`);
    spinning = false;
  }, 2300);
}

document.querySelectorAll("[data-spin]").forEach(b => b.addEventListener("click", () => spin(b.dataset.spin)));

// ---- Demo: дадим чуть стартовых звёзд, если пусто ----
if(state.balance === 0){
  state.balance = 500; // стартовый бонус для теста UI
  save();
}
renderReferral();
