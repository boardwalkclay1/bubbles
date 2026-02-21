// =======================================
// LAUNDRY BUBBLES — Washer Dashboard
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
  } else if (currentUser.role !== "washer") {
    window.location.href = "client.html";
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
  document.getElementById("washerProfileForm")?.addEventListener("submit", saveProfile);
  document.getElementById("washerPaymentForm")?.addEventListener("submit", savePayment);

  // Initial data
  loadProfile();
  loadTabData("dashboard");
});

// ===========================
// TAB ROUTER
// ===========================
function loadTabData(tab) {
  switch (tab) {
    case "dashboard":     loadDashboard();     break;
    case "find-jobs":     loadFindJobs();      break;
    case "active-jobs":   loadActiveJobs();    break;
    case "completed-jobs":loadCompletedJobs(); break;
    case "profile":       loadProfile();       break;
  }
}

// ===========================
// DASHBOARD
// ===========================
function loadDashboard() {
  const reqs      = getRequests().filter(r => r.washerId === currentUserId);
  const completed = reqs.filter(r => r.status === "completed");
  const active    = reqs.filter(r => r.status === "accepted");
  const earnings  = completed.reduce((sum, r) => sum + (r.budget || 0), 0);

  document.getElementById("statTotal").textContent     = reqs.length;
  document.getElementById("statCompleted").textContent = completed.length;
  document.getElementById("statActive").textContent    = active.length;
  document.getElementById("statEarnings").textContent  = "$" + earnings.toFixed(2);

  const activity = document.getElementById("recentActivity");
  const recent = [...reqs].sort((a, b) => b.created.localeCompare(a.created)).slice(0, 5);

  if (recent.length === 0) {
    activity.innerHTML = "<div class='list-item'>No jobs yet. Go to Find Jobs to get started!</div>";
  } else {
    const users = getUsers();
    activity.innerHTML = recent.map(r => {
      const client = users.find(u => u.id === r.clientId);
      return `
        <div class="job-card">
          <div>
            <span class="status-badge status-${escAttr(r.status)}">${escHtml(r.status)}</span>
            <strong style="margin-left:8px;">${escHtml(serviceLabel(r.serviceType))}</strong>
          </div>
          <div style="font-size:0.82rem;color:var(--text-muted);">Client: ${escHtml(client?.name || "Unknown")}</div>
          <div style="font-size:0.78rem;color:var(--text-muted);">${formatDate(r.created)}</div>
        </div>
      `;
    }).join("");
  }
}

// ===========================
// FIND JOBS
// ===========================
function loadFindJobs() {
  const list = document.getElementById("availableJobsList");
  const reqs = getRequests()
    .filter(r => r.status === "open")
    .sort((a, b) => b.created.localeCompare(a.created));

  if (reqs.length === 0) {
    list.innerHTML = "<div class='list-item'>No available jobs right now. Check back soon!</div>";
    return;
  }

  const users = getUsers();
  list.innerHTML = reqs.map(r => {
    const client = users.find(u => u.id === r.clientId);
    return `
      <div class="job-card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong>${escHtml(serviceLabel(r.serviceType))}</strong>
          ${r.budget ? `<span style="color:var(--accent-yellow);font-weight:700;">$${r.budget.toFixed(2)}</span>` : ""}
        </div>
        <div style="font-size:0.85rem;"><strong>Client:</strong> ${escHtml(client?.name || "Anonymous")}</div>
        ${r.items ? `<div style="font-size:0.85rem;"><strong>Items:</strong> ${escHtml(r.items)}</div>` : ""}
        ${r.instructions ? `<div style="font-size:0.85rem;"><strong>Notes:</strong> ${escHtml(r.instructions)}</div>` : ""}
        <div style="font-size:0.85rem;"><strong>Pickup:</strong> ${escHtml(r.pickupAddress)}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);">Posted ${formatDate(r.created)}</div>
        <div class="job-card-actions">
          <button class="primary-btn" style="font-size:0.82rem;padding:6px 14px;"
                  onclick="acceptJob('${escAttr(r.id)}')">Accept Job →</button>
        </div>
      </div>
    `;
  }).join("");
}

// ===========================
// ACCEPT JOB
// ===========================
window.acceptJob = function (reqId) {
  const reqs = getRequests();
  const idx  = reqs.findIndex(r => r.id === reqId);
  if (idx === -1) { alert("Job not found."); return; }
  if (reqs[idx].status !== "open") { alert("This job has already been taken."); loadFindJobs(); return; }

  reqs[idx].status   = "accepted";
  reqs[idx].washerId = currentUserId;
  saveReqs(reqs);

  alert("Job accepted! Find it in Active Jobs.");
  loadFindJobs();
};

