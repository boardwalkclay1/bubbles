// =======================================
// LAUNDRY BUBBLES — Core / Index Page
// =======================================
const OWNER_EMAIL = "boardwalkclay1@gmail.com";

// ===========================
// STORAGE KEYS
// ===========================
const LB_USERS    = "lb_users";
const LB_REQUESTS = "lb_requests";
const LB_CURRENT  = "lb_currentUser";
const LB_PAID     = "paidGate";

// ===========================
// PAYPAL RETURN UNLOCK
// ===========================
(function checkPaypalReturn() {
  const p = new URLSearchParams(window.location.search);
  if (p.get("access") === "granted") {
    localStorage.setItem(LB_PAID, "true");
    history.replaceState({}, "", window.location.pathname);
  }
})();

// ===========================
// HELPERS
// ===========================
function hasPaid() {
  return localStorage.getItem(LB_PAID) === "true";
}

function getUsers() {
  return JSON.parse(localStorage.getItem(LB_USERS) || "[]");
}

function saveUsers(u) {
  localStorage.setItem(LB_USERS, JSON.stringify(u));
}

function setCurrentUser(id) {
  localStorage.setItem(LB_CURRENT, id);
}

// ===========================
// PAY GATE TOGGLE
// ===========================
function showGate(show) {
  const pg = document.getElementById("payGate");
  const as = document.getElementById("authSection");
  if (pg) pg.style.display = show ? "" : "none";
  if (as) as.style.display = show ? "none" : "";
}

window.unlockAfterPayment = function () {
  localStorage.setItem(LB_PAID, "true");
  showGate(false);
  alert("🎉 Unlocked! Create an account or log in below.");
};

// ===========================
// AUTH TABS
// ===========================
let authMode = "login";

document.addEventListener("DOMContentLoaded", () => {
  // Show or hide the payment gate
  showGate(!hasPaid());

  // Tab switching (Login / Sign Up)
  document.querySelectorAll(".auth-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      authMode = tab.dataset.mode;
      const ng = document.getElementById("nameGroup");
      if (ng) ng.style.display = authMode === "signup" ? "" : "none";
    });
  });

  const form = document.getElementById("authForm");
  if (form) form.addEventListener("submit", handleAuth);
});

// ===========================
// AUTH SUBMIT
// ===========================
function handleAuth(e) {
  e.preventDefault();
  const email    = (document.getElementById("email")?.value    || "").trim().toLowerCase();
  const password = (document.getElementById("password")?.value || "");
  const role     = (document.getElementById("role")?.value     || "client");
  const name     = (document.getElementById("name")?.value     || "").trim();

  // Owner bypass — always unlocked
  if (email === OWNER_EMAIL) {
    const users = getUsers();
    let owner = users.find(u => u.email === OWNER_EMAIL);
    if (!owner) {
      owner = {
        id: "owner_" + Date.now(),
        email: OWNER_EMAIL,
        password,
        role,
        name: name || "Owner",
        created: new Date().toISOString()
      };
      users.push(owner);
      saveUsers(users);
    }
    localStorage.setItem(LB_PAID, "true");
    setCurrentUser(owner.id);
    goToDashboard(owner.role || role);
    return;
  }

  if (authMode === "signup") {
    if (!email || !password || !name) {
      alert("Please fill in your name, email, and password.");
      return;
    }
    const users = getUsers();
    if (users.find(u => u.email === email)) {
      alert("An account with that email already exists. Please log in.");
      return;
    }
    // NOTE: passwords are stored as plain text — this app is a client-side prototype only.
    const newUser = {
      id: "u_" + Date.now(),
      email: email.toLowerCase(),
      password,
      role,
      name,
      created: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser.id);
    goToDashboard(role);
  } else {
    // Login
    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }
    if (!hasPaid()) {
      alert("Please complete the $1 unlock before logging in.");
      return;
    }
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      alert("Incorrect email or password.");
      return;
    }
    setCurrentUser(user.id);
    goToDashboard(user.role);
  }
}

function goToDashboard(role) {
  window.location.href = role === "client" ? "client.html" : "washer.html";
}

