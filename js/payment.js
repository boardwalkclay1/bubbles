// =======================================
// PAYMENT / SUBSCRIPTION MODULE
// =======================================

export async function checkSubscription(token) {
  try {
    const res = await fetch("/api/payments/status", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.active === true;
  } catch (err) {
    console.warn("Subscription check failed:", err.message);
    return false;
  }
}

export async function startCheckout(token) {
  const res = await fetch("/api/payments/create-checkout", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  const data = await res.json();
  if (data.url) {
    window.location.href = data.url;
  } else {
    throw new Error(data.error || "Could not start checkout");
  }
}

export function getToken() {
  return localStorage.getItem("token");
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("paidGate");
  window.location.href = "index.html";
}

export async function requireAuth(requiredRole) {
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    window.location.href = "index.html";
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    window.location.href = "index.html";
    return null;
  }

  // Verify token is still valid
  try {
    const res = await fetch("/api/auth/me", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) {
      logout();
      return null;
    }
  } catch (err) {
    // Network error — allow cached session
  }

  return { token, user };
}
