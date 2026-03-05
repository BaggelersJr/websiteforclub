async function loadnav() {
    const res = await fetch("/auth/me");
    const data = await res.json();
    const navbar = document.getElementById("navbar");

    if (data.loggedIn) {
        navbar.innerHTML = `
            <nav class="navbar">
                <a href="/" class="nav-logo"><img src="csquared-removebg-preview.png" alt="C Squared Logo"></a>
                <button class="nav-toggle" id="navToggle" aria-label="Toggle menu">
                    <span></span><span></span><span></span>
                </button>
                <ul class="nav-links" id="navLinks">
                    <li><a href="/">Home</a></li>
                    <li><a href="/Discover.html">Discover</a></li>
                    <li><a href="/Create.html">Create</a></li>
                    <li><a href="/Profile.html">Profile</a></li>
                    <li><button class="nav-logout" id="logoutBtn">Logout</button></li>
                </ul>
            </nav>
        `;
        document.getElementById("logoutBtn").addEventListener("click", async function () {
            const res = await fetch("/logout", { method: "POST" });
            const data = await res.json();
            if (data.success) window.location.href = "/Login.html";
        });
    } else {
        navbar.innerHTML = `
            <nav class="navbar">
                <a href="/" class="nav-logo"><img src="csquared-removebg-preview.png" alt="C Squared Logo"></a>
                <button class="nav-toggle" id="navToggle" aria-label="Toggle menu">
                    <span></span><span></span><span></span>
                </button>
                <ul class="nav-links" id="navLinks">
                    <li><a href="/index.html">Home</a></li>
                    <li><a href="/Login.html">Login</a></li>
                    <li><a href="/Signup.html" class="nav-cta">Sign Up</a></li>
                </ul>
            </nav>
        `;
    }
    const toggle = document.getElementById("navToggle");
    const links = document.getElementById("navLinks");
    if (toggle && links) {
        toggle.addEventListener("click", () => {
            links.classList.toggle("open");
            toggle.classList.toggle("active");
        });
    }
}

loadnav();