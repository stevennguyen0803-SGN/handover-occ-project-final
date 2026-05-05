/* Seed data for OCC Handover Friendly Redesign Prototype.
 * Mirrors the Phase 4 UAT scenarios from docs/uat/UAT_SCENARIOS.md.
 * All references use HDO-YYYY-NNNNNN per BR-02.
 * Item statuses follow BR-05; ownerId is set on Open + High/Critical per BR-06.
 */
(function () {
  const TODAY = new Date();
  const ymd = (d) => d.toISOString().slice(0, 10);
  const dayShift = (offsetDays, hh, mm = 0) => {
    const d = new Date(TODAY);
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hh, mm, 0, 0);
    return d.toISOString();
  };

  const USERS = [
    { id: "u-staff",  name: "Lê Thu",    initials: "LT", role: "OCC_STAFF",         email: "staff@occ.test",      desc: "Tạo handover, cập nhật item, acknowledge ca tiếp." },
    { id: "u-sup",    name: "Nguyễn Hậu",initials: "NH", role: "SUPERVISOR",        email: "supervisor@occ.test", desc: "Carry-forward, ack High/Critical, soft-delete." },
    { id: "u-view",   name: "Trần Minh", initials: "TM", role: "MANAGEMENT_VIEWER", email: "viewer@occ.test",     desc: "Read-only — log, dashboard, audit." },
    { id: "u-admin",  name: "Phạm Quân", initials: "PQ", role: "ADMIN",             email: "admin@occ.test",      desc: "Full access — quản lý user + tất cả mutation." },
  ];

  const CATS = {
    aircraft: { code: "AC",   label: "Aircraft" },
    airport:  { code: "APT",  label: "Airport" },
    flight:   { code: "SKED", label: "Flight Schedule" },
    crew:     { code: "CREW", label: "Crew" },
    weather:  { code: "WX",   label: "Weather" },
    system:   { code: "SYS",  label: "System" },
    abnormal: { code: "ABN",  label: "Ab-Normal" },
  };

  // 6 handovers covering 5 UAT scenarios + 1 normal.
  const HANDOVERS = [
    {
      id: "h-1",
      referenceId: "HDO-2026-001371",
      handoverDate: ymd(new Date(TODAY)),
      shift: "Morning",
      preparedById: "u-sup",
      handedToId: null,
      overallPriority: "Critical",
      overallStatus: "Open",
      generalRemarks: "Scenario 1 — AOG aircraft 9M-MXA at WMKK. Engineering ETA 1500L.",
      nextShiftActions: "Theo dõi ETA phụ tùng, phối hợp với MMOC, cập nhật flight rebook.",
      isCarriedForward: false,
      submittedAt: dayShift(0, 6, 30),
      acknowledgedAt: null,
      items: {
        aircraft: [
          { id: "i-1-1", registration: "9M-MXA", type: "A320", issue: "AOG — engine bleed leak", priority: "Critical", status: "Open", flightsAffected: "AXA205, AXA206, AXA207", ownerId: "u-sup", dueTime: dayShift(0, 14), remarks: "Phụ tùng đến lúc 13:00L; tech đã đến hangar." },
        ],
        abnormal: [
          { id: "i-1-2", category: "AOG", description: "AOG declared 06:10L tại WMKK", priority: "Critical", status: "Open", ownerId: "u-sup" },
        ],
        flight: [
          { id: "i-1-3", flightNumber: "AXA205", routing: "WMKK-VVNB", issue: "Cancelled — rebook PAX sang AXA207", priority: "High", status: "Monitoring", flightsAffected: "AXA205", ownerId: "u-sup" },
        ],
      },
    },
    {
      id: "h-2",
      referenceId: "HDO-2026-001372",
      handoverDate: ymd(new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - 1)),
      shift: "Night",
      preparedById: "u-staff",
      handedToId: "u-sup",
      overallPriority: "High",
      overallStatus: "Monitoring",
      generalRemarks: "Scenario 2 — Weather disruption WMKK CB cells, cascade delay.",
      nextShiftActions: "Xem METAR/TAF mỗi 30 phút, cân nhắc divert WSSS / VVNB.",
      isCarriedForward: true,
      submittedAt: dayShift(-1, 22, 0),
      acknowledgedAt: dayShift(0, 6, 5),
      items: {
        weather: [
          { id: "i-2-1", airport: "WMKK", phenomenon: "TS / CB cells", priority: "High", status: "Monitoring", flightsAffected: "AXA100-AXA120", ownerId: "u-staff", remarks: "TAF cải thiện sau 02:00Z." },
        ],
        flight: [
          { id: "i-2-2", flightNumber: "AXA100-AXA120", routing: "WMKK", issue: "Cascade delay 45–90 mins", priority: "High", status: "Open", flightsAffected: "20 chuyến", ownerId: "u-staff" },
        ],
        airport: [
          { id: "i-2-3", airport: "WMKK", issue: "Runway 32R bị sét đánh — Notam C0432/26", priority: "High", status: "Monitoring", flightsAffected: "—", ownerId: "u-sup" },
        ],
      },
    },
    {
      id: "h-3",
      referenceId: "HDO-2026-001373",
      handoverDate: ymd(new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - 2)),
      shift: "Afternoon",
      preparedById: "u-sup",
      handedToId: "u-staff",
      overallPriority: "High",
      overallStatus: "Monitoring",
      generalRemarks: "Scenario 3 — Crew positioning issue AXA310, Captain Iskandar OOH.",
      nextShiftActions: "Xác nhận positioning flight, cập nhật roster.",
      isCarriedForward: false,
      submittedAt: dayShift(-2, 14, 30),
      acknowledgedAt: dayShift(-2, 22, 0),
      items: {
        crew: [
          { id: "i-3-1", crew: "Captain Iskandar", flight: "AXA310", issue: "Out-of-hours, positioning needed", priority: "High", status: "Resolved", ownerId: "u-staff", resolvedAt: dayShift(-2, 19, 0) },
        ],
        flight: [
          { id: "i-3-2", flightNumber: "AXA310", routing: "WMKK-VVNB", issue: "Positioning JDP010 thay thế", priority: "Normal", status: "Resolved", ownerId: "u-staff", resolvedAt: dayShift(-2, 20, 30) },
        ],
      },
    },
    {
      id: "h-4",
      referenceId: "HDO-2026-001374",
      handoverDate: ymd(new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - 3)),
      shift: "Morning",
      preparedById: "u-staff",
      handedToId: "u-sup",
      overallPriority: "High",
      overallStatus: "Resolved",
      generalRemarks: "Scenario 4 — System degradation: ACARS intermittent over Bay of Bengal.",
      nextShiftActions: "Xác nhận với SITA / ARINC link đã ổn định.",
      isCarriedForward: false,
      submittedAt: dayShift(-3, 6, 0),
      acknowledgedAt: dayShift(-3, 14, 0),
      items: {
        system: [
          { id: "i-4-1", system: "ACARS", issue: "Intermittent uplink over Bay of Bengal", priority: "High", status: "Resolved", ownerId: "u-staff", resolvedAt: dayShift(-3, 12, 0) },
        ],
        abnormal: [
          { id: "i-4-2", category: "Comms degraded", description: "ACARS gap 03:00Z–05:30Z, fallback HF/SATCOM", priority: "Normal", status: "Resolved", ownerId: "u-staff", resolvedAt: dayShift(-3, 12, 0) },
        ],
      },
    },
    {
      id: "h-5",
      referenceId: "HDO-2026-001375",
      handoverDate: ymd(new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - 4)),
      shift: "Afternoon",
      preparedById: "u-staff",
      handedToId: "u-sup",
      overallPriority: "Normal",
      overallStatus: "Resolved",
      generalRemarks: "Scenario 5 — Multi-category normal shift @ WSSS, Crew Portal slow.",
      nextShiftActions: "Theo dõi Crew Portal performance.",
      isCarriedForward: false,
      submittedAt: dayShift(-4, 14, 0),
      acknowledgedAt: dayShift(-4, 22, 0),
      items: {
        airport: [
          { id: "i-5-1", airport: "WSSS", issue: "GSE shortage, taxi delay 5–10 mins", priority: "Normal", status: "Resolved", ownerId: "u-staff", resolvedAt: dayShift(-4, 17, 0) },
        ],
        system: [
          { id: "i-5-2", system: "Crew Portal", issue: "Page load chậm 6–8s", priority: "Low", status: "Resolved", ownerId: "u-staff", resolvedAt: dayShift(-4, 18, 0) },
        ],
        flight: [
          { id: "i-5-3", flightNumber: "AXA600", routing: "WSSS-WMKK", issue: "Slot delay 20m", priority: "Normal", status: "Resolved", ownerId: "u-staff", resolvedAt: dayShift(-4, 17, 30) },
        ],
      },
    },
    {
      id: "h-6",
      referenceId: "HDO-2026-001370",
      handoverDate: ymd(new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - 5)),
      shift: "Night",
      preparedById: "u-sup",
      handedToId: "u-staff",
      overallPriority: "Low",
      overallStatus: "Resolved",
      generalRemarks: "Ca trực bình thường, không có sự cố lớn.",
      nextShiftActions: "—",
      isCarriedForward: false,
      submittedAt: dayShift(-5, 22, 0),
      acknowledgedAt: dayShift(-5, 22, 30),
      items: {
        airport: [
          { id: "i-6-1", airport: "VVNB", issue: "Runway maintenance window 02:00-04:00L", priority: "Low", status: "Resolved", ownerId: "u-sup", resolvedAt: dayShift(-5, 4, 0) },
        ],
      },
    },
  ];

  // Audit log entries
  const AUDIT = [];
  for (const h of HANDOVERS) {
    AUDIT.push({ ts: h.submittedAt, userId: h.preparedById, action: "CREATED", target: h.referenceId, summary: "Handover created" });
    if (h.acknowledgedAt) AUDIT.push({ ts: h.acknowledgedAt, userId: h.handedToId || h.preparedById, action: "ACKNOWLEDGED", target: h.referenceId, summary: "Handover acknowledged by incoming shift" });
    if (h.isCarriedForward) AUDIT.push({ ts: h.submittedAt, userId: h.preparedById, action: "CARRIED_FORWARD", target: h.referenceId, summary: "Items carried forward from previous shift" });
    for (const cat of Object.keys(h.items || {})) {
      for (const it of h.items[cat]) {
        if (it.resolvedAt) AUDIT.push({ ts: it.resolvedAt, userId: it.ownerId || h.preparedById, action: "STATUS_CHANGED", target: it.id, summary: `${CATS[cat].label}: ${it.issue || it.description || it.phenomenon || ''} → Resolved` });
      }
    }
  }
  AUDIT.sort((a, b) => (a.ts < b.ts ? 1 : -1));

  window.__SEED__ = { USERS, HANDOVERS, AUDIT, CATS };
})();
