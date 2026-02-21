// =======================================
// LEAFLET MAP ENGINE
// =======================================

let map = null;
let userMarker = null;
const otherMarkers = {};

export function initMap(containerId, defaultLat = 33.7488, defaultLng = -84.388) {
  if (!window.L) {
    console.error("Leaflet not loaded");
    return;
  }

  map = L.map(containerId, { zoomControl: true }).setView([defaultLat, defaultLng], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
  }).addTo(map);

  return map;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function setUserMarker(lat, lng, label = "You") {
  if (!map) return;

  const safeLabel = escapeHtml(label);
  const icon = L.divIcon({
    className: "",
    html: `<div style="background:#f7b733;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.5);" title="${safeLabel}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  if (!userMarker) {
    userMarker = L.marker([lat, lng], { icon }).addTo(map);
    userMarker.bindPopup(`<strong>${safeLabel}</strong><br>That's you!`);
  } else {
    userMarker.setLatLng([lat, lng]);
  }
}

export function updateOtherMarker(id, lat, lng, role, name) {
  if (!map) return;

  const color = role === "washer" ? "#3f8cff" : "#fc4a1a";
  const emoji = role === "washer" ? "🧺" : "📦";
  const safeName = escapeHtml(name);
  const safeRole = role === "washer" ? "Washer" : "Client";

  const icon = L.divIcon({
    className: "",
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.5);" title="${safeName}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });

  if (!otherMarkers[id]) {
    otherMarkers[id] = L.marker([lat, lng], { icon }).addTo(map);
    otherMarkers[id].bindPopup(`<strong>${emoji} ${safeName}</strong><br>${safeRole}`);
  } else {
    otherMarkers[id].setLatLng([lat, lng]);
  }
}

export function removeStaleMarkers(activeIds) {
  Object.keys(otherMarkers).forEach(id => {
    if (!activeIds.includes(String(id))) {
      map?.removeLayer(otherMarkers[id]);
      delete otherMarkers[id];
    }
  });
}

export async function refreshMapData(token, myUserId) {
  if (!map) return;

  try {
    const res = await fetch("/api/location/map-data", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const signals = await res.json();

    const activeIds = [];
    signals.forEach(sig => {
      if (sig.id === myUserId) return;
      activeIds.push(String(sig.id));
      updateOtherMarker(sig.id, sig.lat, sig.lng, sig.role, sig.name || sig.role);
    });

    removeStaleMarkers(activeIds);
  } catch (err) {
    console.warn("Map refresh failed:", err.message);
  }
}

export function getMap() {
  return map;
}
