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

  // 先用上次查到的資料（或設定檔）畫出來，查到最新資料再重畫
  renderEvents(container, events);
  events.forEach(function (ev) {
    if (!seatsEnabled(ev)) return;
    requestSeats(ev.formId)
      .then(function (d) {
        if (!d || d.error) throw new Error("no data");
        writeSeatsCache(ev.formId, d);
        renderEvents(container, events);
      })
      .catch(function () {
        seatsFailed[ev.formId] = true;
        renderEvents(container, events);
      });
  });
});

function renderEvents(container, events) {
  container.innerHTML = "";
  var cards = [];
  events.forEach(function (ev) {
    var d = seatsEnabled(ev) ? readSeatsCache(ev.formId) : null;
    var schedule = ev.autoSchedule && d && d.schedule && d.schedule.length ? d.schedule.slice(0, 2) : null;
    if (schedule) {
      // 跟夥伴表單連動：本場＋下一場，各一張卡片
      schedule.forEach(function (item) { cards.push(scheduleCard(ev, item, d)); });
    } else {
      var card = buildCard(ev, ev.date);
      if (seatsEnabled(ev)) {
        if (d && d.capacity) {
          showSeats(card, ev, d);
        } else if (!d && !seatsFailed[ev.formId]) {
          var seats = card.querySelector(".event-seats");
          seats.hidden = false;
          seats.textContent = "👥 剩餘名額查詢中，請稍後...";
        }
      }
      cards.push(card);
    }
  });

  cards.forEach(function (card, i) {
    // 場次數是單數時，最後一張卡片撐滿整行，不要落單留空白（跟「陸續公布」卡片同樣邏輯）
    if (cards.length % 2 === 1 && i === cards.length - 1) card.classList.add("event-card-wide");
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
}

function buildCard(ev, date) {
  var card = document.createElement("div");
  card.className = "event-card";
  card.innerHTML =
    '<div class="event-tags"><span class="event-tag"></span><span class="event-status" hidden></span></div>' +
    '<div class="event-date"></div>' +
    '<div class="event-title"></div>' +
    '<p class="event-desc"></p>' +
    '<div class="event-location"></div>' +
    '<div class="event-price"></div>' +
    '<div class="event-seats" hidden></div>' +
    '<a class="btn-primary event-cta" target="_blank" rel="noopener">立即報名 →</a>';
  card.querySelector(".event-tag").textContent = ev.tag;
  card.querySelector(".event-date").textContent = date;
  card.querySelector(".event-title").textContent = ev.title;
  card.querySelector(".event-desc").textContent = ev.description;
  card.querySelector(".event-location").textContent = "📍 " + ev.location;
  card.querySelector(".event-price").textContent = "💰 " + ev.price;
  card.querySelector(".event-cta").href = ev.formUrl;
  return card;
}

// 夥伴表單連動的場次卡片：報名中 → 顯示剩餘名額；還沒開放 → 顯示開放日，按鈕反灰
function scheduleCard(ev, item, d) {
  var card = buildCard(ev, formatScheduleDate(item.date));
  var seats = card.querySelector(".event-seats");
  seats.hidden = false;
  if (item.open) {
    if (d.capacity > 0 && d.left > 0 && d.open !== false) {
      setStatus(card, "報名中", "is-open");
      showSeats(card, ev, d);
    } else if (d.capacity > 0) {
      setStatus(card, "已額滿", "is-soon");
      seats.textContent = "👥 名額 " + d.capacity + " 位｜已額滿";
      seats.classList.add("is-full");
      disableCta(card, "已額滿，歡迎報名下一場");
    } else {
      setStatus(card, "名額安排中", "is-soon");
      seats.textContent = "👥 名額安排中，夥伴排定後陸續開放";
      disableCta(card, "名額安排中，請稍後再來看看");
    }
  } else {
    var when = item.status.replace(/\s*開放$/, "");
    setStatus(card, "尚未開放", "is-soon");
    seats.textContent = "🗓 " + (when === "上一場結束後" ? "上一場結束後開放報名" : when + " 開放報名");
    disableCta(card, when === "上一場結束後" ? "上一場結束後開放報名" : when + " 開放報名");
  }
  return card;
}

function setStatus(card, text, cls) {
  var el = card.querySelector(".event-status");
  el.textContent = text;
  el.classList.add(cls);
  el.hidden = false;
}

function disableCta(card, text) {
  var cta = card.querySelector(".event-cta");
  cta.textContent = text;
  cta.removeAttribute("href");
  cta.classList.add("is-disabled");
  cta.setAttribute("aria-disabled", "true");
}

// 「2026/11/30（一）」→「2026年11月30日（一）」；沒寫年份就是「11月30日（一）」
function formatScheduleDate(s) {
  var m = /^\s*(?:(\d{4})\s*[\/.\-年]\s*)?(\d{1,2})\s*[\/月]\s*(\d{1,2})\s*日?\s*(.*)$/.exec(s);
  if (!m) return s;
  return (m[1] ? m[1] + "年" : "") + (+m[2]) + "月" + (+m[3]) + "日" + m[4];
}

// ------------------------------------------------------------
// 剩餘名額：向「名額控管」Apps Script 查詢（設定見 upcoming-events-config.js 的 SEATS_API_URL / formId）
// Apps Script 回應要好幾秒，所以：
//   ・網頁一載入就先發出查詢，不等卡片畫好
//   ・上次查到的數字存在瀏覽器裡，再次打開時先直接顯示，查到新數字再更新
//   ・第一次來、還沒有數字時先顯示「剩餘名額查詢中，請稍後...」
// 查不到（沒設定、網路問題）就不顯示，報名按鈕照常可用
// ------------------------------------------------------------
function seatsEnabled(ev) {
  return typeof SEATS_API_URL !== "undefined" && !!SEATS_API_URL && !!ev.formId;
}

var seatsRequests = {};
var seatsFailed = {};
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
  seats.hidden = false;
  if (d.left <= 0 || d.open === false) {
    seats.textContent = "👥 名額 " + d.capacity + " 位｜已額滿";
    seats.classList.add("is-full");
    disableCta(card, "已額滿，下一場請關注官方 LINE");
  } else {
    seats.innerHTML = "👥 名額 " + d.capacity + " 位｜目前剩餘 <b></b> 位";
    seats.querySelector("b").textContent = d.left;
    if (d.left <= 3) seats.classList.add("is-low");
  }
}
