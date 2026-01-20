// app.js

// ====== OWNER BYPASS (YOU GET IN FREE) ======
const OWNER_EMAIL = "boardwalkclay1@gmail.com";   // <-- change if needed

// ====== AUTH TAB LOGIC ======
const authTabs = document.querySelectorAll(".auth-tab");
const authForm = document.getElementById("authForm");
let authMode = "login"; // "login" or "signup"

authTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    authTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    authMode = tab.dataset.mode;
  });
});

// ====== PAYPAL GATE CHECK ======
function hasPaidGate() {
  return localStorage.getItem("paidGate") === "true";
}

// Called after PayPal button is clicked
window.unlockAfterPayment = function () {
  localStorage.setItem("paidGate", "true");
  alert("Payment received — the app is now unlocked.");
};

// ====== AUTH SUBMIT ======
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const role = document.getElementById("role").value;
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    // SIGNUP
    if (authMode === "signup") {
      await pb.collection("users").create({
        email,
        password,
        passwordConfirm: password,
        role,
        name
      });
    }

    // LOGIN
    const authData = await pb.collection("users").authWithPassword(email, password);

    if (!authData?.record?.role) {
      throw new Error("No role set on user.");
    }

    // ====== OWNER BYPASS ======
    if (email === OWNER_EMAIL) {
      console.log("Owner bypass activated.");
      if (authData.record.role === "client") {
        window.location.href = "/bubbles/client.html";
      } else {
        window.location.href = "/bubbles/washer.html";
      }
      return;
    }

    // ====== NORMAL USERS MUST PAY $1 ======
    if (!hasPaidGate()) {
      alert("Please complete the $1 unlock first.");
      return;
    }

    // ====== ROUTE BASED ON ROLE ======
    if (authData.record.role === "client") {
      window.location.href = "/bubbles/client.html";
    } else if (authData.record.role === "washer") {
      window.location.href = "/bubbles/washer.html";
    } else {
      alert("Unknown role on account.");
    }

  } catch (err) {
    console.error(err);
    alert("Login / signup failed. Check your info and try again.");
  }
});
