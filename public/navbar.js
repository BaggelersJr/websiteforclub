async function loadnav() {
    const res = await fetch("/auth/me");
    const data = await res.json();
    const navbar = document.getElementById("navbar");

    if (data.loggedIn) {
        navbar.innerHTML = `
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/discover">Discover</a></li>
                <li><a href="/create">Create</a></li>
                <li><a href="/profile">Profile</a></li>
                <li><a href="/logout">Logout</a></li>
            </ul>
        `;
    }
    else {
        navbar.innerHTML = `
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/login">Login</a></li>
                <li><a href="/signup">Sign Up</a></li>
            </ul>
        `;
    }
} 

loadnav();