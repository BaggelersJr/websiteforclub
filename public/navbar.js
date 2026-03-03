async function loadnav() {
    const res = await fetch("/auth/me");
    const data = await res.json();
    const navbar = document.getElementById("navbar");

    if (data.loggedIn) {
        navbar.innerHTML = `
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/Discover.html">Discover</a></li>
                <li><a href="/Create.html">Create</a></li>
                <li><a href="/Profile.html">Profile</a></li>
                <li><button id="logoutBtn">Logout</button></li>
            </ul>
        `;
        document.getElementById("logoutBtn").addEventListener("click", async function () {
            const res = await fetch("/logout", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                window.location.href = "/Login.html";
            }
        });
    }
    else {
        navbar.innerHTML = `
            <ul>
                <li><a href="/index.html">Home</a></li>
                <li><a href="/Login.html">Login</a></li>
                <li><a href="/Signup.html">Sign Up</a></li>
            </ul>
        `;
    }
} 

loadnav();