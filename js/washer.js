// =======================================
// PocketBase Initialization
// =======================================
const pb = new PocketBase("https://bubbles-production-7749.up.railway.app");

// Redirect if not logged in
if (!pb.authStore.isValid) {
  window.location.href = "/bubbles/index.html";
}

const user = pb.authStore.model;

// Redirect if not a washer
if (!user || user.role !== "washer") {
  window.location.href = "/bubbles/index.html";
}

// =======================================
// DOM Elements
// =======================================
const logoutBtn = document.getElementById("logoutBtn");
const profileForm = document.getElementById("washerProfileForm");
const incomingList = document.getElementById("incomingOrders");
const activeList = document.getElementById("activeOrders");

// =======================================
// Logout
// =======================================
logoutBtn?.addEventListener("click", () => {
  pb.authStore.clear();
  window.location.href = "/bubbles/index.html";
});

// =======================================
// Load Washer Profile
// =======================================
async function loadWasherProfile() {
  document.getElementById("washerName").value = user.name || "";
  document.getElementById("washerPhone").value = user.phone || "";
  document.getElementById("washerApplePay").value = user.applePayHandle || "";
  document.getElementById("washerCashApp").value = user.cashAppHandle || "";
  document.getElementById("washerPaypal").value = user.paypalEmail || "";
  document.getElementById("washerCardNote").value = user.cardNote || "";
}

// =======================================
// Save Profile
// =======================================
profileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const updated = await pb.collection("users").update(user.id, {
      name: document.getElementById("washerName").value.trim(),
      phone: document.getElementById("washerPhone").value.trim(),
      applePayHandle: document.getElementById("washerApplePay").value.trim(),
      cashAppHandle: document.getElementById("washerCashApp").value.trim(),
      paypalEmail: document.getElementById("washerPaypal").value.trim(),
      cardNote: document.getElementById("washerCardNote").value.trim()
    });

    // Update local auth model
    pb.authStore.model = updated;

    alert("Profile saved.");
  } catch (err) {
    console.error(err);
    alert("Could not save profile.");
  }
});

// =======================================
// Load Incoming Orders
// =======================================
async function loadIncomingOrders() {
  try {
    const result = await pb.collection("orders").getFullList({
      filter: 'status = "requested" && washer = ""',
      expand: "client",
      sort: "-created"
    });

    incomingList.innerHTML = "";

    result.forEach(order => {
      const div = document.createElement("div");
      div.className = "list-item";
      div.innerHTML = `
        <div><strong>Client:</strong> ${order.expand?.client?.name || "Unknown"}</div>
        <div><strong>Pickup:</strong> ${order.pickupAddress}</div>
        <div><strong>Dropoff:</strong> ${order.dropoffAddress}</div>
        <div><strong>Notes:</strong> ${order.notes || "—"}</div>
        <button class="primary-btn small">Accept</button>
      `;

      div.querySelector("button").addEventListener("click", () => acceptOrder(order.id));
      incomingList.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    incomingList.innerHTML = "<div class='list-item'>Could not load incoming orders.</div>";
  }
}

// =======================================
// Load Active Orders
// =======================================
async function loadActiveOrders() {
  try {
    const result = await pb.collection("orders").getFullList({
      filter: `washer = "${user.id}" && status != "delivered"`,
      expand: "client",
      sort: "-created"
    });

    activeList.innerHTML = "";

    result.forEach(order => {
      const div = document.createElement("div");
      div.className = "list-item";
      div.innerHTML = `
        <div><strong>Status:</strong> ${order.status}</div>
        <div><strong>Client:</strong> ${order.expand?.client?.name || "Unknown"}</div>
        <div><strong>Pickup:</strong> ${order.pickupAddress}</div>
        <div><strong>Dropoff:</strong> ${order.dropoffAddress}</div>
        <div><strong>Notes:</strong> ${order.notes || "—"}</div>
        <button class="secondary-btn small">Advance status</button>
      `;

      div.querySelector("button").addEventListener("click", () => advanceStatus(order));
      activeList.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    activeList.innerHTML = "<div class='list-item'>Could not load active orders.</div>";
  }
}

// =======================================
// Accept Order
// =======================================
async function acceptOrder(orderId) {
  try {
    await pb.collection("orders").update(orderId, {
      washer: user.id,
      status: "accepted"
    });

    loadIncomingOrders();
    loadActiveOrders();

  } catch (err) {
    console.error(err);
    alert("Could not accept order.");
  }
}

// =======================================
// Advance Order Status
// =======================================
async function advanceStatus(order) {
  const sequence = ["accepted", "picked_up", "in_progress", "completed", "delivered"];
  const nextStatus = sequence[Math.min(sequence.indexOf(order.status) + 1, sequence.length - 1)];

  if (nextStatus === order.status) {
    alert("Order already delivered.");
    return;
  }

  try {
    await pb.collection("orders").update(order.id, { status: nextStatus });
    loadActiveOrders();
  } catch (err) {
    console.error(err);
    alert("Could not update status.");
  }
}

// =======================================
// Initialize Page
// =======================================
loadWasherProfile();
loadIncomingOrders();
loadActiveOrders();
