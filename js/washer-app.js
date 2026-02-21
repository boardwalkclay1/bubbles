import { requireAuth, logout, checkSubscription, startCheckout } from './payment.js';
import { startLocationTracking, getMyLocation } from './location.js';
import { initMap, setUserMarker, refreshMapData } from './maps.js';

let token, user;

async function init() {
  const auth = await requireAuth('washer');
  if (!auth) return;
  token = auth.token;
  user = auth.user;

  const paid = await checkSubscription(token);
  if (!paid) {
    if (confirm("Your 24-hour access has expired. Pay $1.50 to continue?")) {
      await startCheckout(token);
    } else {
      logout();
    }
    return;
  }

  loadProfile();
  loadAvailableRequests();
  loadActiveOrders();
  setupMap();

  document.getElementById("logoutBtn")?.addEventListener("click", logout);
  document.getElementById("washerProfileForm")?.addEventListener("submit", saveProfile);
  document.getElementById("refreshRequestsBtn")?.addEventListener("click", loadAvailableRequests);
}

async function loadProfile() {
  try {
    const res = await fetch("/api/profile/me", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const { user: u, washerProfile: wp } = await res.json();
    document.getElementById("washerName").value = u.name || "";
    document.getElementById("washerPhone").value = u.phone || "";
    document.getElementById("washerApplePay").value = u.apple_pay_handle || "";
    document.getElementById("washerCashApp").value = u.cash_app_handle || "";
    document.getElementById("washerPaypal").value = u.paypal_email || "";
    if (wp) {
      document.getElementById("washerServiceArea").value = wp.service_area || "";
      document.getElementById("washerSkills").value = wp.skills || "";
      document.getElementById("washerAvailability").value = wp.availability || "";
      document.getElementById("washerAvailable").checked = wp.is_available !== false;
    }
  } catch (err) {
    console.error("Profile load error:", err);
  }
}

async function saveProfile(e) {
  e.preventDefault();
  const msg = document.getElementById("profileMsg");
  msg.textContent = "Saving…";
  try {
    const res = await fetch("/api/profile/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({
        name: document.getElementById("washerName").value.trim(),
        phone: document.getElementById("washerPhone").value.trim(),
        apple_pay_handle: document.getElementById("washerApplePay").value.trim(),
        cash_app_handle: document.getElementById("washerCashApp").value.trim(),
        paypal_email: document.getElementById("washerPaypal").value.trim(),
        service_area: document.getElementById("washerServiceArea").value.trim(),
        skills: document.getElementById("washerSkills").value.trim(),
        availability: document.getElementById("washerAvailability").value.trim(),
        is_available: document.getElementById("washerAvailable").checked,
      })
    });
    if (res.ok) { msg.textContent = "Profile saved ✓"; setTimeout(() => msg.textContent = "", 3000); }
    else msg.textContent = "Save failed.";
  } catch { msg.textContent = "Network error."; }
}

async function loadAvailableRequests() {
  const list = document.getElementById("incomingOrders");
  list.innerHTML = "<div class='list-item'>Loading…</div>";
  try {
    const res = await fetch("/api/requests/available", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const requests = await res.json();
    if (!requests.length) { list.innerHTML = "<div class='list-item'>No available requests right now.</div>"; return; }
    list.innerHTML = "";
    requests.forEach(r => {
      const div = document.createElement("div");
      div.className = "list-item";
      div.innerHTML = `
        <div><strong>Client:</strong> ${r.client_name || "Unknown"}</div>
        <div><strong>Pickup:</strong> ${r.pickup_address}</div>
        ${r.dropoff_address ? `<div><strong>Dropoff:</strong> ${r.dropoff_address}</div>` : ''}
        <div><strong>Service:</strong> ${r.service_type || 'standard'}</div>
        <div><strong>Notes:</strong> ${r.instructions || '—'}</div>
        ${r.budget ? `<div><strong>Budget:</strong> $${r.budget}</div>` : ''}
        <button class="primary-btn" style="margin-top:8px;width:100%;">Accept job</button>
      `;
      div.querySelector("button").addEventListener("click", () => acceptOrder(r.id));
      list.appendChild(div);
    });
  } catch (err) {
    list.innerHTML = "<div class='list-item'>Could not load requests.</div>";
  }
}

async function loadActiveOrders() {
  const list = document.getElementById("activeOrders");
  try {
    const res = await fetch("/api/requests/my-requests", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const orders = await res.json();
    if (!orders.length) { list.innerHTML = "<div class='list-item'>No active orders.</div>"; return; }
    list.innerHTML = "";
    orders.forEach(o => {
      const div = document.createElement("div");
      div.className = "list-item";
      div.innerHTML = `
        <div><strong>Status:</strong> <span class="status-badge status-${o.status}">${o.status.replace('_', ' ')}</span></div>
        <div><strong>Client:</strong> ${o.client_name || 'Unknown'}</div>
        <div><strong>Pickup:</strong> ${o.pickup_address}</div>
        ${o.dropoff_address ? `<div><strong>Dropoff:</strong> ${o.dropoff_address}</div>` : ''}
        <div><strong>Notes:</strong> ${o.instructions || '—'}</div>
        <button class="secondary-btn" style="margin-top:8px;width:100%;">Advance status →</button>
      `;
      div.querySelector("button").addEventListener("click", () => advanceStatus(o.id));
      list.appendChild(div);
    });
  } catch (err) {
    list.innerHTML = "<div class='list-item'>Could not load active orders.</div>";
  }
}

async function acceptOrder(id) {
  try {
    const res = await fetch(`/api/requests/${id}/accept`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      loadAvailableRequests();
      loadActiveOrders();
    } else {
      const d = await res.json();
      alert(d.error || "Could not accept order.");
    }
  } catch { alert("Network error."); }
}

async function advanceStatus(id) {
  try {
    const res = await fetch(`/api/requests/${id}/complete`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) { loadActiveOrders(); }
    else {
      const d = await res.json();
      alert(d.error || "Could not update status.");
    }
  } catch { alert("Network error."); }
}

async function setupMap() {
  try {
    const loc = await getMyLocation();
    initMap("washerMap", loc.lat, loc.lng);
    setUserMarker(loc.lat, loc.lng, "You");
    startLocationTracking(token, 30000);
    refreshMapData(token, user.id);
    setInterval(() => refreshMapData(token, user.id), 30000);
  } catch (err) {
    console.warn("Map init failed:", err.message);
    initMap("washerMap");
    startLocationTracking(token, 30000);
    refreshMapData(token, user.id);
    setInterval(() => refreshMapData(token, user.id), 30000);
  }
}

init();
