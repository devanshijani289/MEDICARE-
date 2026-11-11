
/* MediCare+ Client Signup, Client Login and Admin Login */
"use strict";

document.addEventListener("DOMContentLoaded", () => {

  const loginScreen = document.getElementById("loginScreen");
  const appShell = document.getElementById("appShell");

  const clientDashboard = document.getElementById("clientDashboard");
  const adminDashboard = document.getElementById("adminDashboard");

  const clientTab = document.getElementById("clientTab");
  const adminTab = document.getElementById("adminTab");

  const clientLoginPanel = document.getElementById("clientLoginPanel");
  const clientSignupPanel = document.getElementById("clientSignupPanel");
  const adminPanel = document.getElementById("adminLoginPanel");

  const loginYear = document.getElementById("loginYear");

  const logoutBtn = document.getElementById("logoutBtn");
  const adminLogoutBtn = document.getElementById("adminLogoutBtn");

  if (loginYear) {
    loginYear.textContent = new Date().getFullYear();
  }

  // Show Client Login or Admin Login.
  function selectRole(role) {

    const isClient = role === "client";

    clientTab.classList.toggle("active", isClient);
    adminTab.classList.toggle("active", !isClient);

    clientTab.setAttribute("aria-selected", String(isClient));
    adminTab.setAttribute("aria-selected", String(!isClient));

    clientLoginPanel.hidden = !isClient;
    clientSignupPanel.hidden = true;
    adminPanel.hidden = isClient;

    document.getElementById("clientLoginError").textContent = "";
    document.getElementById("adminLoginError").textContent = "";
    document.getElementById("clientLoginSuccess").textContent = "";
  }

  // Open Signup page.
  document.getElementById("showSignupLink").addEventListener("click", (e) => {
    e.preventDefault();

    clientLoginPanel.hidden = true;
    clientSignupPanel.hidden = false;

    document.getElementById("signupError").textContent = "";
  });

  // Return to Login page.
  document.getElementById("showLoginLink").addEventListener("click", (e) => {
    e.preventDefault();

    clientSignupPanel.hidden = true;
    clientLoginPanel.hidden = false;

    document.getElementById("signupError").textContent = "";
  });

  // Open the correct dashboard.
  function showApplication(role) {

    role = role === "admin" ? "admin" : "client";

    sessionStorage.setItem("medicare_signed_in", "true");
    sessionStorage.setItem("medicare_user_role", role);

    loginScreen.hidden = true;
    appShell.hidden = false;

    clientDashboard.hidden = role !== "client";
    adminDashboard.hidden = role !== "admin";

    document.getElementById("signedInRole")?.remove();

    const brand = role === "admin"
      ? adminDashboard.querySelector(".navbar-brand")
      : clientDashboard.querySelector(".navbar-brand");

    if (brand) {
      const badge = document.createElement("span");
      badge.id = "signedInRole";
      badge.className = "badge text-bg-info ms-2";
      badge.textContent = role === "admin" ? "Admin" : "Client";
      brand.appendChild(badge);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Logout.
  function signOut() {

    sessionStorage.removeItem("medicare_signed_in");
    sessionStorage.removeItem("medicare_user_role");

    appShell.hidden = true;
    loginScreen.hidden = false;

    clientDashboard.hidden = false;
    adminDashboard.hidden = true;

    document.getElementById("signedInRole")?.remove();

    document.getElementById("clientLoginForm").reset();
    document.getElementById("adminLoginForm").reset();
    document.getElementById("clientSignupForm").reset();

    selectRole("client");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  clientTab.addEventListener("click", () => selectRole("client"));
  adminTab.addEventListener("click", () => selectRole("admin"));

  // CLIENT SIGNUP
  document.getElementById("clientSignupForm").addEventListener("submit", (e) => {

    e.preventDefault();

    const username = document.getElementById("signupUsername").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const phone = document.getElementById("signupPhone").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    const error = document.getElementById("signupError");

    if (username.length < 3) {
      error.textContent = "Username must contain at least 3 characters.";
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      error.textContent = "Enter a valid 10-digit phone number.";
      return;
    }

    if (password.length < 6) {
      error.textContent = "Password must contain at least 6 characters.";
      return;
    }

    if (password !== confirmPassword) {
      error.textContent = "Passwords do not match.";
      return;
    }

    const registeredClient = {
      username: username,
      email: email,
      phone: phone,
      password: password
    };

    // Save registered account in browser storage.
    localStorage.setItem(
      "medicare_registered_client",
      JSON.stringify(registeredClient)
    );

    document.getElementById("clientSignupForm").reset();

    clientSignupPanel.hidden = true;
    clientLoginPanel.hidden = false;

    document.getElementById("clientLoginSuccess").textContent =
      "Account created successfully! Please login.";

    error.textContent = "";
  });

  // CLIENT LOGIN
  document.getElementById("clientLoginForm").addEventListener("submit", (e) => {

    e.preventDefault();

    const username = document.getElementById("clientUsername").value.trim();
    const password = document.getElementById("clientPassword").value;

    const error = document.getElementById("clientLoginError");

    const savedAccount = localStorage.getItem("medicare_registered_client");

    if (!savedAccount) {
      error.textContent = "No account found. Please sign up first.";
      return;
    }

    const registeredClient = JSON.parse(savedAccount);

    if (
      username.toLowerCase() !== registeredClient.username.toLowerCase() ||
      password !== registeredClient.password
    ) {
      error.textContent = "Incorrect username or password.";
      return;
    }

    error.textContent = "";

    sessionStorage.setItem("medicare_client_name", registeredClient.username);
    sessionStorage.setItem("medicare_client_phone", registeredClient.phone);

    showApplication("client");
  });


// ADMIN LOGIN - EXISTING FIXED CREDENTIALS
document.getElementById("adminLoginForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("adminEmail").value.trim().toLowerCase();
    const password = document.getElementById("adminPassword").value;
    const error = document.getElementById("adminLoginError");

    // 1. Empty email
    if (email === "") {
        error.textContent = "Please enter admin email.";
        return;
    }
    
    // 2. Invalid email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        error.textContent = "Please enter a valid email address.";
        return;
    }

    // 3. Empty password
    if (password === "") {
        error.textContent = "Please enter your password.";
        return;
    }

    // 4. Password shorter than 8 characters
    if (password.length < 8) {
        error.textContent = "Password must contain at least 8 characters.";
        return;
    }

    // 5. Incorrect credentials
    if (email !== "admin@medicare.com" || password !== "admin123") {
        error.textContent = "Incorrect admin email or password.";
        return;
    }

    // Successful login
    error.textContent = "";
    showApplication("admin");
});

  // Show / Hide Password.
  document.querySelectorAll("[data-toggle-password]").forEach((button) => {

    button.addEventListener("click", () => {

      const input = document.getElementById(button.dataset.togglePassword);
      const reveal = input.type === "password";

      input.type = reveal ? "text" : "password";

      button.innerHTML = reveal
        ? '<i class="bi bi-eye-slash"></i>'
        : '<i class="bi bi-eye"></i>';

      button.setAttribute(
        "aria-label",
        reveal ? "Hide password" : "Show password"
      );
    });
  });

  // Logout buttons.
  logoutBtn.addEventListener("click", signOut);
  adminLogoutBtn.addEventListener("click", signOut);

  // Always show Login page when the website first opens.
  loginScreen.hidden = false;
  appShell.hidden = true;

  clientDashboard.hidden = false;
  adminDashboard.hidden = true;

  selectRole("client");

});
