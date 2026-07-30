// 手機版導覽選單（漢堡選單）開合控制
document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.getElementById("navToggle");
  var wrap = toggle ? toggle.closest(".nav-wrap") : null;
  if (!toggle || !wrap) return;

  toggle.addEventListener("click", function () {
    var isOpen = wrap.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // 點了選單裡的連結後自動收合
  wrap.querySelectorAll("nav a").forEach(function (a) {
    a.addEventListener("click", function () {
      wrap.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
});
