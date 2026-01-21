// =======================================
// PocketBase Initialization
// =======================================
const pb = new PocketBase("https://bubbles-production-7749.up.railway.app");

// Redirect if not logged in
if (!pb.authStore.isValid) {
  window.location.href = "index.html";
}

const user = pb.authStore.model;

// Redirect if not a client
if (!user || user.role !== "client") {
  window.location.href = "index.html";
}

// =======================================
// DOM Elements
// =======================================
const logoutBtn = document.getElementById("logoutBtn");
const profileForm = document.getElementById("clientProfileForm");
const orderForm = document.getElementById("orderForm");
const ordersList = document.getElementById("ordersList");

// =======================================
// Logout
// =======================================
logoutBtn?.addEventListener("click", () => {
  pb.authStore.clear();
  window.location.href = "index.html";
});

// =======================================
// Load Client Profile
// =======================================
async function loadClientProfile() {
  document.getElementById("clientName").value = user.name || "";
  document.getElementById("clientPhone").value = user.phone || "";
  document.getElementById("clientApplePay").value = user.applePayHandle || "";
  document.getElementById("clientCashApp").value = user.cashAppHandle || "";
  document.getElementById("clientPaypal").value = user.paypalEmail || "";
  document.getElementById("clientCardNote").value = user.cardNote || "";
}

// =======================================
// Save Profile
// =======================================
profileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const updated = await pb.collection("users").update(user.id, {
      name: document.getElementById("clientName").value.trim(),
      phone: document.getElementById("clientPhone").value.trim(),
      applePayHandle: document.getElementById("clientApplePay").value.trim(),
      cashAppHandle: document.getElementById("clientCashApp").value.trim(),
      paypalEmail: document.getElementById("clientPaypal").value.trim(),
      cardNote: document.getElementById("clientCardNote").value.trim()
    });

    pb.authStore.model = updated;

    alert("Profile saved.");
  } catch (err) {
    console.error(err);
    alert("Could not save profile.");
  }
});

// =======================================
// Create Order
// =======================================
orderForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const pickupAddress = document.getElementById("pickupAddress").value.trim();
  const dropoffAddress = document.getElementById("dropoffAddress").value.trim();
  const notes = document.getElementById("orderNotes").value.trim();

  if (!pickupAddress || !dropoffAddress) {
    alert("Pickup and dropoff addresses are required.");
    return;
  }

  try {
    await pb.collection("orders").create({
      client: user.id,
      status: "requested",
      pickupAddress,
      dropoffAddress,
      notes
    });

    orderForm.reset();
    loadOrders();

  } catch (err) {
    console.error(err);
    alert("Could not create order.");
  }
});

// =======================================
// Load Orders
// =======================================
async function loadOrders() {
  try {
    const result = await pb.collection("orders").getFullList({
      filter: `client = "${user.id}"`,
      expand: "washer",
      sort: "-created"
    });

    ordersList.innerHTML = "";

    result.forEach(order => {
      const div = document.createElement("div");
      div.className = "list-item";
      div.innerHTML = `
        <div><strong>Status:</strong> ${order.status}</div>
        <div><strong>Pickup:</strong> ${order.pickupAddress}</div>
        <div><strong>Dropoff:</strong> ${order.dropoffAddress}</div>
        <div><strong>Notes:</strong> ${order.notes || "—"}</div>
        <div><strong>Washer:</strong> ${order.expand?.washer?.name || "Not assigned yet"}</div>
      `;
      ordersList.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    ordersList.innerHTML = "<div class='list-item'>Could not load orders.</div>";
  }
}

// =======================================
// Initialize Page
// =======================================
loadClientProfile();
loadOrders();
