// =======================================
// PocketBase Initialization
// =======================================
const pb = new PocketBase("https://bubbles-production-7749.up.railway.app");

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
  console.log("Payment verified via PayPal redirect.");
}

// =======================================
// PAYWALL CHECK
// =======================================
function hasPaidGate() {
  return localStorage.getItem("paidGate") === "true";
}

// Manual unlock (fallback)
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
    // SIGNUP
    // ============================
    if (authMode === "signup") {
      if (!email || !password || !role || !name) {
        alert("Please fill out all fields.");
        return;
      }

      await pb.collection("users").create({
        email,
        password,
        passwordConfirm: password,
        role,
        name
      });

      alert("Account created. Please log in.");
    }

    // ============================
    // LOGIN
    // ============================
    const authData = await pb.collection("users").authWithPassword(email, password);

    if (!authData?.record?.role) {
      throw new Error("No role set on user.");
    }

    const userRole = authData.record.role;

    // ============================
    // OWNER BYPASS
    // ============================
    if (email === OWNER_EMAIL) {
      console.log("Owner bypass activated.");

      if (userRole === "client") {
        window.location.href = "client.html";
      } else {
        window.location.href = "washer.html";
      }
      return;
    }

    // ============================
    // PAYWALL CHECK
    // ============================
    if (!hasPaidGate()) {
      alert("Please complete the $1 unlock first.");
      return;
    }

    // ============================
    // ROUTE BASED ON ROLE
    // ============================
    if (userRole === "client") {
      window.location.href = "client.html";
    } else if (userRole === "washer") {
      window.location.href = "washer.html";
    } else {
      alert("Unknown role on account.");
    }

  } catch (err) {
    console.error("Auth error:", err);
    alert("Login / signup failed. Check your info and try again.");
  }
});
