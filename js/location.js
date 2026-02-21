// =======================================
// LOCATION TRACKING MODULE
// =======================================

let locationInterval = null;

export async function startLocationTracking(token, intervalMs = 30000) {
  if (!navigator.geolocation) {
    console.warn("Geolocation not supported");
    return;
  }

  async function sendCurrentLocation() {
    try {
      const pos = await getCurrentPosition();
      await fetch("/api/location/update-location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      });
    } catch (err) {
      console.warn("Location update failed:", err.message);
    }
  }

  await sendCurrentLocation();
  locationInterval = setInterval(sendCurrentLocation, intervalMs);
}

export function stopLocationTracking() {
  if (locationInterval) {
    clearInterval(locationInterval);
    locationInterval = null;
  }
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    });
  });
}

export async function getMyLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
