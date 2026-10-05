// ============================================================
// 近期義整活動渲染
// 讀取 upcoming-events-config.js 裡的 UPCOMING_EVENTS_CONFIG，自動產生活動卡片。
// 不需要手動修改這個檔案——內容都在 upcoming-events-config.js 設定。
//
// 用法：在 HTML 裡放一個容器，網站會自動找到它並塞入內容：
//   <div class="events-grid" id="upcoming-events"></div>
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  var container = document.getElementById("upcoming-events");
  if (!container || typeof UPCOMING_EVENTS_CONFIG === "undefined") return;

  var events = UPCOMING_EVENTS_CONFIG.slice().sort(function (a, b) {
    return a.order - b.order;
  });

  container.innerHTML = "";

  events.forEach(function (ev, i) {
    var card = document.createElement("div");
    card.className = "event-card";
    // 場次數是單數時，最後一張卡片撐滿整行，不要落單留空白（跟「陸續公布」卡片同樣邏輯）
    if (events.length % 2 === 1 && i === events.length - 1) {
      card.classList.add("event-card-wide");
    }
    card.innerHTML =
      '<span class="event-tag"></span>' +
      '<div class="event-date"></div>' +
      '<div class="event-title"></div>' +
      '<p class="event-desc"></p>' +
      '<div class="event-location"></div>' +
      '<div class="event-price"></div>' +
      '<div class="event-seats" hidden></div>' +
      '<a class="btn-primary event-cta" target="_blank" rel="noopener">立即報名 →</a>';
    card.querySelector(".event-tag").textContent = ev.tag;
    card.querySelector(".event-date").textContent = ev.date;
    card.querySelector(".event-title").textContent = ev.title;
    card.querySelector(".event-desc").textContent = ev.description;
    card.querySelector(".event-location").textContent = "📍 " + ev.location;
    card.querySelector(".event-price").textContent = "💰 " + ev.price;
    card.querySelector(".event-cta").href = ev.formUrl;
    loadSeats(card, ev);
    container.appendChild(card);
  });

  // 固定的「陸續公布」卡片，不用寫進設定檔
  var moreCard = document.createElement("div");
  moreCard.className = "event-more";
  moreCard.innerHTML =
    '<span class="event-tag">陸續公布</span>' +
    '<p>接下來的志工守護日與體驗會場次，第一手都在官方 LINE 公布。有任何問題也歡迎直接私訊，我們一對一回覆。</p>' +
    '<a class="btn-outline" href="https://lin.ee/YjZwpzZ">加入官方 LINE，接收活動公告</a>';
  container.appendChild(moreCard);
});

// ------------------------------------------------------------
// 剩餘名額：向「名額控管」Apps Script 查詢（設定見 upcoming-events-config.js 的 SEATS_API_URL / formId）
// Apps Script 回應要好幾秒，所以：
//   ・網頁一載入就先發出查詢，不等卡片畫好
//   ・上次查到的數字存在瀏覽器裡，再次打開時先直接顯示，查到新數字再更新
//   ・第一次來、還沒有數字時不顯示「查詢中」，查到才出現
// 查不到（沒設定、網路問題）就不顯示，報名按鈕照常可用
// ------------------------------------------------------------
var seatsRequests = {};
function requestSeats(formId) {
  if (!seatsRequests[formId]) {
    seatsRequests[formId] = fetch(SEATS_API_URL + "?id=" + encodeURIComponent(formId))
      .then(function (r) { return r.json(); });
  }
  return seatsRequests[formId];
}
if (typeof SEATS_API_URL !== "undefined" && SEATS_API_URL && typeof UPCOMING_EVENTS_CONFIG !== "undefined") {
  UPCOMING_EVENTS_CONFIG.forEach(function (ev) { if (ev.formId) requestSeats(ev.formId); });
}

function readSeatsCache(formId) {
  try { return JSON.parse(localStorage.getItem("seats:" + formId)); } catch (e) { return null; }
}
function writeSeatsCache(formId, d) {
  try { localStorage.setItem("seats:" + formId, JSON.stringify(d)); } catch (e) {}
}

function showSeats(card, ev, d) {
  var seats = card.querySelector(".event-seats");
  var cta = card.querySelector(".event-cta");
  seats.classList.remove("is-full", "is-low");
  cta.textContent = "立即報名 →";
  cta.href = ev.formUrl;
  cta.classList.remove("is-disabled");
  cta.removeAttribute("aria-disabled");
  seats.hidden = false;
  if (d.left <= 0 || d.open === false) {
    seats.textContent = "👥 名額 " + d.capacity + " 位｜已額滿";
    seats.classList.add("is-full");
    cta.textContent = "已額滿，下一場請關注官方 LINE";
    cta.removeAttribute("href");
    cta.classList.add("is-disabled");
    cta.setAttribute("aria-disabled", "true");
  } else {
    seats.innerHTML = "👥 名額 " + d.capacity + " 位｜目前剩餘 <b></b> 位";
    seats.querySelector("b").textContent = d.left;
    if (d.left <= 3) seats.classList.add("is-low");
  }
}

function loadSeats(card, ev) {
  if (typeof SEATS_API_URL === "undefined" || !SEATS_API_URL || !ev.formId) return;
  var cached = readSeatsCache(ev.formId);
  if (cached && cached.capacity) showSeats(card, ev, cached);
  requestSeats(ev.formId)
    .then(function (d) {
      if (!d || d.error || !d.capacity) { card.querySelector(".event-seats").hidden = true; return; }
      writeSeatsCache(ev.formId, d);
      showSeats(card, ev, d);
    })
    .catch(function () { if (!cached) card.querySelector(".event-seats").hidden = true; });
}
