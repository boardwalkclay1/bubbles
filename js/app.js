// =======================================
// OWNER BYPASS
// =======================================
const OWNER_EMAIL = "boardwalkclay1@gmail.com";

// =======================================
// PAYPAL REDIRECT UNLOCK
// =======================================
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("access") === "granted") {
  localStorage.setItem("paidGate", "true");
}

// =======================================
// PAYWALL CHECK
// =======================================
function hasPaidGate() {
  return localStorage.getItem("paidGate") === "true";
}

window.unlockAfterPayment = function () {
  localStorage.setItem("paidGate", "true");
  alert("Payment received — the app is now unlocked.");
};

// =======================================
// AUTH TABS
// =======================================
const authTabs = document.querySelectorAll(".auth-tab");
const authForm = document.getElementById("authForm");
let authMode = "login";

authTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    authTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    authMode = tab.dataset.mode;
  });
});

// =======================================
// AUTH SUBMIT HANDLER
// =======================================
authForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const role = document.getElementById("role").value;
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    // ============================
    // OWNER NUCLEAR BYPASS
    // ============================
    if (email === OWNER_EMAIL) {
      console.log("OWNER NUCLEAR BYPASS");
      localStorage.setItem("ownerBypass", "true");
      localStorage.setItem("ownerRole", role || "washer");

      if (role === "client") {
        window.location.href = "client.html";
      } else {
        window.location.href = "washer.html";
      }
      return;
    }

    // ============================
    // SIGNUP (normal users)
    // ============================
    if (authMode === "signup") {
      if (!email || !password || !role || !name) {
        alert("Please fill out all fields.");
        return;
      }

      const res = await fetch("/api/users-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, name })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Signup failed.");
        return;
      }

      alert("Account created. Please log in.");
      return;
    }

    // ============================
    // LOGIN (normal users)
    // ============================
    const res = await fetch("/api/users-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Login failed.");
      return;
    }

    const user = data.user;

    if (!user?.role) {
      alert("No role set on user.");
      return;
    }

    if (!hasPaidGate()) {
      alert("Please complete the $1 unlock first.");
      return;
    }

    // Save user ID for dashboards
    localStorage.setItem("userId", user.id);
    localStorage.setItem("userRole", user.role);

    if (user.role === "client") {
      window.location.href = "client.html";
    } else if (user.role === "washer") {
      window.location.href = "washer.html";
    } else {
      alert("Unknown role on account.");
    }

  } catch (err) {
    console.error("Auth error:", err);
    alert("Login / signup failed. Check your info and try again.");
  }
});
