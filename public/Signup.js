document.getElementById("signupForm").addEventListener("submit", async function (e) {
  e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const response = await fetch("/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password })
  });

  const data = await response.json();

const errorElement = document.getElementById("error");

if (data.success) {
  errorElement.textContent = "";
  window.location.href = "/Login.html";
} else {
  errorElement.textContent = data.message;
}
});