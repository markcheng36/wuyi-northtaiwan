// ============================================================
// 優惠券設定檔（鈞衡舍 身體平衡調整券）
// 要改日期、金額、使用規則，只要改這個檔案、存檔、推上去，
// 「志工守護日」頁的優惠券就會自動更新，不用動 HTML。
// ============================================================
//
// 欄位說明：
//   enabled          true＝顯示優惠券；false＝整個區塊隱藏（活動結束後可以先關掉）
//   hideAfterExpiry  true＝超過「有效期限」那天之後，網頁自動把優惠券藏起來
//                    false＝過期了也繼續顯示（不建議）
//   expiry           有效期限，格式固定是 "年-月-日"，例如 "2026-10-31"
//                    （當天 23:59 前都還能用，網頁會顯示成 2026.10.31）
//   amount           折抵金額，只要填數字，例如 400（網頁會顯示成 NT.400）
//   tag              券左上角的小標籤，不想要就留空 ""
//   title            券的標題
//   lead             金額前面那句，例如「憑券折抵」
//   how              金額下面那一行使用方式
//   terms            使用說明，一行一條，可以自由增減
//   brand            這張券是誰發的，只能填 "chunbalance"（鈞衡舍）或 "strxhunter"（結構X獵人）
//                    一改，券上的 LOGO、LINE QR code、LINE ID、店名、地點會整組一起換
//                    （下面 brands 裡有兩家各自的資料，要改地點或 LINE 就改那裡）
//
// ============================================================

const COUPON_CONFIG = {
  enabled: true,
  hideAfterExpiry: true,

  // ★ 切換 LOGO：改這一行就好 → "chunbalance"（鈞衡舍）／"strxhunter"（結構X獵人）
  brand: "chunbalance",

  expiry: "2026-10-31",
  amount: 400,

  tag: "BNI 專講限定贈禮",
  title: "身體平衡調整券",
  lead: "憑券折抵",
  how: "預約時出示本券，現場直接抵用",
  terms: [
    "每張限用一次，限本人使用，不得兌換現金或找零",
    "不得與其他優惠併用",
    "請先加官方 LINE 預約時段，並於調整前出示本券"
  ],

  brands: {
    chunbalance: {
      name: "鈞衡舍 ChunBalance",
      logo: "images/chunbalance-logo.png",
      logoAlt: "鈞衡舍 CB Studio",
      qr: "images/chunbalance-line-qr.png",
      lineId: "@chunbalance",
      lineUrl: "https://line.me/R/ti/p/@chunbalance",
      venue: "板橋江子翠捷運站"
    },
    strxhunter: {
      name: "結構X獵人 STR×HUNTER",
      logo: "images/strxhunter-logo.png",
      logoAlt: "結構X獵人 STR×HUNTER",
      qr: "images/strxhunter-line-qr.png",
      lineId: "@strxhunter",
      lineUrl: "https://line.me/R/ti/p/@strxhunter",
      venue: "板橋區文化路二段182巷3弄81號19樓"
    }
  }
};
