// ===============================
// BASIC MAP ENGINE (OSM + JS)
// ===============================

// Create map instance
let map;
let userMarker;
let otherMarkers = {};

function initMap(containerId) {
  map = L.map(containerId).setView([33.7488, -84.3880], 12); // Atlanta default

  // OSM tiles (no API key)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap"
  }).addTo(map);
}

// ===============================
// USER LOCATION + SIGNALING
// ===============================

async function sendLocation(role, userId) {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(async pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    // Update your own marker
    if (!userMarker) {
      userMarker = L.marker([lat, lng], { title: "You" }).addTo(map);
    } else {
      userMarker.setLatLng([lat, lng]);
    }

    // Send to backend
    await fetch("/api/map-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, role, lat, lng })
    });
  });
}

// ===============================
// PULL OTHER USERS
// ===============================

async function pullOthers(userId) {
  const res = await fetch("/api/map-pull");
  const signals = await res.json();

  signals.forEach(sig => {
    if (sig.id === userId) return;

    if (!otherMarkers[sig.id]) {
      otherMarkers[sig.id] = L.marker([sig.lat, sig.lng], {
        title: sig.role === "washer" ? "Washer" : "Client"
      }).addTo(map);
    } else {
      otherMarkers[sig.id].setLatLng([sig.lat, sig.lng]);
    }
  });
}

// ===============================
// MAIN LOOP
// ===============================

export function startMap(containerId, role, userId) {
  initMap(containerId);

  // Update every 4 seconds
  setInterval(() => {
    sendLocation(role, userId);
    pullOthers(userId);
  }, 4000);
}
