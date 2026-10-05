// ============================================================
// 近期義整活動設定檔
// 之後有新場次確定下來，複製一整個 { ... } 區塊貼上、改內容就好，
// 首頁跟「義整活動」頁的「近期活動」卡片會自動抓這裡的資料出來顯示，不用改 HTML。
// ============================================================
//
// 每場活動需要填：
//   order       排序，數字越小排越前面
//   tag         活動類型標籤，例如「社區大健康」
//   date        日期（含星期），例如 "2026年8月15日（六）"
//   title       活動標題，例如 "大健康體驗會"
//   description 一句話說明活動內容，重點放在活動亮點/贈品即可，
//               收費與否已經改由下面的 price 欄位獨立呈現，這裡不用再重複寫
//   location    地點
//   price       費用，以「每人」為單位計算，例如 "NT$500 / 人"；
//               完全免費就寫 "免費"
//   formUrl     這場的 Google 表單報名連結，會做成按鈕、點了另開新分頁
//   formId      （選填）有填才會在卡片上顯示剩餘名額。
//               名額控管程式綁在報名表單本身，這裡填什麼都可以，
//               習慣上填 formUrl 最後那一段（例如 gASXbP76GdKHEvXT9）
//               名額讀的是表單「報名場次」那一題說明的「每時段名額：N」
//               沒填 formId 就不顯示名額，其他功能照常
//
// ============================================================

// 「名額控管」Apps Script 部署成「網頁應用程式」後的網址（…/exec 結尾，只要設定一次，所有場次共用）
// 留空 "" 就是不顯示剩餘名額
const SEATS_API_URL = "https://script.google.com/macros/s/AKfycbwNetCmJebSsLfgklzvnSt2xCoAc-YCPTOrs-7DSgij--JFwGpCJUco-iw_uJVmapkd3w/exec";

const UPCOMING_EVENTS_CONFIG = [
{
    order: 1,
    tag: "志工守護日",
    date: "2026年11月30日（一）",
    title: "志工守護日（板橋場）",
    description: "一天三個時段 14:00／15:00／16:00，每時段 50 分鐘、名額有限。現場提供結構與足部檢視、徒手舒緩放鬆與個人化保養建議。",
    location: "板橋・結構X獵人",
    price: "免費",
    formUrl: "https://forms.gle/nXQg1Y6sXykNMkEQ8",
    formId: "nXQg1Y6sXykNMkEQ8"
  }
  // 範例：之後要新增場次，複製下面這段、拿掉最前面的 // 、改內容即可
  // ,{
  //   order: 4,
  //   tag: "志工守護日",
  //   date: "2026年9月某日（六）",
  //   title: "志工守護日",
  //   description: "現場提供足部檢測與結構調理體驗，現場備有超值贈品，也可加購。",
  //   location: "板橋・結構X獵人",
  //   price: "免費",
  //   formUrl: "https://forms.gle/gASXbP76GdKHEvXT9",
  //   formId: "gASXbP76GdKHEvXT9"
  // }
];
