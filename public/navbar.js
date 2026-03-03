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
                <li><a href="/Login.html">Logout</a></li>
            </ul>
        `;
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