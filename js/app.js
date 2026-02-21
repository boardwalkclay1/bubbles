// =======================================
// AUTH TABS
// =======================================
const authTabs = document.querySelectorAll(".auth-tab");
const authForm = document.getElementById("authForm");
const nameField = document.getElementById("nameField");
const roleField = document.getElementById("roleField");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authMsg = document.getElementById("authMsg");
let authMode = "login";

authTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    authTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    authMode = tab.dataset.mode;
    if (authMode === "signup") {
      nameField.style.display = "block";
      roleField.style.display = "block";
      authSubmitBtn.textContent = "Create account";
    } else {
      nameField.style.display = "none";
      roleField.style.display = "none";
      authSubmitBtn.textContent = "Log in";
    }
  });
});

// =======================================
// HANDLE PAYMENT REDIRECT
// =======================================
const urlParams = new URLSearchParams(window.location.search);
const accessGranted = urlParams.get("access") === "granted";
const sessionId = urlParams.get("session_id");

if (accessGranted && sessionId) {
  (async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const res = await fetch("/api/payments/verify-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ sessionId })
        });
        const data = await res.json();
        if (data.verified) {
          localStorage.setItem("paidGate", "true");
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          redirectToDashboard(user.role);
        }
      } catch (e) {
        console.error("Payment verification error:", e);
      }
    }
  })();
}

// =======================================
// AUTH SUBMIT HANDLER
// =======================================
authForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  authMsg.textContent = "";
  authSubmitBtn.disabled = true;
  authSubmitBtn.textContent = "Please wait…";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const name = document.getElementById("name")?.value.trim();
  const role = document.getElementById("role")?.value;

  try {
    let res, data;

    if (authMode === "signup") {
      if (!name || !role) {
        authMsg.textContent = "Please fill out all fields.";
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = "Create account";
        return;
      }
      res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role })
      });
      data = await res.json();
      if (!res.ok) {
        authMsg.textContent = data.error || "Signup failed.";
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = "Create account";
        return;
      }
      // Auto-login after signup
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      await checkPaymentAndRedirect(data.token, data.user);
      return;
    }

    // Login
    res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    data = await res.json();
    if (!res.ok) {
      authMsg.textContent = data.error || "Login failed.";
      authSubmitBtn.disabled = false;
      authSubmitBtn.textContent = "Log in";
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    await checkPaymentAndRedirect(data.token, data.user);

  } catch (err) {
    console.error("Auth error:", err);
    authMsg.textContent = "Network error — please try again.";
    authSubmitBtn.disabled = false;
    authSubmitBtn.textContent = authMode === "signup" ? "Create account" : "Log in";
  }
});

// =======================================
// PAYMENT CHECK + REDIRECT
// =======================================
async function checkPaymentAndRedirect(token, user) {
  try {
    const payRes = await fetch("/api/payments/status", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const payData = await payRes.json();

    if (payData.active) {
      localStorage.setItem("paidGate", "true");
      redirectToDashboard(user.role);
    } else {
      // Start Stripe checkout
      authMsg.textContent = "Redirecting to payment…";
      const checkoutRes = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
      const checkoutData = await checkoutRes.json();
      if (checkoutData.url) {
        window.location.href = checkoutData.url;
      } else {
        authMsg.textContent = "Payment setup failed. Please try again.";
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = "Log in";
      }
    }
  } catch (err) {
    console.error("Payment check error:", err);
    // If payment check fails (e.g., no Stripe configured), just go to dashboard
    redirectToDashboard(user.role);
  }
}

function redirectToDashboard(role) {
  if (role === "client") {
    window.location.href = "client.html";
  } else if (role === "washer") {
    window.location.href = "washer.html";
  } else {
    window.location.href = "client.html";
  }
}
