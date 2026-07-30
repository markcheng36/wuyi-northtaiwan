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

  events.forEach(function (ev) {
    var card = document.createElement("div");
    card.className = "event-card";
    card.innerHTML =
      '<span class="event-tag"></span>' +
      '<div class="event-date"></div>' +
      '<div class="event-title"></div>' +
      '<p class="event-desc"></p>' +
      '<div class="event-location"></div>';
    card.querySelector(".event-tag").textContent = ev.tag;
    card.querySelector(".event-date").textContent = ev.date;
    card.querySelector(".event-title").textContent = ev.title;
    card.querySelector(".event-desc").textContent = ev.description;
    card.querySelector(".event-location").textContent = "📍 " + ev.location;
    container.appendChild(card);
  });

  // 固定的「陸續公布」卡片，不用寫進設定檔
  var moreCard = document.createElement("div");
  moreCard.className = "event-more";
  moreCard.innerHTML =
    '<span class="event-tag">陸續公布</span>' +
    '<p>接下來我們也會走進更多社區、運動現場與公益團體，無償分享這份心法。實際場次與時間，第一手都在官方 LINE 公布。</p>' +
    '<a class="btn-outline" href="https://line.me/R/ti/p/@strxhunter">加官方 LINE 看場次</a>';
  container.appendChild(moreCard);
});
