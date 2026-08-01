// ============================================================
// 展開／收合按鈕（報名表單、滿意度填寫用）
// 按鈕預設收合，第一次點開才會真的載入裡面的 iframe，
// 這樣沒點開的表單不會佔用載入時間。
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".accordion-toggle").forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute("data-target"));
    if (!panel) return;

    btn.addEventListener("click", function () {
      var opening = panel.hidden;
      panel.hidden = !opening;
      btn.classList.toggle("open", opening);

      if (opening) {
        var iframe = panel.querySelector("iframe[data-src]");
        if (iframe) {
          iframe.src = iframe.getAttribute("data-src");
          iframe.removeAttribute("data-src");
        }
      }
    });
  });
});
