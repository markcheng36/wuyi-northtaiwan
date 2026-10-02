// ============================================================
// 優惠券渲染
// 讀取 coupon-config.js 裡的 COUPON_CONFIG，自動產生優惠券。
// 不需要手動修改這個檔案——日期、金額、規則都在 coupon-config.js 設定。
//
// 用法：HTML 裡放
//   <section id="coupon-section"> ... <div id="coupon-block"></div> </section>
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  var section = document.getElementById("coupon-section");
  var box = document.getElementById("coupon-block");
  if (!box || typeof COUPON_CONFIG === "undefined") return;

  var c = COUPON_CONFIG;
  // 依 brand 選出這張券的發行單位（LOGO／QR／LINE／店名／地點）
  var brands = c.brands || {};
  var b = brands[c.brand] || brands[Object.keys(brands)[0]] || {};

  // 解析 "2026-10-31" → 當天 23:59:59 本地時間
  var m = String(c.expiry || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  var expiryDate = m ? new Date(+m[1], +m[2] - 1, +m[3], 23, 59, 59) : null;
  var expired = expiryDate ? (new Date() > expiryDate) : false;

  if (c.enabled === false || (c.hideAfterExpiry !== false && expired)) {
    if (section) section.hidden = true;
    return;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  var expiryText = m ? (m[1] + "." + ("0" + m[2]).slice(-2) + "." + ("0" + m[3]).slice(-2)) : String(c.expiry || "");

  var card = el("div", "coupon-card");

  // ---- 左：券本體 ----
  var main = el("div", "coupon-main");

  var top = el("div", "coupon-top");
  var logo = el("img", "coupon-logo");
  logo.src = b.logo;
  logo.alt = b.logoAlt || b.name || "";
  top.appendChild(logo);
  if (c.tag) top.appendChild(el("span", "coupon-tag", c.tag));
  main.appendChild(top);

  main.appendChild(el("h3", "coupon-title", c.title));

  var amt = el("div", "coupon-amount");
  amt.appendChild(el("span", "coupon-lead", c.lead));
  amt.appendChild(el("span", "coupon-nt", "NT."));
  amt.appendChild(el("span", "coupon-num", String(c.amount)));
  main.appendChild(amt);

  main.appendChild(el("p", "coupon-how", c.how));

  if (c.terms && c.terms.length) {
    var ul = el("ul", "coupon-terms");
    c.terms.forEach(function (t) { ul.appendChild(el("li", null, t)); });
    main.appendChild(ul);
  }

  // ---- 右：存根（期限＋QR）----
  var stub = el("div", "coupon-stub");

  var valid = el("div", "coupon-valid");
  valid.appendChild(el("span", "coupon-valid-k", "有效期限"));
  valid.appendChild(el("b", "coupon-valid-v", expiryText));
  stub.appendChild(valid);

  var qrLink = el("a", "coupon-qr");
  qrLink.href = b.lineUrl || "#";
  qrLink.target = "_blank";
  qrLink.rel = "noopener";
  var qr = el("img");
  qr.src = b.qr;
  qr.alt = "加官方 LINE 預約";
  qrLink.appendChild(qr);
  stub.appendChild(qrLink);

  stub.appendChild(el("div", "coupon-cta", "加官方 LINE 預約"));
  stub.appendChild(el("div", "coupon-id", b.lineId));

  var where = el("div", "coupon-where");
  where.appendChild(el("b", null, b.name));
  where.appendChild(document.createTextNode(b.venue || ""));
  stub.appendChild(where);

  card.appendChild(main);
  card.appendChild(stub);
  box.innerHTML = "";
  box.appendChild(card);
});
