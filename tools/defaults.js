/* 「設為預設」共用功能
 * - 在 .actions 區塊加上「★ 設為預設」「還原出廠值」兩顆按鈕
 * - 按「設為預設」→ 把目前欄位內容存在這台裝置的瀏覽器
 * - 之後打開頁面一律帶出已存的預設；沒存過就是原本的出廠值
 * - 頁面可先設定 window.WUYI_DEFAULTS_EXTRA = { get(), set(o) } 處理非一般欄位（如簽到表的類型）
 *   與 window.WUYI_DEFAULTS_QR = [['in-qr','out-qr','qr-placeholder']] 處理上傳的 QR 圖片
 */
(function(){
  // 只有 iPhone/iPad 才用系統分享面板存相簿；電腦與安卓直接下載檔案
  window.IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var page = (location.pathname.split('/').pop() || 'index').replace(/\.html$/,'');
  var KEY = 'wuyi_defaults_' + page;
  var panel = document.querySelector('.panel');
  var actions = document.querySelector('.panel .actions');
  if (!panel || !actions) return;

  var extra = window.WUYI_DEFAULTS_EXTRA || null;
  var qrs = window.WUYI_DEFAULTS_QR || [];
  var fields = Array.prototype.slice.call(
    panel.querySelectorAll('input[id], select[id], textarea[id]')
  ).filter(function(el){ return el.type !== 'file'; });

  function collect(){
    var o = { fields: {}, qr: {} };
    fields.forEach(function(el){ o.fields[el.id] = el.value; });
    qrs.forEach(function(q){
      var img = document.getElementById(q[1]);
      if (img && img.src && img.src.indexOf('data:') === 0) o.qr[q[0]] = img.src;
    });
    if (extra) o.extra = extra.get();
    return o;
  }

  var factory = collect();   // 頁面剛載入時的內容 = 出廠值

  function fire(el, type){ el.dispatchEvent(new Event(type, { bubbles: true })); }

  function apply(o){
    if (!o) return;
    // 下拉選單先套（切換時可能會連動改其他欄位），其餘欄位後套
    fields.filter(function(el){ return el.tagName === 'SELECT'; }).forEach(function(el){
      if (typeof o.fields[el.id] === 'string'){ el.value = o.fields[el.id]; fire(el, 'change'); }
    });
    fields.filter(function(el){ return el.tagName !== 'SELECT'; }).forEach(function(el){
      if (typeof o.fields[el.id] === 'string'){ el.value = o.fields[el.id]; fire(el, 'input'); }
    });
    qrs.forEach(function(q){
      var src = o.qr && o.qr[q[0]];
      var img = document.getElementById(q[1]);
      var ph = q[2] && document.getElementById(q[2]);
      if (!img) return;
      if (src){
        img.src = src; img.style.display = 'block';
        if (ph) ph.style.display = 'none';
      }
    });
    if (extra && o.extra !== undefined) extra.set(o.extra);
  }

  function readSaved(){
    try{ return JSON.parse(localStorage.getItem(KEY) || 'null'); }catch(e){ return null; }
  }

  var status = document.getElementById('statusText');
  function say(msg){ if (status) status.textContent = msg; }

  function mkBtn(label, cls){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.textContent = label;
    return b;
  }
  var ghostCss = 'background:#fff;color:#6E5A3E;border:1.5px solid #C5B290;padding:11px 20px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;';
  var saveBtn = mkBtn('★ 設為預設', '');
  var resetBtn = mkBtn('還原出廠值', '');
  saveBtn.style.cssText = ghostCss;
  resetBtn.style.cssText = ghostCss;
  var dl = document.getElementById('downloadBtn');
  if (dl && dl.nextSibling){
    actions.insertBefore(saveBtn, dl.nextSibling);
    actions.insertBefore(resetBtn, saveBtn.nextSibling);
  } else {
    actions.appendChild(saveBtn);
    actions.appendChild(resetBtn);
  }

  saveBtn.addEventListener('click', function(){
    try{
      localStorage.setItem(KEY, JSON.stringify(collect()));
      say('已設為預設！下次打開會自動帶出這些內容');
    }catch(e){
      say('儲存失敗（瀏覽器可能封鎖了儲存空間或圖片太大）');
    }
  });

  resetBtn.addEventListener('click', function(){
    if (!confirm('要清除你設定的預設值，並還原成最初的出廠值嗎？')) return;
    try{ localStorage.removeItem(KEY); }catch(e){}
    apply(factory);
    say('已還原成出廠值');
  });

  apply(readSaved());
})();
