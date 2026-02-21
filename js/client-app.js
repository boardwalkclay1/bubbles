import { requireAuth, logout, checkSubscription, startCheckout } from './payment.js';
import { startLocationTracking } from './location.js';
import { initMap, setUserMarker, refreshMapData } from './maps.js';
import { getMyLocation } from './location.js';

let token, user;

async function init() {
  const auth = await requireAuth('client');
  if (!auth) return;
  token = auth.token;
  user = auth.user;

  // Check subscription
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
  loadOrders();
  setupMap();

  document.getElementById("logoutBtn")?.addEventListener("click", logout);
  document.getElementById("clientProfileForm")?.addEventListener("submit", saveProfile);
  document.getElementById("orderForm")?.addEventListener("submit", createOrder);
}

async function loadProfile() {
  try {
    const res = await fetch("/api/profile/me", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const { user: u } = await res.json();
    document.getElementById("clientName").value = u.name || "";
    document.getElementById("clientPhone").value = u.phone || "";
    document.getElementById("clientApplePay").value = u.apple_pay_handle || "";
    document.getElementById("clientCashApp").value = u.cash_app_handle || "";
    document.getElementById("clientPaypal").value = u.paypal_email || "";
    document.getElementById("clientCardNote").value = u.card_note || "";
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
        name: document.getElementById("clientName").value.trim(),
        phone: document.getElementById("clientPhone").value.trim(),
        apple_pay_handle: document.getElementById("clientApplePay").value.trim(),
        cash_app_handle: document.getElementById("clientCashApp").value.trim(),
        paypal_email: document.getElementById("clientPaypal").value.trim(),
        card_note: document.getElementById("clientCardNote").value.trim(),
      })
    });
    if (res.ok) { msg.textContent = "Profile saved ✓"; setTimeout(() => msg.textContent = "", 3000); }
    else msg.textContent = "Save failed.";
  } catch { msg.textContent = "Network error."; }
}

async function loadOrders() {
  const list = document.getElementById("ordersList");
  try {
    const res = await fetch("/api/requests/my-requests", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const orders = await res.json();
    if (!orders.length) { list.innerHTML = "<div class='list-item'>No orders yet.</div>"; return; }
    list.innerHTML = orders.map(o => `
      <div class="list-item">
        <div><strong>Status:</strong> <span class="status-badge status-${o.status}">${o.status.replace('_', ' ')}</span></div>
        <div><strong>Pickup:</strong> ${o.pickup_address}</div>
        ${o.dropoff_address ? `<div><strong>Dropoff:</strong> ${o.dropoff_address}</div>` : ''}
        <div><strong>Notes:</strong> ${o.instructions || '—'}</div>
        <div><strong>Washer:</strong> ${o.washer_name || 'Not assigned yet'}</div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = "<div class='list-item'>Could not load orders.</div>";
  }
}

async function createOrder(e) {
  e.preventDefault();
  const msg = document.getElementById("orderMsg");
  const pickupAddress = document.getElementById("pickupAddress").value.trim();
  if (!pickupAddress) { msg.textContent = "Pickup address is required."; return; }
  msg.textContent = "Submitting…";
  try {
    const res = await fetch("/api/requests/create", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({
        pickup_address: pickupAddress,
        dropoff_address: document.getElementById("dropoffAddress").value.trim(),
        service_type: document.getElementById("serviceType").value,
        instructions: document.getElementById("orderNotes").value.trim(),
        budget: parseFloat(document.getElementById("orderBudget").value) || null,
      })
    });
    if (res.ok) {
      document.getElementById("orderForm").reset();
      msg.textContent = "Request submitted! ✓";
      setTimeout(() => { msg.textContent = ""; loadOrders(); }, 2000);
    } else {
      const d = await res.json();
      msg.textContent = d.error || "Failed to submit.";
    }
  } catch { msg.textContent = "Network error."; }
}

async function setupMap() {
  try {
    const loc = await getMyLocation();
    const map = initMap("clientMap", loc.lat, loc.lng);
    setUserMarker(loc.lat, loc.lng, "You");

    startLocationTracking(token, 30000);
    refreshMapData(token, user.id);
    setInterval(() => refreshMapData(token, user.id), 30000);
  } catch (err) {
    console.warn("Map init failed:", err.message);
    initMap("clientMap");
    startLocationTracking(token, 30000);
    refreshMapData(token, user.id);
    setInterval(() => refreshMapData(token, user.id), 30000);
  }
}

init();
