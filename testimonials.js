// ============================================================
// 學員心得輪播元件
// 讀取 testimonials-config.js 裡的 TESTIMONIALS_CONFIG，自動排版顯示。
// 固定一次顯示 3 則；超過 3 則，才會每頁 3 則自動輪播下一批
//（跟活動花絮輪播 events-carousel.js 同一種邏輯，只是一次一頁 3 則而不是一張）。
// 設定檔是空的時候，整個「學員心得」區塊會自動隱藏，不會顯示空白區塊。
// ============================================================

var TC_PAGE_SIZE = 3;

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("#testimonials-list").forEach(renderTestimonials);
});

function renderTestimonials(container) {
  // 只隱藏這個心得區塊本身，不要連旁邊/附近其他區塊一起藏起來
  var block = container.closest(".testimonials-block") || container.closest("section");

  if (typeof TESTIMONIALS_CONFIG === "undefined" || TESTIMONIALS_CONFIG.length === 0) {
    if (block) block.style.display = "none";
    return;
  }

  var pages = [];
  for (var p = 0; p < TESTIMONIALS_CONFIG.length; p += TC_PAGE_SIZE) {
    pages.push(TESTIMONIALS_CONFIG.slice(p, p + TC_PAGE_SIZE));
  }

  var index = 0;
  var AUTOPLAY_MS = 5000; // 一次要看 3 則，換頁間隔拉長一點
  var timer = null;
  var paused = false;

  container.innerHTML =
    '<div class="tc-carousel">' +
    '  <button type="button" class="tc-nav tc-prev" aria-label="上一批">‹</button>' +
    '  <div class="tc-viewport"><div class="tc-track"></div></div>' +
    '  <button type="button" class="tc-nav tc-next" aria-label="下一批">›</button>' +
    "</div>" +
    '<div class="tc-dots"></div>';

  var carouselEl = container.querySelector(".tc-carousel");
  var trackEl = container.querySelector(".tc-track");
  var dotsEl = container.querySelector(".tc-dots");
  var prevBtn = container.querySelector(".tc-prev");
  var nextBtn = container.querySelector(".tc-next");

  pages.forEach(function (pageItems) {
    var slide = document.createElement("div");
    slide.className = "tc-slide";

    var page = document.createElement("div");
    page.className = "testimonials-page";

    pageItems.forEach(function (t) {
      var card = document.createElement("div");
      card.className = "testimonial-card";

      var quote = document.createElement("p");
      quote.className = "testimonial-quote";
      quote.textContent = "「" + t.quote + "」";
      card.appendChild(quote);

      var meta = document.createElement("div");
      meta.className = "testimonial-meta";
      var metaText = t.name || "匿名學員";
      if (t.event) metaText += "・" + t.event;
      meta.textContent = metaText;
      card.appendChild(meta);

      page.appendChild(card);
    });

    slide.appendChild(page);
    trackEl.appendChild(slide);
  });

  var showNav = pages.length > 1;
  prevBtn.style.display = showNav ? "" : "none";
  nextBtn.style.display = showNav ? "" : "none";
  dotsEl.style.display = showNav ? "" : "none";

  if (showNav) {
    pages.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "tc-dot";
      dot.addEventListener("click", function () {
        index = i;
        update();
        schedule();
      });
      dotsEl.appendChild(dot);
    });
  }

  function update() {
    trackEl.style.transform = "translateX(-" + index * 100 + "%)";
    dotsEl.querySelectorAll(".tc-dot").forEach(function (dot, i) {
      dot.classList.toggle("active", i === index);
    });
  }

  function clearAdvance() {
    if (timer) { clearTimeout(timer); timer = null; }
  }
  function schedule() {
    clearAdvance();
    if (paused || pages.length <= 1) return;
    timer = setTimeout(function () {
      index = (index + 1) % pages.length;
      update();
      schedule();
    }, AUTOPLAY_MS);
  }

  prevBtn.addEventListener("click", function () {
    index = (index - 1 + pages.length) % pages.length;
    update();
    schedule();
  });
  nextBtn.addEventListener("click", function () {
    index = (index + 1) % pages.length;
    update();
    schedule();
  });
  carouselEl.addEventListener("mouseenter", function () { paused = true; clearAdvance(); });
  carouselEl.addEventListener("mouseleave", function () { paused = false; schedule(); });

  update();
  schedule();
}
