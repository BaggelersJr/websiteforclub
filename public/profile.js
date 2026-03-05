const userInfoDiv = document.getElementById("userInfo");
const roomsContainer = document.getElementById("myRooms");

async function loadUserInfo() {
    const res = await fetch("/profile/info");
    const data = await res.json();

    if (!data.success) {
        userInfoDiv.innerHTML = `<p>${data.message}</p>`;
        return;
    }

    const user = data.user;

    userInfoDiv.innerHTML = `
        <p><strong>Username:</strong> ${user.username}</p>
        <p><strong>Email:</strong> ${user.email || "Not provided"}</p>
    `;
}

async function loadRooms() {
    const res = await fetch("/profile/rooms");
    const data = await res.json();

    if (!data.success) {
        roomsContainer.innerHTML = `<p>${data.message}</p>`;
        return;
    }

    roomsContainer.innerHTML = "";

    if (data.rooms.length === 0) {
        roomsContainer.innerHTML = "<p>You are not in any rooms.</p>";
        return;
    }

    data.rooms.forEach(room => {
        const div = document.createElement("div");
        div.classList.add("room-card");

        div.innerHTML = `
            <h3>${room.name}</h3>
            <p>${room.description || "No description"}</p>
            <button onclick="openRoom(${room.id})">Open</button>
        `;

        roomsContainer.appendChild(div);
    });
}

function openRoom(id) {
    window.location.href = `/room.html?id=${id}`;
}

loadUserInfo();
loadRooms();