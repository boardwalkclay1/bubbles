// =======================================
// LAUNDRY BUBBLES — Client Dashboard
// =======================================

// ===========================
// STORAGE KEYS
// ===========================
const LB_USERS    = "lb_users";
const LB_REQUESTS = "lb_requests";
const LB_CURRENT  = "lb_currentUser";

function getUsers()    { return JSON.parse(localStorage.getItem(LB_USERS)    || "[]"); }
function getRequests() { return JSON.parse(localStorage.getItem(LB_REQUESTS) || "[]"); }
function saveUsers(u)  { localStorage.setItem(LB_USERS,    JSON.stringify(u)); }
function saveReqs(r)   { localStorage.setItem(LB_REQUESTS, JSON.stringify(r)); }
function genId()       { return "r_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7); }

// ===========================
// AUTH CHECK (runs immediately)
// ===========================
const currentUserId = localStorage.getItem(LB_CURRENT);
let currentUser = null;

if (!currentUserId) {
  window.location.href = "index.html";
} else {
  const _users = getUsers();
  currentUser = _users.find(u => u.id === currentUserId) || null;
  if (!currentUser) {
    window.location.href = "index.html";
  } else if (currentUser.role !== "client") {
    window.location.href = "washer.html";
  }
}

// ===========================
// INIT
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  // Tab switching
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
      btn.classList.add("active");
      const tabEl = document.getElementById("tab-" + btn.dataset.tab);
      if (tabEl) tabEl.classList.add("active");
      loadTabData(btn.dataset.tab);
    });
  });

  // Logout
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem(LB_CURRENT);
    window.location.href = "index.html";
  });

  // Forms
  document.getElementById("requestForm")?.addEventListener("submit", submitRequest);
  document.getElementById("clientProfileForm")?.addEventListener("submit", saveProfile);
  document.getElementById("clientPaymentForm")?.addEventListener("submit", savePayment);

  // Initial data
  loadProfile();
  loadTabData("dashboard");
});

// ===========================
// TAB ROUTER
// ===========================
function loadTabData(tab) {
  switch (tab) {
    case "dashboard":   loadDashboard();  break;
    case "my-requests": loadMyRequests(); break;
    case "profile":     loadProfile();    break;
  }
}

function switchTab(name) {
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll(".tab-content").forEach(t => t.classList.toggle("active", t.id === "tab-" + name));
  loadTabData(name);
}

// ===========================
// DASHBOARD
// ===========================
function loadDashboard() {
  const reqs      = getRequests().filter(r => r.clientId === currentUserId);
  const completed = reqs.filter(r => r.status === "completed");
  const pending   = reqs.filter(r => r.status !== "completed");

  document.getElementById("statTotal").textContent     = reqs.length;
  document.getElementById("statCompleted").textContent = completed.length;
  document.getElementById("statPending").textContent   = pending.length;

  const activity = document.getElementById("recentActivity");
  const recent = [...reqs].sort((a, b) => b.created.localeCompare(a.created)).slice(0, 5);

  if (recent.length === 0) {
    activity.innerHTML = "<div class='list-item'>No requests yet. Go to New Request to get started!</div>";
  } else {
    activity.innerHTML = recent.map(r => `
      <div class="job-card">
        <div>
          <span class="status-badge status-${escAttr(r.status)}">${escHtml(r.status)}</span>
          <strong style="margin-left:8px;">${escHtml(serviceLabel(r.serviceType))}</strong>
        </div>
        <div style="font-size:0.82rem;color:var(--text-muted);">${escHtml(r.pickupAddress)}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);">${formatDate(r.created)}</div>
      </div>
    `).join("");
  }
}

// ===========================
// NEW REQUEST
// ===========================
function submitRequest(e) {
  e.preventDefault();
  const pickupAddress = (document.getElementById("pickupAddress")?.value || "").trim();
  if (!pickupAddress) { alert("Pickup address is required."); return; }

  const req = {
    id:           genId(),
    clientId:     currentUserId,
    washerId:     null,
    status:       "open",
    serviceType:  document.getElementById("serviceType")?.value || "wash-fold",
    items:        (document.getElementById("itemsList")?.value   || "").trim(),
    instructions: (document.getElementById("instructions")?.value || "").trim(),
    pickupAddress,
    budget:       parseFloat(document.getElementById("budget")?.value) || null,
    created:      new Date().toISOString(),
    completedAt:  null
  };

  const reqs = getRequests();
  reqs.push(req);
  saveReqs(reqs);

  document.getElementById("requestForm").reset();
  alert("Request posted! Washers can now browse and accept it.");
  switchTab("my-requests");
}

