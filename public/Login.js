document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const login = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const errorElement = document.getElementById("errorMessage");
  errorElement.textContent = "";
  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ login, password })
    });
    const data = await response.json();
    if (data.success) {
      window.location.href = "/";
    } else {
      errorElement.textContent = data.message || "Login failed";
    }
  } catch (err) {
    errorElement.textContent = "Server error. Try again.";
  }
});