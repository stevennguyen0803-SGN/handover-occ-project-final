/* OCC Handover · Friendly Redesign Prototype
 * Vanilla JS, no build step. Uses Chart.js (CDN) for charts,
 * localStorage for persisted demo state, hash router for views.
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------
  // i18n (VI default, EN toggle)
  // ---------------------------------------------------------------
  const I18N = {
    vi: {
      "brand.subtitle": "Hệ thống bàn giao ca",
      "login.title": "Đăng nhập demo",
      "login.hint": "Chọn vai trò bên dưới để xem prototype với quyền tương ứng.",
      "login.note": "Đây là prototype tĩnh. Dữ liệu lưu ở trình duyệt (localStorage). Không có backend thật.",
      "shift.morning": "Ca sáng",
      "shift.afternoon": "Ca chiều",
      "shift.night": "Ca đêm",
      "search.placeholder": "Tìm reference, flight, station, owner…",
      "nav.main": "Chính",
      "nav.tools": "Tiện ích",
      "nav.dashboard": "Dashboard",
      "nav.new": "Tạo Handover",
      "nav.log": "Handover Log",
      "nav.audit": "Audit Trail",
      "nav.help": "Hướng dẫn",
      "nav.logout": "Đăng xuất",
      "footer.localStorage": "Local Storage",
      "banner.review": "Review ngay →",
      "shortcuts.title": "Phím tắt",
      "shortcuts.new": "Tạo handover mới",
      "shortcuts.search": "Mở thanh tìm kiếm",
      "shortcuts.dashboard": "Về Dashboard",
      "shortcuts.log": "Về Handover Log",
      "shortcuts.ack": "Acknowledge handover (ở chi tiết)",
      "shortcuts.theme": "Đổi sáng / tối",
      "shortcuts.help": "Mở hộp thoại này",
      "shortcuts.esc": "Đóng hộp thoại / huỷ tìm",
      "dashboard.eyebrow": "Bảng điều hành",
      "dashboard.title": "Tổng quan ca trực",
      "dashboard.recent": "Handovers gần đây",
      "dashboard.recentSub": "Sắp xếp theo Priority rồi đến thời gian",
      "log.eyebrow": "Lịch sử",
      "log.title": "Handover Log",
      "new.eyebrow": "Tạo handover",
      "new.title": "New Handover",
      "new.subtitle": "Hoàn thành 3 bước · System tự sinh reference HDO-YYYY-NNNNNN",
      "new.step1": "Header",
      "new.step2": "Categories",
      "new.step3": "Review & Submit",
      "audit.eyebrow": "Audit",
      "audit.title": "Audit Trail",
      "audit.subtitle": "Mọi mutation đều được ghi lại (BR-09)",
      "help.eyebrow": "Hướng dẫn",
      "help.title": "Friendly Redesign · Design notes",
      "help.subtitle": "Ghi chú thiết kế và phím tắt cho prototype",
      "help.uxTitle": "12 cải thiện UX so với prototype cũ",
      "help.tokensTitle": "Design tokens",
      "help.ux1": "Shift-aware theming (Morning vàng / Afternoon cam / Night tím) — nhìn 1 cái biết đang ca nào.",
      "help.ux2": "Banner cảnh báo Critical chưa acknowledge nổi bật trên cùng (BR-08).",
      "help.ux3": "KPI có ngữ cảnh: trend ↑↓, click vào lọc thẳng list.",
      "help.ux4": "Smart filter chips (Today / Last 7d / High+ / Open / Carry-Forward).",
      "help.ux5": "Carry-forward có visual rõ ràng: badge \"Carried Forward\" + link ngược.",
      "help.ux6": "New Handover dạng 3 bước (Header → Categories → Review) đỡ choáng.",
      "help.ux7": "Status timeline cho item: Open → Monitoring → Resolved trực quan.",
      "help.ux8": "Empty state có gợi ý hành động, không trống lốc.",
      "help.ux9": "Mobile-first, FAB + cho trực ca tablet.",
      "help.ux10": "Phím tắt OCC quen tay (N/L/D/A/?).",
      "help.ux11": "Toggle Tiếng Việt ↔ English ngay trên header.",
      "help.ux12": "Print-ready CSS cho Print/PDF (loại bỏ sidebar, expand chi tiết).",
      "action.exportCsv": "Export CSV",
      "action.printPdf": "Print / PDF",
      "action.newHandover": "New Handover",
      "action.viewAll": "Xem tất cả →",
      "action.cancel": "Huỷ",
      "action.back": "← Quay lại",
      "action.next": "Tiếp tục →",
      "action.saveDraft": "Lưu nháp",
      "action.backToLog": "Quay lại Handover Log",
      "col.date": "Ngày · Ca",
      "col.ref": "Reference",
      "col.preparedBy": "Người chuẩn bị",
      "col.categories": "Categories",
      "col.priority": "Priority",
      "col.status": "Status",
      "col.flights": "Flights",
      "col.cf": "CF",
      "col.ack": "Ack",
      "charts.byCategory": "Issues theo Category",
      "charts.byCategorySub": "Phân loại trên tất cả handovers đang mở",
      "charts.priority": "Phân bố mức ưu tiên",
      "charts.prioritySub": "Tất cả ca trong 30 ngày",
      "charts.shift": "Hoạt động theo ca",
      "charts.shiftSub": "Số handover trong 30 ngày qua",
      "charts.abnormal": "Ab-Normal Events",
      "charts.abnormalSub": "Loại sự kiện bất thường gần đây",
      "empty.logTitle": "Không có handover phù hợp",
      "empty.logHint": "Thử bỏ bớt bộ lọc hoặc đổi từ khoá tìm kiếm.",
    },
    en: {
      "brand.subtitle": "Shift Management System",
      "login.title": "Demo sign-in",
      "login.hint": "Pick a role below to view the prototype with that role's permissions.",
      "login.note": "This is a static prototype. Data is stored in your browser (localStorage). No real backend.",
      "shift.morning": "Morning",
      "shift.afternoon": "Afternoon",
      "shift.night": "Night",
      "search.placeholder": "Search reference, flight, station, owner…",
      "nav.main": "Main",
      "nav.tools": "Tools",
      "nav.dashboard": "Dashboard",
      "nav.new": "New Handover",
      "nav.log": "Handover Log",
      "nav.audit": "Audit Trail",
      "nav.help": "Guide",
      "nav.logout": "Sign out",
      "footer.localStorage": "Local Storage",
      "banner.review": "Review now →",
      "shortcuts.title": "Keyboard shortcuts",
      "shortcuts.new": "Create new handover",
      "shortcuts.search": "Focus search bar",
      "shortcuts.dashboard": "Go to Dashboard",
      "shortcuts.log": "Go to Handover Log",
      "shortcuts.ack": "Acknowledge handover (on detail)",
      "shortcuts.theme": "Toggle light / dark",
      "shortcuts.help": "Open this dialog",
      "shortcuts.esc": "Close dialog / blur search",
      "dashboard.eyebrow": "Operations",
      "dashboard.title": "Shift overview",
      "dashboard.recent": "Recent handovers",
      "dashboard.recentSub": "Sorted by Priority then time",
      "log.eyebrow": "History",
      "log.title": "Handover Log",
      "new.eyebrow": "Create handover",
      "new.title": "New Handover",
      "new.subtitle": "Complete 3 steps · System auto-generates HDO-YYYY-NNNNNN reference",
      "new.step1": "Header",
      "new.step2": "Categories",
      "new.step3": "Review & Submit",
      "audit.eyebrow": "Audit",
      "audit.title": "Audit Trail",
      "audit.subtitle": "Every mutation is recorded (BR-09)",
      "help.eyebrow": "Guide",
      "help.title": "Friendly Redesign · Design notes",
      "help.subtitle": "Design rationale and shortcuts for the prototype",
      "help.uxTitle": "12 UX improvements over the old prototype",
      "help.tokensTitle": "Design tokens",
      "help.ux1": "Shift-aware theming (Morning gold / Afternoon orange / Night indigo) — instantly recognise the current shift.",
      "help.ux2": "Critical-not-yet-acknowledged banner pinned at the top (BR-08).",
      "help.ux3": "Contextual KPIs: trend ↑↓, click to filter the list.",
      "help.ux4": "Smart filter chips (Today / Last 7d / High+ / Open / Carry-Forward).",
      "help.ux5": "Carry-forward shows a clear badge and back-link to the source.",
      "help.ux6": "New Handover is a 3-step flow (Header → Categories → Review) — less overwhelming.",
      "help.ux7": "Status timeline for items: Open → Monitoring → Resolved visualised.",
      "help.ux8": "Empty states with actionable hints — never blank.",
      "help.ux9": "Mobile-first with a floating + button for tablet shift use.",
      "help.ux10": "Keyboard shortcuts (N/L/D/A/?).",
      "help.ux11": "Vietnamese ↔ English toggle right in the header.",
      "help.ux12": "Print-ready CSS for Print/PDF (sidebars hidden, sections expanded).",
      "action.exportCsv": "Export CSV",
      "action.printPdf": "Print / PDF",
      "action.newHandover": "New Handover",
      "action.viewAll": "View all →",
      "action.cancel": "Cancel",
      "action.back": "← Back",
      "action.next": "Next →",
      "action.saveDraft": "Save draft",
      "action.backToLog": "Back to Handover Log",
      "col.date": "Date · Shift",
      "col.ref": "Reference",
      "col.preparedBy": "Prepared by",
      "col.categories": "Categories",
      "col.priority": "Priority",
      "col.status": "Status",
      "col.flights": "Flights",
      "col.cf": "CF",
      "col.ack": "Ack",
      "charts.byCategory": "Issues by Category",
      "charts.byCategorySub": "Breakdown across all open handovers",
      "charts.priority": "Priority Distribution",
      "charts.prioritySub": "All shifts in last 30 days",
      "charts.shift": "Shift Activity",
      "charts.shiftSub": "Handovers submitted per shift in last 30 days",
      "charts.abnormal": "Ab-Normal Events",
      "charts.abnormalSub": "Recent events by type",
      "empty.logTitle": "No matching handovers",
      "empty.logHint": "Try removing some filters or different keywords.",
    },
  };

  function t(key) { return (I18N[state.lang] && I18N[state.lang][key]) || I18N.vi[key] || key; }

  // ---------------------------------------------------------------
  // State / store
  // ---------------------------------------------------------------
  const STORE_KEY = "occ_handover_proto_v1";
  const PREF_KEY = "occ_handover_proto_pref_v1";

  const seed = window.__SEED__;

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  function saveStore(s) { localStorage.setItem(STORE_KEY, JSON.stringify(s)); }
  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(PREF_KEY) || "{}"); }
    catch (e) { return {}; }
  }
  function savePrefs() {
    localStorage.setItem(PREF_KEY, JSON.stringify({
      lang: state.lang, theme: state.theme, role: state.role && state.role.id,
    }));
  }

  let store = loadStore();
  if (!store) {
    store = { users: seed.USERS, handovers: seed.HANDOVERS, audit: seed.AUDIT };
    saveStore(store);
  }

  const prefs = loadPrefs();

  const state = {
    lang: prefs.lang || "vi",
    theme: prefs.theme || "light",
    role: null, // user object
    sidebarOpen: false,
    currentRoute: { name: "dashboard", params: {} },
    quickFilter: null,
    logFilter: { q: "", shift: "", priority: "", status: "", carry: false, ack: "", range: "30d" },
    draft: null, // for new-handover form
  };

  if (prefs.role) {
    const u = store.users.find((x) => x.id === prefs.role);
    if (u) state.role = u;
  }

  // ---------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const el = (tag, props = {}, children = []) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else if (k === "text") node.textContent = v;
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === "data") for (const [dk, dv] of Object.entries(v)) node.dataset[dk] = dv;
      else if (v === true) node.setAttribute(k, "");
      else if (v !== false && v != null) node.setAttribute(k, v);
    }
    for (const c of [].concat(children)) {
      if (c == null || c === false) continue;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  };
  const fmtDate = (iso) => {
    const d = typeof iso === "string" && iso.length === 10 ? new Date(iso + "T00:00:00") : new Date(iso);
    return d.toLocaleDateString(state.lang === "vi" ? "vi-VN" : "en-GB", { year: "numeric", month: "2-digit", day: "2-digit" });
  };
  const fmtDateTime = (iso) => new Date(iso).toLocaleString(state.lang === "vi" ? "vi-VN" : "en-GB", { hour12: false });
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString(state.lang === "vi" ? "vi-VN" : "en-GB", { hour12: false });
  const dayDiff = (iso) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  const PRIORITY_ORDER = { Critical: 0, High: 1, Normal: 2, Low: 3 };
  const sortByPriority = (a, b) => (PRIORITY_ORDER[a.overallPriority] - PRIORITY_ORDER[b.overallPriority]) || (new Date(b.handoverDate) - new Date(a.handoverDate));
  const getCurrentShift = () => {
    const h = new Date().getHours();
    if (h < 6) return "Night"; if (h < 14) return "Morning"; if (h < 22) return "Afternoon"; return "Night";
  };

  function flightsAffectedTotal(h) {
    let n = 0;
    for (const cat of Object.keys(h.items || {})) {
      for (const it of h.items[cat]) {
        const fa = (it.flightsAffected || "");
        const m = fa.match(/(\d+)/g);
        if (m) m.forEach((x) => (n += parseInt(x, 10)));
        else if (fa) n += 1;
      }
    }
    return n;
  }
  function categoryCodes(h) {
    return Object.keys(h.items || {}).filter((k) => h.items[k].length).map((k) => seed.CATS[k].code);
  }
  function isAcknowledged(h) { return Boolean(h.acknowledgedAt); }
  function isCriticalUnack(h) { return h.overallPriority === "Critical" && !isAcknowledged(h); }
  function openItemsCount(h) {
    let n = 0;
    for (const cat of Object.keys(h.items || {})) for (const it of h.items[cat]) if (it.status !== "Resolved") n++;
    return n;
  }
  function aircraftIssuesCount(h) { return (h.items.aircraft || []).filter((i) => i.status !== "Resolved").length; }
  function abnormalCount(h) { return (h.items.abnormal || []).length; }

  // Permissions per shared/roles.md
  function can(action) {
    if (!state.role) return false;
    const r = state.role.role;
    if (r === "ADMIN") return true;
    if (r === "MANAGEMENT_VIEWER") return action === "view" || action === "export";
    if (r === "OCC_STAFF") return ["view","export","create","update","ack"].includes(action);
    if (r === "SUPERVISOR") return ["view","export","create","update","ack","carry","delete"].includes(action);
    return false;
  }

  // ---------------------------------------------------------------
  // i18n apply / theme / shift
  // ---------------------------------------------------------------
  function applyI18n(root = document) {
    $$("[data-i18n]", root).forEach((n) => { n.textContent = t(n.dataset.i18n); });
    $$("[data-i18n-placeholder]", root).forEach((n) => { n.placeholder = t(n.dataset.i18nPlaceholder); });
    document.documentElement.lang = state.lang;
    const ll = document.getElementById("lang-label");
    if (ll) ll.textContent = state.lang === "vi" ? "VI" : "EN";
  }
  function applyTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
  }
  function applyShift() {
    const s = getCurrentShift();
    document.documentElement.setAttribute("data-shift", s.toLowerCase());
    const chip = document.getElementById("shift-chip");
    if (chip) {
      chip.lastElementChild.textContent = t("shift." + s.toLowerCase());
    }
  }

  // ---------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------
  function renderLogin() {
    const grid = $("#role-grid");
    grid.innerHTML = "";
    for (const u of store.users) {
      const card = el("button", { class: "role-card", onclick: () => loginAs(u) }, [
        el("strong", { text: u.name }),
        el("small", { text: u.email }),
        el("small", { text: u.desc }),
        el("span", { class: `badge ${rolebadge(u.role)}`, text: u.role.replace("_", " ") }),
      ]);
      grid.appendChild(card);
    }
    applyI18n($("#login"));
  }
  function rolebadge(role) {
    if (role === "ADMIN") return "badge--critical";
    if (role === "SUPERVISOR") return "badge--high";
    if (role === "OCC_STAFF") return "badge--normal";
    return "badge--low";
  }
  function loginAs(u) {
    state.role = u; savePrefs();
    showApp();
  }
  function logout() {
    state.role = null; savePrefs();
    showLogin();
  }
  function showLogin() {
    $("#app").hidden = true;
    $("#login").hidden = false;
    renderLogin();
  }
  function showApp() {
    $("#login").hidden = true;
    $("#app").hidden = false;
    setUser();
    refreshCriticalBanner();
    document.getElementById("record-count").textContent = store.handovers.length;
    if (!location.hash) location.hash = "#/dashboard";
    else handleRoute();
  }
  function setUser() {
    const u = state.role;
    $("#user-initials").textContent = u.initials;
    $("#user-name").textContent = u.name;
    $("#user-role").textContent = u.role.replace("_", " ");
  }

  // ---------------------------------------------------------------
  // Critical alert banner
  // ---------------------------------------------------------------
  function refreshCriticalBanner() {
    const unack = store.handovers.filter(isCriticalUnack);
    const banner = $("#critical-banner");
    const app = $("#app");
    if (unack.length) {
      banner.hidden = false;
      app.removeAttribute("data-banner-hidden");
      $("#critical-banner-title").textContent =
        state.lang === "vi"
          ? `${unack.length} handover Critical chưa được acknowledge`
          : `${unack.length} Critical handover${unack.length === 1 ? "" : "s"} not yet acknowledged`;
      $("#critical-banner-body").textContent =
        state.lang === "vi" ? "Khẩn trương review để bàn giao ca an toàn." : "Please review to ensure a safe handover.";
    } else {
      banner.hidden = true;
      app.setAttribute("data-banner-hidden", "true");
    }
  }

  // ---------------------------------------------------------------
  // Router
  // ---------------------------------------------------------------
  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, "");
    const [path, qs] = raw.split("?");
    const segs = path.split("/").filter(Boolean);
    const params = {};
    if (qs) for (const kv of qs.split("&")) { const [k, v] = kv.split("="); params[k] = decodeURIComponent(v || ""); }
    return { name: segs[0] || "dashboard", id: segs[1] || null, params };
  }
  function navigate(path) { location.hash = path; }
  window.addEventListener("hashchange", handleRoute);

  function handleRoute() {
    if (!state.role) { showLogin(); return; }
    const route = parseHash();
    state.currentRoute = route;
    closeSidebar();
    $$(".sidenav__item").forEach((a) => a.classList.toggle("is-active", a.dataset.route === route.name));
    const root = $("#view-root"); root.innerHTML = "";
    let tplId;
    if (route.name === "dashboard") tplId = "tpl-dashboard";
    else if (route.name === "log")  tplId = "tpl-log";
    else if (route.name === "new")  tplId = "tpl-new";
    else if (route.name === "audit") tplId = "tpl-audit";
    else if (route.name === "help") tplId = "tpl-help";
    else if (route.name === "h" && route.id) tplId = "tpl-detail";
    else tplId = "tpl-dashboard";
    const tpl = $("#" + tplId);
    root.appendChild(tpl.content.cloneNode(true));
    applyI18n(root);

    if (tplId === "tpl-dashboard") renderDashboard(route);
    if (tplId === "tpl-log") renderLog(route);
    if (tplId === "tpl-new") renderNew(route);
    if (tplId === "tpl-audit") renderAudit(route);
    if (tplId === "tpl-detail") renderDetail(route);
    if (tplId === "tpl-help") renderHelp();

    document.getElementById("main").focus({ preventScroll: true });
  }

  // ---------------------------------------------------------------
  // Render: Dashboard
  // ---------------------------------------------------------------
  function dashboardKPIs() {
    const list = store.handovers.filter((h) => !h.deletedAt);
    const total = list.length;
    const high = list.filter((h) => ["Critical", "High"].includes(h.overallPriority)).length;
    const ac = list.reduce((n, h) => n + aircraftIssuesCount(h), 0);
    const open = list.filter((h) => h.overallStatus !== "Resolved").length;
    const fa = list.reduce((n, h) => n + flightsAffectedTotal(h), 0);
    const ack = list.filter((h) => isCriticalUnack(h)).length;
    const cf = list.filter((h) => h.isCarriedForward).length;
    return [
      { key: "total",  label: state.lang === "vi" ? "Tổng handovers" : "Total Handovers", value: total, hint: (state.lang === "vi" ? "Đang theo dõi" : "All submitted reports"), chip: "Active", chipKind: "info", trend: "flat" },
      { key: "high",   label: state.lang === "vi" ? "Mức ưu tiên cao" : "High Priority Shifts", value: high, hint: state.lang === "vi" ? `Trên ${total} ca` : `of ${total} total shifts`, chip: ack ? "Alert" : "Watch", chipKind: ack ? "alert" : "warn", trend: ack ? "up" : "flat" },
      { key: "ac",     label: state.lang === "vi" ? "Issue tàu bay" : "Aircraft Issues", value: ac, hint: state.lang === "vi" ? "Hạng mục Aircraft" : "Aircraft items", chip: "Issues", chipKind: ac ? "warn" : "ok", trend: "flat" },
      { key: "open",   label: state.lang === "vi" ? "Open / Monitoring" : "Open / Monitoring", value: open, hint: state.lang === "vi" ? "Chưa Resolved" : "Not yet resolved", chip: "Active", chipKind: open ? "warn" : "ok", trend: "flat" },
      { key: "fa",     label: state.lang === "vi" ? "Chuyến bay ảnh hưởng" : "Flights Affected", value: fa, hint: state.lang === "vi" ? "Tổng tác động ops" : "Operational impact", chip: "Ops Impact", chipKind: fa > 10 ? "alert" : (fa ? "warn" : "ok"), trend: "flat" },
      { key: "ack",    label: state.lang === "vi" ? "Critical chờ ack" : "Awaiting Ack", value: ack, hint: state.lang === "vi" ? "Cần xử lý gấp" : "Needs immediate attention", chip: ack ? "Action" : "OK", chipKind: ack ? "alert" : "ok", trend: ack ? "up" : "flat" },
      { key: "cf",     label: state.lang === "vi" ? "Mang sang ca sau" : "Carry-Forward", value: cf, hint: state.lang === "vi" ? "Có item kế thừa" : "Has inherited items", chip: "Trace", chipKind: "info", trend: "flat" },
    ];
  }

  function priorityBadge(p) { return `badge badge--${p.toLowerCase()}`; }
  function statusBadge(s) { return `badge badge--${s.toLowerCase()}`; }

  function recentRow(h, includeFlights = true) {
    const cats = categoryCodes(h);
    const tr = el("tr", {
      class: `${h.isCarriedForward ? "row--carry " : ""}${h.overallPriority === "Critical" ? "row--critical " : ""}${h.overallPriority === "High" ? "row--high " : ""}`.trim(),
      onclick: () => navigate(`#/h/${h.id}`),
      role: "link",
      tabindex: "0",
    }, [
      el("td", { html: `<strong>${fmtDate(h.handoverDate)}</strong><br><small style="color:var(--fg-mute)">${t("shift." + h.shift.toLowerCase())}</small>` }),
      el("td", { class: "cell--ref", text: h.referenceId }),
      el("td", { text: (store.users.find((u) => u.id === h.preparedById) || {}).name || "—" }),
      el("td", { class: "cell--cats" }, cats.map((c) => el("span", { class: "badge badge--cat", text: c }))),
      el("td", {}, [el("span", { class: priorityBadge(h.overallPriority), text: h.overallPriority })]),
      el("td", {}, [el("span", { class: statusBadge(h.overallStatus), text: h.overallStatus })]),
    ]);
    if (includeFlights) tr.appendChild(el("td", { text: String(flightsAffectedTotal(h)) }));
    tr.appendChild(el("td", { html: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.5"><polyline points="9 18 15 12 9 6"/></svg>' }));
    return tr;
  }

  function renderDashboard() {
    // Subtitle
    const list = store.handovers.filter((h) => !h.deletedAt);
    const open = list.filter((h) => h.overallStatus !== "Resolved").length;
    const fa = list.reduce((n, h) => n + flightsAffectedTotal(h), 0);
    $("#dashboard-subtitle").textContent =
      state.lang === "vi" ? `${list.length} handovers · ${open} đang mở · ${fa} chuyến bay ảnh hưởng` : `${list.length} handovers · ${open} open · ${fa} flights affected`;

    // Quick filter chips
    const filters = [
      { id: "today", label: state.lang === "vi" ? "Hôm nay" : "Today" },
      { id: "7d",    label: state.lang === "vi" ? "7 ngày" : "Last 7 days" },
      { id: "high",  label: state.lang === "vi" ? "High+" : "High+" },
      { id: "open",  label: state.lang === "vi" ? "Đang mở" : "Open only" },
      { id: "cf",    label: state.lang === "vi" ? "Mang sang ca sau" : "Carry-forward" },
      { id: "unack", label: state.lang === "vi" ? "Chờ ack" : "Awaiting ack" },
    ];
    const row = $("#quick-filters");
    row.innerHTML = "";
    filters.forEach((f) => {
      const count = countQuickFilter(f.id, list);
      const c = el("button", { class: "chip" + (state.quickFilter === f.id ? " is-active" : ""), onclick: () => { state.quickFilter = state.quickFilter === f.id ? null : f.id; renderDashboard(); } }, [
        el("span", { text: f.label }),
        el("span", { class: "chip__count", text: String(count) }),
      ]);
      row.appendChild(c);
    });

    // KPI cards
    const kpiGrid = $("#kpi-grid");
    kpiGrid.innerHTML = "";
    dashboardKPIs().forEach((k) => {
      const card = el("article", { class: "kpi", onclick: () => kpiClicked(k.key) }, [
        el("div", { class: "kpi__head" }, [
          el("span", { class: "kpi__label", text: k.label }),
          el("span", { class: `kpi__chip kpi__chip--${k.chipKind}`, text: k.chip }),
        ]),
        el("strong", { class: "kpi__num", text: String(k.value) }),
        el("p", { class: "kpi__hint" }, [
          el("span", { class: `trend trend--${k.trend}`, text: k.trend === "up" ? "▲" : k.trend === "down" ? "▼" : "·" }),
          el("span", { text: k.hint }),
        ]),
      ]);
      kpiGrid.appendChild(card);
    });

    // Recent table
    const tbody = $("#recent-tbody");
    tbody.innerHTML = "";
    const filtered = applyQuickFilter(list, state.quickFilter);
    const sortedAndFiltered = filtered.slice().sort(sortByPriority);
    const fs = $("#filter-shift").value;
    const fp = $("#filter-priority").value;
    const visible = sortedAndFiltered.filter((h) => (!fs || h.shift === fs) && (!fp || h.overallPriority === fp)).slice(0, 6);
    if (visible.length === 0) {
      tbody.appendChild(el("tr", {}, [el("td", { colspan: 8, text: state.lang === "vi" ? "Không có handover nào phù hợp." : "No matching handovers." })]));
    } else {
      visible.forEach((h) => tbody.appendChild(recentRow(h, true)));
    }
    $("#filter-shift").addEventListener("change", () => renderDashboard());
    $("#filter-priority").addEventListener("change", () => renderDashboard());

    // Charts
    drawCharts(list);

    // Header actions
    $("#btn-export-csv").addEventListener("click", () => exportCSV(list));
    $("#btn-export-pdf").addEventListener("click", () => window.print());
  }

  function countQuickFilter(id, list) { return applyQuickFilter(list, id).length; }
  function applyQuickFilter(list, id) {
    if (!id) return list;
    if (id === "today") return list.filter((h) => h.handoverDate === new Date().toISOString().slice(0, 10));
    if (id === "7d")    return list.filter((h) => dayDiff(h.handoverDate) <= 7);
    if (id === "high")  return list.filter((h) => ["Critical", "High"].includes(h.overallPriority));
    if (id === "open")  return list.filter((h) => h.overallStatus !== "Resolved");
    if (id === "cf")    return list.filter((h) => h.isCarriedForward);
    if (id === "unack") return list.filter(isCriticalUnack);
    return list;
  }
  function kpiClicked(key) {
    if (key === "high")  navigate("#/log?priority=High");
    else if (key === "ac")    navigate("#/log?cat=aircraft");
    else if (key === "open")  navigate("#/log?status=Open");
    else if (key === "ack")   navigate("#/log?priority=Critical&unack=1");
    else if (key === "cf")    navigate("#/log?cf=1");
    else navigate("#/log");
  }

  // ---------------------------------------------------------------
  // Render: Charts
  // ---------------------------------------------------------------
  let charts = {};
  function destroyCharts() { for (const k of Object.keys(charts)) try { charts[k].destroy(); } catch (e) {} ; charts = {}; }
  function chartColors() {
    const dark = state.theme === "dark";
    return {
      grid: dark ? "rgba(255,255,255,.08)" : "rgba(16,24,40,.08)",
      tick: dark ? "#94a3b8" : "#6b7280",
      bar: ["#0d8a85", "#2e90fa", "#a855f7", "#f59e0b", "#ef4444", "#10b981", "#f97316"],
      pie: ["#d92d20", "#f79009", "#2e90fa", "#12b76a"],
    };
  }
  function drawCharts(list) {
    if (!window.Chart) return;
    destroyCharts();
    const c = chartColors();

    // Issues by category
    const catCounts = Object.keys(seed.CATS).map((k) => {
      let n = 0; for (const h of list) for (const it of (h.items[k] || [])) if (it.status !== "Resolved") n++;
      return { code: seed.CATS[k].label, n };
    });
    charts.cat = new Chart($("#chart-category"), {
      type: "bar",
      data: { labels: catCounts.map((x) => x.code), datasets: [{ data: catCounts.map((x) => x.n), backgroundColor: c.bar, borderRadius: 6 }] },
      options: chartOpts(c, { y: { beginAtZero: true, ticks: { precision: 0 } } }),
    });

    // Priority distribution
    const pri = ["Critical", "High", "Normal", "Low"].map((p) => list.filter((h) => h.overallPriority === p).length);
    charts.pri = new Chart($("#chart-priority"), {
      type: "doughnut",
      data: { labels: ["Critical", "High", "Normal", "Low"], datasets: [{ data: pri, backgroundColor: c.pie, borderColor: "transparent" }] },
      options: chartOpts(c, null, { plugins: { legend: { position: "bottom", labels: { color: c.tick, boxWidth: 10, padding: 10 } } } }),
    });

    // Shift activity
    const sh = ["Morning", "Afternoon", "Night"].map((s) => list.filter((h) => h.shift === s).length);
    charts.shift = new Chart($("#chart-shift"), {
      type: "bar",
      data: { labels: ["Morning", "Afternoon", "Night"], datasets: [{ data: sh, backgroundColor: ["#f4b740", "#f97316", "#6366f1"], borderRadius: 6 }] },
      options: chartOpts(c, { y: { beginAtZero: true, ticks: { precision: 0 } } }),
    });

    // Ab-Normal events
    const types = {};
    for (const h of list) for (const it of (h.items.abnormal || [])) types[it.category] = (types[it.category] || 0) + 1;
    const labels = Object.keys(types);
    charts.abn = new Chart($("#chart-abnormal"), {
      type: "doughnut",
      data: { labels, datasets: [{ data: labels.map((l) => types[l]), backgroundColor: c.bar, borderColor: "transparent" }] },
      options: chartOpts(c, null, { plugins: { legend: { position: "bottom", labels: { color: c.tick, boxWidth: 10, padding: 10 } } } }),
    });
  }
  function chartOpts(c, scales, extras = {}) {
    return Object.assign({
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: "rgba(15,23,42,.96)", titleColor: "#fff", bodyColor: "#fff" } },
      scales: scales ? Object.assign({
        x: { grid: { display: false }, ticks: { color: c.tick } },
        y: Object.assign({ grid: { color: c.grid }, ticks: { color: c.tick } }, scales.y || {}),
      }, scales) : undefined,
    }, extras);
  }

  // ---------------------------------------------------------------
  // Render: Log
  // ---------------------------------------------------------------
  function renderLog(route) {
    // Apply route params
    const p = route.params || {};
    state.logFilter.priority = p.priority || "";
    state.logFilter.status = p.status || "";
    state.logFilter.carry = p.cf === "1";
    state.logFilter.ack = p.unack === "1" ? "unack" : "";

    const list = store.handovers.filter((h) => !h.deletedAt).slice().sort((a, b) => new Date(b.handoverDate) - new Date(a.handoverDate));
    $("#log-subtitle").textContent = state.lang === "vi" ? `${list.length} handovers tổng cộng` : `${list.length} handovers total`;

    const filters = $("#log-filters");
    filters.innerHTML = "";
    filters.appendChild(makeFilterInput());
    filters.appendChild(makeFilterSelect("shift", ["Morning","Afternoon","Night"], state.lang === "vi" ? "Ca" : "Shift"));
    filters.appendChild(makeFilterSelect("priority", ["Critical","High","Normal","Low"], state.lang === "vi" ? "Priority" : "Priority"));
    filters.appendChild(makeFilterSelect("status", ["Open","Monitoring","Resolved"], state.lang === "vi" ? "Status" : "Status"));
    filters.appendChild(makeFilterCheckbox("carry", state.lang === "vi" ? "Carry-forward" : "Carry-forward"));
    filters.appendChild(makeFilterSelect("ack", [["", state.lang === "vi" ? "Tất cả Ack" : "All Ack"], ["acked", "Acknowledged"], ["unack", "Awaiting"]], "", true));
    filters.appendChild(el("button", { class: "btn btn--ghost btn--sm", onclick: clearLogFilters, text: state.lang === "vi" ? "Xoá lọc" : "Clear" }));

    refreshLogRows(list);

    $("#btn-export-csv-log").addEventListener("click", () => exportCSV(filterLog(list)));
  }
  function makeFilterInput() {
    const wrap = el("div", { class: "filter-input" }, [
      el("svg", { viewBox: "0 0 24 24", width: 16, height: 16, fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" }),
    ]);
    wrap.firstElementChild.innerHTML = '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>';
    const inp = el("input", { class: "input", placeholder: state.lang === "vi" ? "Tìm reference, flight, station…" : "Search reference, flight, station…", oninput: (e) => { state.logFilter.q = e.target.value; refreshLogRows(); } });
    inp.value = state.logFilter.q;
    wrap.appendChild(inp);
    return wrap;
  }
  function makeFilterSelect(field, options, label, isPair = false) {
    const sel = el("select", { class: "select", onchange: (e) => { state.logFilter[field] = e.target.value; refreshLogRows(); } });
    sel.appendChild(el("option", { value: "", text: state.lang === "vi" ? `Tất cả ${label}` : `All ${label}` }));
    for (const o of options) {
      if (Array.isArray(o)) sel.appendChild(el("option", { value: o[0], text: o[1] }));
      else sel.appendChild(el("option", { value: o, text: o }));
    }
    sel.value = state.logFilter[field];
    return sel;
  }
  function makeFilterCheckbox(field, label) {
    const id = "f-" + field;
    const wrap = el("label", { class: "chip" + (state.logFilter[field] ? " is-active" : ""), for: id });
    const cb = el("input", { type: "checkbox", id, style: "display:none", onchange: (e) => { state.logFilter[field] = e.target.checked; renderLog(parseHash()); } });
    cb.checked = !!state.logFilter[field];
    wrap.appendChild(cb);
    wrap.appendChild(el("span", { text: label }));
    return wrap;
  }
  function clearLogFilters() {
    state.logFilter = { q: "", shift: "", priority: "", status: "", carry: false, ack: "", range: "30d" };
    navigate("#/log");
  }
  function filterLog(list) {
    const f = state.logFilter;
    return list.filter((h) => {
      if (f.shift && h.shift !== f.shift) return false;
      if (f.priority && h.overallPriority !== f.priority) return false;
      if (f.status && h.overallStatus !== f.status) return false;
      if (f.carry && !h.isCarriedForward) return false;
      if (f.ack === "acked" && !isAcknowledged(h)) return false;
      if (f.ack === "unack" && isAcknowledged(h)) return false;
      if (f.q) {
        const q = f.q.toLowerCase();
        const owner = (store.users.find((u) => u.id === h.preparedById) || {}).name || "";
        const flat = [h.referenceId, h.shift, h.overallPriority, h.overallStatus, h.generalRemarks, owner].join(" ").toLowerCase();
        const itemFlat = Object.keys(h.items || {}).flatMap((k) => h.items[k]).map((it) => Object.values(it).join(" ")).join(" ").toLowerCase();
        if (!flat.includes(q) && !itemFlat.includes(q)) return false;
      }
      return true;
    });
  }
  function refreshLogRows(list) {
    const all = list || store.handovers.filter((h) => !h.deletedAt);
    const filtered = filterLog(all);
    const tbody = $("#log-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (filtered.length === 0) {
      $("#log-empty").hidden = false;
      return;
    }
    $("#log-empty").hidden = true;
    filtered.forEach((h) => {
      const cats = categoryCodes(h);
      const tr = el("tr", {
        class: `${h.isCarriedForward ? "row--carry " : ""}${h.overallPriority === "Critical" ? "row--critical " : ""}${h.overallPriority === "High" ? "row--high " : ""}`.trim(),
        onclick: () => navigate(`#/h/${h.id}`),
      }, [
        el("td", { html: `<strong>${fmtDate(h.handoverDate)}</strong><br><small style="color:var(--fg-mute)">${t("shift." + h.shift.toLowerCase())}</small>` }),
        el("td", { class: "cell--ref", text: h.referenceId }),
        el("td", { text: (store.users.find((u) => u.id === h.preparedById) || {}).name || "—" }),
        el("td", { class: "cell--cats" }, cats.map((c) => el("span", { class: "badge badge--cat", text: c }))),
        el("td", {}, [el("span", { class: priorityBadge(h.overallPriority), text: h.overallPriority })]),
        el("td", {}, [el("span", { class: statusBadge(h.overallStatus), text: h.overallStatus })]),
        el("td", {}, [h.isCarriedForward ? el("span", { class: "badge badge--carry", text: "CF" }) : el("span", { text: "—" })]),
        el("td", {}, [isAcknowledged(h)
          ? el("span", { class: "badge badge--resolved", text: state.lang === "vi" ? "Đã ack" : "Acked" })
          : (h.overallPriority === "Critical" || h.overallPriority === "High")
            ? el("span", { html: '<span class="dot"></span>' + (state.lang === "vi" ? "Chờ ack" : "Awaiting") })
            : el("span", { text: "—" })]),
        el("td", { html: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.5"><polyline points="9 18 15 12 9 6"/></svg>' }),
      ]);
      tbody.appendChild(tr);
    });
  }

  // ---------------------------------------------------------------
  // Render: Detail
  // ---------------------------------------------------------------
  function renderDetail(route) {
    const h = store.handovers.find((x) => x.id === route.id);
    if (!h) {
      $("#detail-head").innerHTML = `<p>${state.lang === "vi" ? "Không tìm thấy handover." : "Handover not found."}</p>`;
      return;
    }
    const head = $("#detail-head");
    head.innerHTML = "";
    const carriedFrom = h.carriedFromId ? store.handovers.find((x) => x.id === h.carriedFromId) : null;

    head.appendChild(el("div", { class: "detail-head__row" }, [
      el("div", { class: "detail-head__title" }, [
        el("h1", { text: `${t("shift." + h.shift.toLowerCase())} · ${fmtDate(h.handoverDate)}` }),
        el("span", { class: priorityBadge(h.overallPriority), text: h.overallPriority }),
        el("span", { class: statusBadge(h.overallStatus), text: h.overallStatus }),
        h.isCarriedForward ? el("span", { class: "badge badge--carry", text: state.lang === "vi" ? "Carried Forward" : "Carried Forward" }) : null,
        isAcknowledged(h) ? el("span", { class: "badge badge--resolved", text: state.lang === "vi" ? "Đã acknowledge" : "Acknowledged" }) : (h.overallPriority === "Critical" || h.overallPriority === "High") ? el("span", { class: "badge badge--critical", text: state.lang === "vi" ? "Chờ acknowledge" : "Awaiting ack" }) : null,
      ]),
      el("div", { class: "detail-head__actions" }, [
        !isAcknowledged(h) && (h.overallPriority === "Critical" || h.overallPriority === "High") && can("ack")
          ? el("button", { class: "btn btn--primary", onclick: () => acknowledgeHandover(h) }, [
              el("span", { html: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> '}),
              el("span", { text: state.lang === "vi" ? "Acknowledge" : "Acknowledge" }),
            ])
          : null,
        can("carry") ? el("button", { class: "btn", onclick: () => toast({ kind: "ok", title: state.lang === "vi" ? "Đã carry-forward (demo)" : "Carried forward (demo)", body: "" }) }, [el("span", { text: state.lang === "vi" ? "Carry forward" : "Carry forward" })]) : null,
        el("button", { class: "btn", onclick: () => exportCSV([h]) }, [el("span", { text: t("action.exportCsv") })]),
        el("button", { class: "btn", onclick: () => window.print() }, [el("span", { text: t("action.printPdf") })]),
      ]),
    ]));

    const meta = el("div", { class: "detail-head__meta" }, [
      el("span", { html: `<strong>${state.lang === "vi" ? "Reference" : "Reference"}:</strong> ${h.referenceId}` }),
      el("span", { html: `<strong>${state.lang === "vi" ? "Người chuẩn bị" : "Prepared by"}:</strong> ${(store.users.find((u) => u.id === h.preparedById) || {}).name || "—"}` }),
      h.handedToId ? el("span", { html: `<strong>${state.lang === "vi" ? "Bàn giao cho" : "Handed to"}:</strong> ${(store.users.find((u) => u.id === h.handedToId) || {}).name || "—"}` }) : null,
      h.submittedAt ? el("span", { html: `<strong>${state.lang === "vi" ? "Submit" : "Submitted"}:</strong> ${fmtDateTime(h.submittedAt)}` }) : null,
      h.acknowledgedAt ? el("span", { html: `<strong>${state.lang === "vi" ? "Ack" : "Acked"}:</strong> ${fmtDateTime(h.acknowledgedAt)}` }) : null,
    ]);
    head.appendChild(meta);

    if (carriedFrom) {
      const link = el("div", { class: "carry-link" }, [
        el("span", { html: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> '}),
        el("span", { text: state.lang === "vi" ? "Items được mang sang từ " : "Items carried forward from " }),
        el("a", { href: `#/h/${carriedFrom.id}`, text: `${carriedFrom.referenceId} · ${t("shift." + carriedFrom.shift.toLowerCase())}` }),
      ]);
      head.appendChild(link);
    }

    if (h.generalRemarks) {
      head.appendChild(el("p", { style: "margin:0;color:var(--fg-soft)", html: `<strong>${state.lang === "vi" ? "Tổng quát" : "General remarks"}:</strong> ${h.generalRemarks}` }));
    }
    if (h.nextShiftActions) {
      head.appendChild(el("p", { style: "margin:0;color:var(--fg-soft)", html: `<strong>${state.lang === "vi" ? "Hành động ca sau" : "Next-shift actions"}:</strong> ${h.nextShiftActions}` }));
    }

    // Main: items by category
    const main = $("#detail-main");
    main.innerHTML = "";
    const cats = Object.keys(seed.CATS).filter((k) => h.items[k] && h.items[k].length);
    if (cats.length === 0) {
      main.appendChild(el("article", { class: "card" }, [
        el("div", { class: "empty" }, [
          el("h3", { text: state.lang === "vi" ? "Chưa có item" : "No items yet" }),
          el("p", { text: state.lang === "vi" ? "Handover này chưa có item theo category nào." : "This handover doesn't contain any category items." }),
        ]),
      ]));
    } else {
      for (const k of cats) {
        const card = el("article", { class: "card section-card" });
        card.appendChild(el("header", { class: "card__head" }, [
          el("div", { class: "card__title-with-count" }, [
            el("span", { class: "badge badge--cat", text: seed.CATS[k].code }),
            el("h2", { class: "card__title", text: seed.CATS[k].label }),
            el("span", { class: "badge", text: String(h.items[k].length) }),
          ]),
        ]));
        for (const it of h.items[k]) card.appendChild(renderItem(k, it));
        main.appendChild(card);
      }
    }

    // Side: audit + acknowledgments
    const side = $("#detail-side");
    side.innerHTML = "";
    side.appendChild(el("div", { class: "side-card" }, [
      el("h3", { text: state.lang === "vi" ? "Audit Trail" : "Audit Trail" }),
      buildTimeline(store.audit.filter((a) => a.target === h.referenceId || (a.target || "").startsWith("i-")).slice(0, 12)),
    ]));
    side.appendChild(el("div", { class: "side-card" }, [
      el("h3", { text: state.lang === "vi" ? "Acknowledgments" : "Acknowledgments" }),
      h.acknowledgedAt
        ? el("p", { style: "margin:0", html: `<strong>${(store.users.find((u) => u.id === h.handedToId) || {}).name || "—"}</strong><br><small style="color:var(--fg-mute)">${fmtDateTime(h.acknowledgedAt)}</small>` })
        : el("p", { style: "margin:0;color:var(--fg-mute)", text: state.lang === "vi" ? "Chưa có acknowledgment." : "Not yet acknowledged." }),
    ]));
  }

  function renderItem(catKey, it) {
    const owner = it.ownerId ? store.users.find((u) => u.id === it.ownerId) : null;
    const node = el("div", { class: "item" }, [
      el("div", { class: "item__head" }, [
        el("h3", { class: "item__title", text: itemTitle(catKey, it) }),
        el("span", { class: priorityBadge(it.priority), text: it.priority }),
        el("span", { class: statusBadge(it.status), text: it.status }),
        statusTrack(it.status),
      ]),
      el("p", { class: "item__remarks", text: itemDesc(catKey, it) }),
      el("div", { class: "item__meta" }, [
        owner ? el("span", { class: "item__owner" }, [
          el("span", { class: "item__owner-avatar", text: owner.initials }),
          el("span", { text: owner.name }),
        ]) : null,
        it.flightsAffected ? el("span", { html: `✈ ${it.flightsAffected}` }) : null,
        it.dueTime ? el("span", { html: `⏱ ${fmtDateTime(it.dueTime)}` }) : null,
        it.resolvedAt ? el("span", { html: `✅ ${state.lang === "vi" ? "Đã giải quyết" : "Resolved"} ${fmtDateTime(it.resolvedAt)}` }) : null,
      ]),
    ]);
    return node;
  }
  function itemTitle(k, it) {
    if (k === "aircraft") return `${it.registration} · ${it.type || ""}`.trim();
    if (k === "airport")  return it.airport;
    if (k === "flight")   return `${it.flightNumber} · ${it.routing || ""}`.trim();
    if (k === "crew")     return `${it.crew} (${it.flight || ""})`;
    if (k === "weather")  return `${it.airport} · ${it.phenomenon || ""}`;
    if (k === "system")   return it.system;
    if (k === "abnormal") return it.category;
    return "Item";
  }
  function itemDesc(k, it) {
    if (k === "abnormal") return it.description || "";
    return it.issue || it.description || it.remarks || "";
  }
  function statusTrack(status) {
    const order = ["Open", "Monitoring", "Resolved"];
    const idx = order.indexOf(status);
    const node = el("span", { class: "status-track" });
    order.forEach((s, i) => {
      if (i > 0) node.appendChild(el("span", { class: "status-track__sep", text: "›" }));
      const cls = i < idx ? "is-done" : i === idx ? "is-current" : "";
      node.appendChild(el("span", { class: `status-track__step ${cls}` }, [
        el("span", { class: "status-track__dot" }),
        el("span", { text: s }),
      ]));
    });
    return node;
  }

  function acknowledgeHandover(h) {
    if (!can("ack")) return;
    h.acknowledgedAt = new Date().toISOString();
    h.handedToId = state.role.id;
    store.audit.unshift({ ts: h.acknowledgedAt, userId: state.role.id, action: "ACKNOWLEDGED", target: h.referenceId, summary: "Handover acknowledged via prototype" });
    saveStore(store);
    refreshCriticalBanner();
    toast({ kind: "ok", title: state.lang === "vi" ? "Đã acknowledge handover" : "Handover acknowledged", body: h.referenceId });
    handleRoute();
  }

  // ---------------------------------------------------------------
  // Render: Audit
  // ---------------------------------------------------------------
  function renderAudit() {
    const list = store.audit.slice(0, 60);
    const ol = $("#audit-timeline");
    ol.innerHTML = "";
    list.forEach((a) => {
      const u = store.users.find((u) => u.id === a.userId);
      ol.appendChild(el("li", {}, [
        el("span", { class: "timeline__dot", html: actionGlyph(a.action) }),
        el("div", { class: "timeline__txt" }, [
          el("strong", { text: `${a.action.replace("_", " ")} · ${a.target}` }),
          el("span", { text: a.summary }),
          el("small", { text: `${(u && u.name) || "—"} · ${fmtDateTime(a.ts)}` }),
        ]),
      ]));
    });
  }
  function actionGlyph(action) {
    if (action === "CREATED") return '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    if (action === "ACKNOWLEDGED") return '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
    if (action === "STATUS_CHANGED") return '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>';
    if (action === "CARRIED_FORWARD") return '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
    return "·";
  }

  function buildTimeline(events) {
    const ol = el("ol", { class: "timeline" });
    if (!events.length) ol.appendChild(el("p", { style: "color:var(--fg-mute);margin:0", text: state.lang === "vi" ? "Chưa có hoạt động." : "No activity yet." }));
    events.forEach((a) => {
      const u = store.users.find((u) => u.id === a.userId);
      ol.appendChild(el("li", {}, [
        el("span", { class: "timeline__dot", html: actionGlyph(a.action) }),
        el("div", { class: "timeline__txt" }, [
          el("strong", { text: a.action.replace("_", " ") }),
          el("span", { text: a.summary }),
          el("small", { text: `${(u && u.name) || "—"} · ${fmtDateTime(a.ts)}` }),
        ]),
      ]));
    });
    return ol;
  }

  // ---------------------------------------------------------------
  // Render: New Handover (3-step)
  // ---------------------------------------------------------------
  function renderNew() {
    if (!can("create")) {
      $("#new-body").innerHTML = `<div class="empty"><h3>${state.lang === "vi" ? "Bạn không có quyền tạo handover" : "Your role cannot create handovers"}</h3><p>${state.lang === "vi" ? "Đăng nhập với role OCC Staff hoặc cao hơn." : "Sign in as OCC Staff or higher."}</p></div>`;
      return;
    }
    if (!state.draft) state.draft = blankDraft();
    paintStepper();
    paintStep();
    $("#step-back").addEventListener("click", () => {
      if (state.draft.step > 1) { state.draft.step -= 1; paintStepper(); paintStep(); }
    });
    $("#step-next").addEventListener("click", () => {
      if (state.draft.step < 3) { state.draft.step += 1; paintStepper(); paintStep(); }
      else submitDraft();
    });
    $("#step-save").addEventListener("click", () => toast({ kind: "ok", title: state.lang === "vi" ? "Đã lưu nháp" : "Draft saved", body: "" }));
  }
  function blankDraft() {
    return {
      step: 1,
      handoverDate: new Date().toISOString().slice(0, 10),
      shift: getCurrentShift(),
      preparedById: state.role.id,
      handedToId: "",
      overallPriority: "Normal",
      generalRemarks: "",
      nextShiftActions: "",
      activeCats: [],
      items: {},
    };
  }
  function paintStepper() {
    $$(".stepper__item").forEach((s) => {
      const n = parseInt(s.dataset.step, 10);
      s.classList.toggle("is-active", n === state.draft.step);
      s.classList.toggle("is-done", n < state.draft.step);
    });
    $("#step-back").disabled = state.draft.step === 1;
    $("#step-next").textContent = state.draft.step === 3 ? (state.lang === "vi" ? "Submit Handover" : "Submit Handover") : (state.lang === "vi" ? "Tiếp tục →" : "Next →");
  }
  function paintStep() {
    const body = $("#new-body");
    body.innerHTML = "";
    if (state.draft.step === 1) body.appendChild(stepHeader());
    if (state.draft.step === 2) body.appendChild(stepCategories());
    if (state.draft.step === 3) body.appendChild(stepReview());
  }
  function stepHeader() {
    const root = el("div", { class: "form" });
    const row1 = el("div", { class: "field--row" }, [
      field({ label: state.lang === "vi" ? "Ngày" : "Date", input: el("input", { class: "input", type: "date", value: state.draft.handoverDate, oninput: (e) => state.draft.handoverDate = e.target.value }) }),
      field({ label: state.lang === "vi" ? "Ca" : "Shift", input: makeShiftToggle() }),
    ]);
    const row2 = el("div", { class: "field--row" }, [
      field({ label: state.lang === "vi" ? "Mức ưu tiên tổng thể" : "Overall priority", input: makePrioritySelect() }),
      field({ label: state.lang === "vi" ? "Bàn giao cho" : "Handed to", input: makeUserSelect("handedToId") }),
    ]);
    const remarks = field({
      label: state.lang === "vi" ? "Tổng quát" : "General remarks",
      help: state.lang === "vi" ? "Tóm tắt ngắn gọn tình hình ca." : "Short shift summary.",
      input: el("textarea", { class: "textarea", oninput: (e) => state.draft.generalRemarks = e.target.value }),
    });
    remarks.querySelector("textarea").value = state.draft.generalRemarks;
    const next = field({
      label: state.lang === "vi" ? "Hành động cho ca sau" : "Next-shift actions",
      help: state.lang === "vi" ? "Việc cần làm tiếp." : "Things the next shift needs to do.",
      input: el("textarea", { class: "textarea", oninput: (e) => state.draft.nextShiftActions = e.target.value }),
    });
    next.querySelector("textarea").value = state.draft.nextShiftActions;

    root.append(row1, row2, remarks, next);
    return root;
  }
  function makeShiftToggle() {
    const wrap = el("div", { style: "display:flex;gap:6px" });
    ["Morning","Afternoon","Night"].forEach((s) => {
      const c = el("button", { type: "button", class: "chip" + (state.draft.shift === s ? " is-active" : ""), onclick: () => { state.draft.shift = s; paintStep(); } }, [
        el("span", { text: t("shift." + s.toLowerCase()) }),
      ]);
      wrap.appendChild(c);
    });
    return wrap;
  }
  function makePrioritySelect() {
    const sel = el("select", { class: "select", onchange: (e) => state.draft.overallPriority = e.target.value });
    ["Low","Normal","High","Critical"].forEach((p) => sel.appendChild(el("option", { value: p, text: p })));
    sel.value = state.draft.overallPriority;
    return sel;
  }
  function makeUserSelect(field) {
    const sel = el("select", { class: "select", onchange: (e) => state.draft[field] = e.target.value });
    sel.appendChild(el("option", { value: "", text: state.lang === "vi" ? "— Chưa chọn —" : "— Not set —" }));
    store.users.forEach((u) => sel.appendChild(el("option", { value: u.id, text: `${u.name} · ${u.role.replace("_", " ")}` })));
    sel.value = state.draft[field];
    return sel;
  }
  function field({ label, help, input }) {
    const f = el("div", { class: "field" }, [el("label", { text: label }), input]);
    if (help) f.appendChild(el("p", { class: "help", text: help }));
    return f;
  }

  function stepCategories() {
    const root = el("div");
    const grid = el("div", { class: "cat-grid" });
    Object.keys(seed.CATS).forEach((k) => {
      const cat = seed.CATS[k];
      const isOn = state.draft.activeCats.includes(k);
      const card = el("button", { type: "button", class: "cat-card" + (isOn ? " is-on" : ""), onclick: () => toggleCat(k) }, [
        el("div", { class: "cat-card__head" }, [
          el("span", { class: "badge badge--cat", text: cat.code }),
          el("span", { text: cat.label }),
        ]),
        el("p", { class: "cat-card__hint", text: catHint(k) }),
        el("p", { class: "cat-card__count", text: state.draft.items[k] ? `${state.draft.items[k].length} item${state.draft.items[k].length === 1 ? "" : "s"}` : (isOn ? "0 items" : "Click để bật") }),
      ]);
      grid.appendChild(card);
    });
    root.appendChild(grid);
    root.appendChild(el("p", { class: "help", style: "margin-top:14px", text: state.lang === "vi" ? "Chỉ những category bật mới phải nhập item. Bạn có thể bật thêm/tắt bất kỳ lúc nào." : "Only enabled categories require items. You can toggle them at any time." }));
    return root;
  }
  function catHint(k) {
    const m = {
      aircraft: state.lang === "vi" ? "AOG, kỹ thuật, dispatch" : "AOG, tech, dispatch",
      airport: state.lang === "vi" ? "Runway, NOTAM, GSE" : "Runway, NOTAM, GSE",
      flight: state.lang === "vi" ? "Delay, cancel, divert" : "Delay, cancel, divert",
      crew: state.lang === "vi" ? "Out-of-hours, positioning" : "Out-of-hours, positioning",
      weather: state.lang === "vi" ? "TS, low-vis, gust" : "TS, low-vis, gust",
      system: state.lang === "vi" ? "ACARS, AIMS, Crew Portal" : "ACARS, AIMS, Crew Portal",
      abnormal: state.lang === "vi" ? "Sự kiện bất thường (báo cáo riêng)" : "Abnormal events (separate report)",
    };
    return m[k] || "";
  }
  function toggleCat(k) {
    const i = state.draft.activeCats.indexOf(k);
    if (i >= 0) state.draft.activeCats.splice(i, 1);
    else state.draft.activeCats.push(k);
    paintStep();
  }

  function stepReview() {
    const d = state.draft;
    const u = store.users.find((u) => u.id === d.preparedById);
    const handed = store.users.find((u) => u.id === d.handedToId);
    const wrap = el("div", { class: "review-grid" });
    const lines = [
      [state.lang === "vi" ? "Reference" : "Reference", "HDO-2026-NEW (auto-generated)"],
      [state.lang === "vi" ? "Ngày · Ca" : "Date · Shift", `${fmtDate(d.handoverDate)} · ${t("shift." + d.shift.toLowerCase())}`],
      [state.lang === "vi" ? "Người chuẩn bị" : "Prepared by", u ? u.name : "—"],
      [state.lang === "vi" ? "Bàn giao cho" : "Handed to", handed ? handed.name : "—"],
      [state.lang === "vi" ? "Mức ưu tiên" : "Priority", d.overallPriority],
      [state.lang === "vi" ? "Tổng quát" : "General remarks", d.generalRemarks || "—"],
      [state.lang === "vi" ? "Hành động ca sau" : "Next-shift actions", d.nextShiftActions || "—"],
      [state.lang === "vi" ? "Categories" : "Categories", d.activeCats.length ? d.activeCats.map((k) => seed.CATS[k].label).join(", ") : "—"],
    ];
    lines.forEach(([k, v]) => wrap.appendChild(el("div", { class: "review-row" }, [el("strong", { text: k }), el("span", { text: v })])));
    wrap.appendChild(el("p", { class: "help", text: state.lang === "vi" ? "Bấm Submit để lưu vào localStorage. Tham chiếu HDO-… sẽ được tự sinh ngay (BR-02)." : "Click Submit to save into localStorage. The HDO-… reference is auto-generated (BR-02)." }));
    return wrap;
  }
  function nextRef() {
    const all = store.handovers.map((h) => h.referenceId);
    const max = Math.max.apply(null, all.map((r) => parseInt((r.match(/-(\d+)$/) || [])[1] || 0, 10)));
    return `HDO-${new Date().getFullYear()}-${String(max + 1).padStart(6, "0")}`;
  }
  function submitDraft() {
    const d = state.draft;
    const id = "h-" + Date.now();
    const newH = {
      id, referenceId: nextRef(),
      handoverDate: d.handoverDate, shift: d.shift,
      preparedById: d.preparedById, handedToId: d.handedToId || null,
      overallPriority: d.overallPriority, overallStatus: "Open",
      generalRemarks: d.generalRemarks || null, nextShiftActions: d.nextShiftActions || null,
      isCarriedForward: false, submittedAt: new Date().toISOString(), acknowledgedAt: null,
      items: {},
    };
    store.handovers.unshift(newH);
    store.audit.unshift({ ts: newH.submittedAt, userId: state.role.id, action: "CREATED", target: newH.referenceId, summary: "Handover created via prototype" });
    saveStore(store);
    state.draft = null;
    refreshCriticalBanner();
    document.getElementById("record-count").textContent = store.handovers.length;
    toast({ kind: "ok", title: state.lang === "vi" ? "Đã tạo handover" : "Handover created", body: newH.referenceId });
    navigate(`#/h/${id}`);
  }

  // ---------------------------------------------------------------
  // Render: Help
  // ---------------------------------------------------------------
  function renderHelp() {
    const swatches = [
      ["Critical", "var(--p-critical)"],
      ["High", "var(--p-high)"],
      ["Normal", "var(--p-normal)"],
      ["Low", "var(--p-low)"],
      ["Open", "var(--s-open)"],
      ["Monitoring", "var(--s-monitoring)"],
      ["Resolved", "var(--s-resolved)"],
      ["Accent", "var(--accent)"],
      ["Shift", "var(--shift-color)"],
    ];
    const root = $("#swatches");
    root.innerHTML = "";
    swatches.forEach(([n, v]) => root.appendChild(el("div", { class: "swatch" }, [
      el("div", { class: "swatch__chip", style: `background:${v}` }),
      el("strong", { text: n }),
      el("small", { text: v }),
    ])));
  }

  // ---------------------------------------------------------------
  // Toasts
  // ---------------------------------------------------------------
  function toast({ kind = "ok", title, body }) {
    const t = el("div", { class: `toast toast--${kind}` }, [
      el("strong", { text: title }),
      body ? el("small", { text: body }) : null,
    ]);
    $("#toasts").appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  // ---------------------------------------------------------------
  // Export CSV (simple)
  // ---------------------------------------------------------------
  function exportCSV(list) {
    const headers = ["referenceId","handoverDate","shift","priority","status","preparedBy","carriedForward","acknowledged","openItems","flightsAffected"];
    const rows = list.map((h) => {
      const u = store.users.find((u) => u.id === h.preparedById);
      return [
        h.referenceId, h.handoverDate, h.shift, h.overallPriority, h.overallStatus,
        u ? u.name : "", h.isCarriedForward ? "yes" : "", isAcknowledged(h) ? "yes" : "",
        openItemsCount(h), flightsAffectedTotal(h),
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = el("a", { href: url, download: `handovers-${Date.now()}.csv` });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast({ kind: "ok", title: state.lang === "vi" ? "Đã xuất CSV" : "CSV exported", body: `${list.length} record${list.length === 1 ? "" : "s"}` });
  }

  // ---------------------------------------------------------------
  // Sidebar / topbar wiring
  // ---------------------------------------------------------------
  function openSidebar() { state.sidebarOpen = true; $("#sidebar").classList.add("is-open"); $("#scrim").hidden = false; $("#open-sidebar").setAttribute("aria-expanded","true"); }
  function closeSidebar() { state.sidebarOpen = false; $("#sidebar").classList.remove("is-open"); $("#scrim").hidden = true; $("#open-sidebar").setAttribute("aria-expanded","false"); }

  function openRoleMenu() {
    const menu = $("#role-menu");
    menu.innerHTML = "";
    store.users.forEach((u) => {
      const b = el("button", { type: "button", onclick: () => { loginAs(u); menu.hidden = true; } }, [
        el("span", { class: "user-menu__avatar", text: u.initials }),
        el("span", {}, [el("strong", { text: u.name }), el("small", { html: `<br>${u.role.replace("_", " ")}` })]),
        el("span", { class: `badge ${rolebadge(u.role)}`, text: state.role && state.role.id === u.id ? "Active" : "" }),
      ]);
      menu.appendChild(b);
    });
    menu.appendChild(el("button", { type: "button", onclick: () => { menu.hidden = true; logout(); } }, [
      el("span", { html: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' }),
      el("span", { text: t("nav.logout") }),
    ]));
    menu.hidden = false;
  }

  // ---------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------
  function bootClock() {
    function tick() {
      const d = new Date();
      $("#clock-time").textContent = d.toLocaleTimeString(state.lang === "vi" ? "vi-VN" : "en-GB", { hour12: false });
      $("#clock-date").textContent = d.toLocaleDateString(state.lang === "vi" ? "vi-VN" : "en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
      applyShift();
    }
    tick();
    setInterval(tick, 1000);
  }
  function bindGlobalShortcuts() {
    document.addEventListener("keydown", (e) => {
      const target = e.target;
      const isField = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
      if (e.key === "?") { e.preventDefault(); $("#shortcut-modal").hidden = !$("#shortcut-modal").hidden; return; }
      if (e.key === "Escape") { $("#shortcut-modal").hidden = true; $("#role-menu").hidden = true; closeSidebar(); if (target === $("#global-search")) target.blur(); return; }
      if (isField) return;
      if (e.key === "n" || e.key === "N") { navigate("#/new"); }
      else if (e.key === "d" || e.key === "D") { navigate("#/dashboard"); }
      else if (e.key === "l" || e.key === "L") { navigate("#/log"); }
      else if (e.key === "/") { e.preventDefault(); $("#global-search").focus(); }
      else if (e.key === "t" || e.key === "T") { toggleTheme(); }
      else if (e.key === "a" || e.key === "A") {
        const r = parseHash();
        if (r.name === "h" && r.id) {
          const h = store.handovers.find((x) => x.id === r.id);
          if (h) acknowledgeHandover(h);
        }
      }
    });
  }
  function toggleTheme() { state.theme = state.theme === "light" ? "dark" : "light"; applyTheme(); savePrefs(); if (state.currentRoute.name === "dashboard") drawCharts(store.handovers); }
  function toggleLang() {
    state.lang = state.lang === "vi" ? "en" : "vi"; savePrefs();
    applyI18n(document);
    if (state.role) { handleRoute(); refreshCriticalBanner(); }
    else renderLogin();
  }

  function init() {
    applyTheme();
    applyShift();
    applyI18n(document);
    bootClock();
    bindGlobalShortcuts();

    $("#open-sidebar").addEventListener("click", openSidebar);
    $("#scrim").addEventListener("click", closeSidebar);
    $("#theme-toggle").addEventListener("click", toggleTheme);
    $("#lang-toggle").addEventListener("click", toggleLang);
    $("#role-button").addEventListener("click", openRoleMenu);
    $("#logout").addEventListener("click", logout);
    $("#shortcut-close").addEventListener("click", () => $("#shortcut-modal").hidden = true);
    $("#critical-banner-close").addEventListener("click", () => $("#critical-banner").hidden = true);
    $("#global-search").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        state.logFilter.q = e.target.value;
        navigate("#/log");
      }
    });

    if (state.role) showApp();
    else showLogin();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