// ===========================
// MY REQUESTS
// ===========================
function loadMyRequests() {
  const list  = document.getElementById("myRequestsList");
  const reqs  = getRequests()
    .filter(r => r.clientId === currentUserId)
    .sort((a, b) => b.created.localeCompare(a.created));

  if (reqs.length === 0) {
    list.innerHTML = "<div class='list-item'>No requests yet.</div>";
    return;
  }

  const users = getUsers();
  list.innerHTML = reqs.map(r => {
    const washer = r.washerId ? users.find(u => u.id === r.washerId) : null;
    return `
      <div class="job-card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong>${escHtml(serviceLabel(r.serviceType))}</strong>
          <span class="status-badge status-${escAttr(r.status)}">${escHtml(r.status)}</span>
        </div>
        ${r.items ? `<div style="font-size:0.85rem;"><strong>Items:</strong> ${escHtml(r.items)}</div>` : ""}
        ${r.instructions ? `<div style="font-size:0.85rem;"><strong>Notes:</strong> ${escHtml(r.instructions)}</div>` : ""}
        <div style="font-size:0.85rem;"><strong>Pickup:</strong> ${escHtml(r.pickupAddress)}</div>
        ${r.budget ? `<div style="font-size:0.85rem;"><strong>Budget:</strong> $${r.budget.toFixed(2)}</div>` : ""}
        <div style="font-size:0.82rem;color:var(--text-muted);">
          <strong>Washer:</strong> ${washer ? escHtml(washer.name) : "Not yet assigned"}
          ${washer?.phone ? ` &middot; ${escHtml(washer.phone)}` : ""}
        </div>
        <div style="font-size:0.78rem;color:var(--text-muted);">Posted ${formatDate(r.created)}</div>
      </div>
    `;
  }).join("");
}

// ===========================
// PROFILE
// ===========================
function loadProfile() {
  if (!currentUser) return;
  const f = v => v || "";
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = f(val); };
  set("clientName",    currentUser.name);
  set("clientPhone",   currentUser.phone);
  set("clientAddress", currentUser.address);
  set("clientApplePay", currentUser.applePay);
  set("clientCashApp",  currentUser.cashApp);
  set("clientPaypal",   currentUser.paypal);
  set("clientCardNote", currentUser.cardNote);
}

function saveProfile(e) {
  e.preventDefault();
  const users = getUsers();
  const idx = users.findIndex(u => u.id === currentUserId);
  if (idx === -1) return;
  users[idx].name    = (document.getElementById("clientName")?.value    || "").trim() || users[idx].name;
  users[idx].phone   = (document.getElementById("clientPhone")?.value   || "").trim();
  users[idx].address = (document.getElementById("clientAddress")?.value || "").trim();
  saveUsers(users);
  currentUser = users[idx];
  alert("Profile saved!");
}

function savePayment(e) {
  e.preventDefault();
  const users = getUsers();
  const idx = users.findIndex(u => u.id === currentUserId);
  if (idx === -1) return;
  users[idx].applePay = (document.getElementById("clientApplePay")?.value || "").trim();
  users[idx].cashApp  = (document.getElementById("clientCashApp")?.value  || "").trim();
  users[idx].paypal   = (document.getElementById("clientPaypal")?.value   || "").trim();
  users[idx].cardNote = (document.getElementById("clientCardNote")?.value || "").trim();
  saveUsers(users);
  currentUser = users[idx];
  alert("Payment info saved!");
}

// ===========================
// HELPERS
// ===========================
function serviceLabel(type) {
  const map = {
    "wash-fold":      "Wash & Fold",
    "wash-iron":      "Wash, Dry & Iron",
    "dry-clean":      "Dry Clean",
    "delicates":      "Delicates / Hand Wash",
    "pickup-dropoff": "Pickup & Drop-off"
  };
  return map[type] || type || "Laundry Service";
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escAttr(str) {
  return String(str).replace(/[^a-z0-9_-]/gi, "");
}

