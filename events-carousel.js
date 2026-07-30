// ============================================================
// 活動花絮輪播元件
// 讀取 events-config.js 裡的 EVENTS_CONFIG，自動產生標題／頁籤／輪播。
// 不需要手動修改這個檔案——內容都在 events-config.js 設定。
//
// 用法：在 HTML 裡放一個容器，網站會自動找到它並塞入內容：
//   <div id="event-gallery" data-mode="home"></div>   → 只顯示序號最小（最新）的一場
//   <div id="event-gallery" data-mode="full"></div>   → 顯示全部場次，可切換頁籤
//
// 運作方式：對每個活動資料夾，從編號 1 開始，依序用 mediatype 設定的副檔名
// 去試探有沒有這個檔案（瀏覽器實際載入一次，載得到就是有），試到抓不到才停下來。
// ============================================================

var EG_IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
var EG_VIDEO_EXTS = ["mp4", "mov", "webm", "m4v"];

function egExtKind(ext) {
  var e = ext.toLowerCase();
  if (EG_VIDEO_EXTS.indexOf(e) !== -1) return "video";
  return "image";
}

// ---- 圖片 Lightbox（點圖片彈出、可直接關掉，不用另開分頁）----
var EG_INSTANCES = []; // 記錄每個輪播的 start/stop autoplay，Lightbox 開啟時全部暫停

function egGetLightbox() {
  var box = document.getElementById("eg-lightbox-global");
  if (box) return box;

  box = document.createElement("div");
  box.className = "eg-lightbox";
  box.id = "eg-lightbox-global";
  box.innerHTML =
    '<button class="eg-lightbox-close" aria-label="關閉">×</button>' +
    '<img alt="">';
  document.body.appendChild(box);

  var imgEl = box.querySelector("img");
  var closeBtn = box.querySelector(".eg-lightbox-close");

  function close() {
    box.classList.remove("open");
    imgEl.src = "";
    EG_INSTANCES.forEach(function (inst) { inst.start(); });
  }

  closeBtn.addEventListener("click", close);
  box.addEventListener("click", function (e) {
    if (e.target === box) close(); // 點背景關閉，點圖片本身不關
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && box.classList.contains("open")) close();
  });

  box._open = function (src, alt) {
    imgEl.src = src;
    imgEl.alt = alt || "";
    box.classList.add("open");
    EG_INSTANCES.forEach(function (inst) { inst.stop(); });
  };

  return box;
}

function egOpenLightbox(src, alt) {
  egGetLightbox()._open(src, alt);
}

// 試探單一檔案存不存在（能載入＝存在），回傳 Promise<boolean>
function egProbeFile(url, kind) {
  return new Promise(function (resolve) {
    var el = kind === "video" ? document.createElement("video") : new Image();
    var done = false;
    function ok() {
      if (!done) { done = true; resolve(true); }
    }
    function fail() {
      if (!done) { done = true; resolve(false); }
    }
    el.onerror = fail;
    if (kind === "video") {
      el.onloadedmetadata = ok;
      el.preload = "metadata";
    } else {
      el.onload = ok;
    }
    el.src = url;
  });
}

// 依 folder + mediatype，從編號 1 開始一路試探，抓不到就停止
// limit：找到這麼多張就提早停止（首頁只需要少量張數時用，可省去後面不會顯示的探測）
async function egBuildMedia(ev, limit) {
  var exts = (ev.mediatype || "jpg")
    .split(",")
    .map(function (s) { return s.trim(); })
    .filter(Boolean);

  var media = [];
  var i = 1;
  var SAFETY_MAX = 300; // 避免設定錯誤造成無限迴圈

  while (i <= SAFETY_MAX) {
    if (limit && media.length >= limit) break;
    var matched = null;
    for (var k = 0; k < exts.length; k++) {
      var ext = exts[k];
      var kind = egExtKind(ext);
      var url = ev.folder + "/" + i + "." + ext;
      var found = await egProbeFile(url, kind);
      if (found) { matched = { type: kind, src: url }; break; }
    }
    if (!matched) break;
    media.push(matched);
    i++;
  }
  return media;
}

