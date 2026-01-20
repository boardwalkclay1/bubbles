// app.js

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

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const role = document.getElementById("role").value;
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    if (authMode === "signup") {
      await pb.collection("users").create({
        email,
        password,
        passwordConfirm: password,
        role,
        name
      });
    }

    const authData = await pb.collection("users").authWithPassword(email, password);

    if (!authData?.record?.role) {
      throw new Error("No role set on user.");
    }

    if (authData.record.role === "client") {
      window.location.href = "/client.html";
    } else if (authData.record.role === "washer") {
      window.location.href = "/washer.html";
    } else {
      alert("Unknown role on account.");
    }
  } catch (err) {
    console.error(err);
    alert("Login / signup failed. Check your info and try again.");
  }
});