// ===========================
// ACTIVE JOBS
// ===========================
function loadActiveJobs() {
  const list = document.getElementById("activeJobsList");
  const reqs = getRequests()
    .filter(r => r.washerId === currentUserId && r.status === "accepted")
    .sort((a, b) => b.created.localeCompare(a.created));

  if (reqs.length === 0) {
    list.innerHTML = "<div class='list-item'>No active jobs. Accept jobs from the Find Jobs tab.</div>";
    return;
  }

  const users = getUsers();
  list.innerHTML = reqs.map(r => {
    const client = users.find(u => u.id === r.clientId);
    const payParts = [
      client?.applePay ? `Apple Pay: ${escHtml(client.applePay)}` : "",
      client?.cashApp  ? `Cash App: ${escHtml(client.cashApp)}`   : "",
      client?.paypal   ? `PayPal: ${escHtml(client.paypal)}`       : "",
      client?.cardNote ? `Card: ${escHtml(client.cardNote)}`       : ""
    ].filter(Boolean);

    return `
      <div class="job-card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong>${escHtml(serviceLabel(r.serviceType))}</strong>
          <span class="status-badge status-accepted">In Progress</span>
        </div>
        <div style="font-size:0.85rem;">
          <strong>Client:</strong> ${escHtml(client?.name || "Unknown")}
          ${client?.phone ? ` &middot; ${escHtml(client.phone)}` : ""}
        </div>
        ${payParts.length ? `<div style="font-size:0.8rem;color:var(--text-muted);">${payParts.join(" &middot; ")}</div>` : ""}
        ${r.items ? `<div style="font-size:0.85rem;"><strong>Items:</strong> ${escHtml(r.items)}</div>` : ""}
        ${r.instructions ? `<div style="font-size:0.85rem;"><strong>Notes:</strong> ${escHtml(r.instructions)}</div>` : ""}
        <div style="font-size:0.85rem;"><strong>Pickup:</strong> ${escHtml(r.pickupAddress)}</div>
        ${r.budget ? `<div style="font-size:0.85rem;"><strong>Budget:</strong> $${r.budget.toFixed(2)}</div>` : ""}
        <div style="font-size:0.78rem;color:var(--text-muted);">Accepted ${formatDate(r.created)}</div>
        <div class="job-card-actions">
          <button class="primary-btn" style="font-size:0.82rem;padding:6px 14px;"
                  onclick="completeJob('${escAttr(r.id)}')">✓ Mark Complete</button>
        </div>
      </div>
    `;
  }).join("");
}

// ===========================
// COMPLETE JOB
// ===========================
window.completeJob = function (reqId) {
  const reqs = getRequests();
  const idx  = reqs.findIndex(r => r.id === reqId);
  if (idx === -1) { alert("Job not found."); return; }

  reqs[idx].status      = "completed";
  reqs[idx].completedAt = new Date().toISOString();
  saveReqs(reqs);

  alert("Job marked as complete! Great work.");
  loadActiveJobs();
  loadDashboard();
};

// ===========================
// COMPLETED JOBS
// ===========================
function loadCompletedJobs() {
  const list = document.getElementById("completedJobsList");
  const reqs = getRequests()
    .filter(r => r.washerId === currentUserId && r.status === "completed")
    .sort((a, b) => (b.completedAt || b.created).localeCompare(a.completedAt || a.created));

  if (reqs.length === 0) {
    list.innerHTML = "<div class='list-item'>No completed jobs yet.</div>";
    return;
  }

  const users = getUsers();
  const total = reqs.reduce((sum, r) => sum + (r.budget || 0), 0);

  list.innerHTML = `
    <div class="stat-card accent" style="margin-bottom:16px;text-align:center;">
      <div class="stat-num">$${total.toFixed(2)}</div>
      <div class="stat-label">Total Earnings</div>
    </div>
  ` + reqs.map(r => {
    const client = users.find(u => u.id === r.clientId);
    return `
      <div class="job-card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong>${escHtml(serviceLabel(r.serviceType))}</strong>
          ${r.budget ? `<span style="color:var(--accent-yellow);font-weight:700;">$${r.budget.toFixed(2)}</span>` : ""}
        </div>
        <div style="font-size:0.85rem;"><strong>Client:</strong> ${escHtml(client?.name || "Unknown")}</div>
        <div style="font-size:0.85rem;"><strong>Pickup:</strong> ${escHtml(r.pickupAddress)}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);">
          Completed ${formatDate(r.completedAt || r.created)}
        </div>
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
  set("washerName",         currentUser.name);
  set("washerPhone",        currentUser.phone);
  set("washerArea",         currentUser.serviceArea);
  set("washerSkills",       currentUser.skills);
  set("washerAvailability", currentUser.availability);
  set("washerApplePay",     currentUser.applePay);
  set("washerCashApp",      currentUser.cashApp);
  set("washerPaypal",       currentUser.paypal);
  set("washerCardNote",     currentUser.cardNote);
}

function saveProfile(e) {
  e.preventDefault();
  const users = getUsers();
  const idx = users.findIndex(u => u.id === currentUserId);
  if (idx === -1) return;
  users[idx].name         = (document.getElementById("washerName")?.value         || "").trim() || users[idx].name;
  users[idx].phone        = (document.getElementById("washerPhone")?.value        || "").trim();
  users[idx].serviceArea  = (document.getElementById("washerArea")?.value         || "").trim();
  users[idx].skills       = (document.getElementById("washerSkills")?.value       || "").trim();
  users[idx].availability = (document.getElementById("washerAvailability")?.value || "").trim();
  saveUsers(users);
  currentUser = users[idx];
  alert("Profile saved!");
}

function savePayment(e) {
  e.preventDefault();
  const users = getUsers();
  const idx = users.findIndex(u => u.id === currentUserId);
  if (idx === -1) return;
  users[idx].applePay = (document.getElementById("washerApplePay")?.value || "").trim();
  users[idx].cashApp  = (document.getElementById("washerCashApp")?.value  || "").trim();
  users[idx].paypal   = (document.getElementById("washerPaypal")?.value   || "").trim();
  users[idx].cardNote = (document.getElementById("washerCardNote")?.value || "").trim();
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