document.addEventListener("DOMContentLoaded", function () {
  var containers = document.querySelectorAll("#event-gallery");
  containers.forEach(renderEventGallery);
});

function renderEventGallery(container) {
  if (typeof EVENTS_CONFIG === "undefined" || EVENTS_CONFIG.length === 0) {
    container.style.display = "none";
    return;
  }

  var mode = container.dataset.mode || "full";
  var events = EVENTS_CONFIG.slice().sort(function (a, b) {
    return a.order - b.order;
  });
  if (mode === "home") {
    var featuredEvent = events.filter(function (e) { return e.featured === true; })[0];
    events = [featuredEvent || events[0]];
  }

  var activeIndex = 0;
  var mediaIndex = 0;
  var currentMediaCount = 0;

  // ---- 建立固定的 DOM 結構 ----
  container.innerHTML =
    '<h2 class="section-title eg-title"></h2>' +
    '<p class="eg-desc"></p>' +
    '<div class="eg-tabs"></div>' +
    '<div class="eg-carousel">' +
    '  <button class="eg-nav eg-prev" aria-label="上一張">‹</button>' +
    '  <div class="eg-viewport"><div class="eg-track"></div></div>' +
    '  <button class="eg-nav eg-next" aria-label="下一張">›</button>' +
    "</div>" +
    '<div class="eg-dots"></div>';

  var titleEl = container.querySelector(".eg-title");
  var descEl = container.querySelector(".eg-desc");
  var tabsEl = container.querySelector(".eg-tabs");
  var trackEl = container.querySelector(".eg-track");
  var dotsEl = container.querySelector(".eg-dots");
  var prevBtn = container.querySelector(".eg-prev");
  var nextBtn = container.querySelector(".eg-next");
  var carouselEl = container.querySelector(".eg-carousel");

  // 圖片：固定 2 秒換下一張。影片：不用計時，等影片自己播完（ended 事件）才換下一張。
  var AUTOPLAY_MS = 2000;
  var currentMedia = [];
  var advanceTimer = null;
  var activeVideoEl = null;
  var autoplayPaused = false;

  function clearAdvance() {
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    if (activeVideoEl) { activeVideoEl.removeEventListener("ended", goNext); activeVideoEl = null; }
  }
  function scheduleAdvance() {
    clearAdvance();
    if (autoplayPaused || currentMediaCount <= 1) return;
    var m = currentMedia[mediaIndex];
    if (!m) return;
    if (m.type === "video") {
      var slideEl = trackEl.children[mediaIndex];
      var videoEl = slideEl ? slideEl.querySelector("video") : null;
      if (videoEl) {
        activeVideoEl = videoEl;
        videoEl.addEventListener("ended", goNext);
        return;
      }
    }
    advanceTimer = setTimeout(goNext, AUTOPLAY_MS);
  }
  function goNext() {
    mediaIndex = (mediaIndex + 1) % currentMediaCount;
    updateTrack();
    scheduleAdvance();
  }
  function pauseAutoplay() {
    autoplayPaused = true;
    clearAdvance();
  }
  function resumeAutoplay() {
    autoplayPaused = false;
    scheduleAdvance();
  }
  // 滑鼠移到輪播上暫停，離開再繼續；手動操作也重新排程，比較不突兀
  carouselEl.addEventListener("mouseenter", pauseAutoplay);
  carouselEl.addEventListener("mouseleave", resumeAutoplay);
  EG_INSTANCES.push({ start: resumeAutoplay, stop: pauseAutoplay });

  // ---- 頁籤（只有 full 模式、且活動數量 > 1 時才顯示）----
  if (mode === "full" && events.length > 1) {
    events.forEach(function (ev, i) {
      var tab = document.createElement("button");
      tab.className = "eg-tab";
      tab.textContent = ev.name;
      tab.addEventListener("click", function () {
        activeIndex = i;
        mediaIndex = 0;
        render();
      });
      tabsEl.appendChild(tab);
    });
  } else {
    tabsEl.style.display = "none";
  }

  prevBtn.addEventListener("click", function () {
    mediaIndex = (mediaIndex - 1 + currentMediaCount) % currentMediaCount;
    updateTrack();
    scheduleAdvance();
  });
  nextBtn.addEventListener("click", function () {
    mediaIndex = (mediaIndex + 1) % currentMediaCount;
    updateTrack();
    scheduleAdvance();
  });

  async function render() {
    clearAdvance();
    var ev = events[activeIndex];

    titleEl.textContent = ev.name;
    descEl.textContent = ev.description || "";
    descEl.style.display = ev.description ? "" : "none";

    // 頁籤高亮
    tabsEl.querySelectorAll(".eg-tab").forEach(function (tab, i) {
      tab.classList.toggle("active", i === activeIndex);
    });

    trackEl.innerHTML = '<div class="eg-loading">載入中...</div>';
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
    dotsEl.style.display = "none";
    dotsEl.innerHTML = "";

    // 首頁只放前 5 張，避免載入太多張、也讓版面精簡；完整花絮導去「義整活動」頁看
    var homeLimit = mode === "home" ? 5 : null;
    var media = await egBuildMedia(ev, homeLimit);

    // 使用者可能在載入中途切換頁籤，這裡確認還是同一場才畫面更新
    if (events[activeIndex] !== ev) return;

    if (mode === "home" && media.length > 0) {
      media = media.concat([{ type: "cta" }]);
    }

    trackEl.innerHTML = "";
    if (media.length === 0) {
      trackEl.innerHTML = '<div class="eg-empty">這場活動還沒有花絮照片／影片</div>';
      currentMediaCount = 0;
      return;
    }

    media.forEach(function (m) {
      var slide = document.createElement("div");
      slide.className = "eg-slide";
      if (m.type === "video") {
        var video = document.createElement("video");
        video.src = m.src;
        video.controls = false;
        video.muted = true;
        video.autoplay = true;
        video.loop = false;
        video.playsInline = true;
        video.disablePictureInPicture = true;
        video.setAttribute("controlsList", "nodownload noplaybackrate nofullscreen");
        video.style.pointerEvents = "none"; // 不能點擊開啟/全螢幕，純播放
        slide.appendChild(video);
      } else if (m.type === "cta") {
        var ctaLink = document.createElement("a");
        ctaLink.className = "eg-cta-link";
        ctaLink.href = "events.html";
        ctaLink.innerHTML =
          '<span class="eg-cta-text">查看更多義整活動</span>' +
          '<span class="eg-cta-arrow">→</span>';
        slide.appendChild(ctaLink);
      } else {
        // 圖片包一層按鈕，點擊用 Lightbox 彈出大圖（同一頁彈窗，不另開分頁）
        var trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "eg-zoom";
        trigger.setAttribute("aria-label", "放大看圖片");
        var img = document.createElement("img");
        img.src = m.src;
        img.alt = ev.name;
        trigger.appendChild(img);
        trigger.addEventListener("click", function (src, alt) {
          return function () { egOpenLightbox(src, alt); };
        }(m.src, ev.name));
        slide.appendChild(trigger);
      }
      trackEl.appendChild(slide);
    });

    if (media.length > 1) {
      media.forEach(function (_, i) {
        var dot = document.createElement("button");
        dot.className = "eg-dot";
        dot.addEventListener("click", function () {
          mediaIndex = i;
          updateTrack();
          scheduleAdvance();
        });
        dotsEl.appendChild(dot);
      });
    }

    var showNav = media.length > 1;
    prevBtn.style.display = showNav ? "" : "none";
    nextBtn.style.display = showNav ? "" : "none";
    dotsEl.style.display = showNav ? "" : "none";

    mediaIndex = 0;
    currentMedia = media;
    currentMediaCount = media.length;
    updateTrack();
    scheduleAdvance();
  }

  function updateTrack() {
    trackEl.style.transform = "translateX(-" + mediaIndex * 100 + "%)";
    dotsEl.querySelectorAll(".eg-dot").forEach(function (dot, i) {
      dot.classList.toggle("active", i === mediaIndex);
    });
  }

  render();
}
