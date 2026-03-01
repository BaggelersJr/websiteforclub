document.getElementById("signupForm").addEventListener("submit", async function (e) {
  e.preventDefault();


  const email = document.querySelector("input[placeholder='email']").value;
  const username = document.querySelector("input[placeholder='username']").value;
  const password = document.querySelector("input[type='password']").value;

  const response = await fetch("/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password })
  });

  const data = await response.json();

const errorElement = document.getElementById("errorMessage");

if (data.success) {
  errorElement.textContent = "";
  window.location.href = "/Login.html";
} else {
  errorElement.textContent = data.message;
}
});