const userInfoDiv = document.getElementById("userInfo");
const roomsContainer = document.getElementById("myRooms");
const roomError = document.getElementById("roomError");
const profileAvatar = document.getElementById("profileAvatar");

async function loadUserInfo() {
    const res = await fetch("/profile/info");
    const data = await res.json();

    if (!data.success) {
        userInfoDiv.innerHTML = `<p class="profile-meta-error">${data.message}</p>`;
        return;
    }

    const user = data.user;

    const initials = user.username.slice(0, 2).toUpperCase();
    profileAvatar.textContent = initials;

    userInfoDiv.innerHTML = `
        <h2 class="profile-username">${user.username}</h2>
        <p class="profile-email">${user.email || "No email provided"}</p>
        <div class="profile-meta">
            <div class="profile-meta-item">
                <span class="profile-meta-label">Username</span>
                <span class="profile-meta-value">${user.username}</span>
            </div>
            <div class="profile-meta-item">
                <span class="profile-meta-label">Email</span>
                <span class="profile-meta-value">${user.email || "—"}</span>
            </div>
        </div>
    `;
}

async function loadRooms() {
    const res = await fetch("/profile/rooms");
    const data = await res.json();

    roomError.textContent = "";
    roomsContainer.innerHTML = "";

    if (!data.success) {
        roomsContainer.innerHTML = `<p class="empty-state">${data.message || "Error loading rooms"}</p>`;
        return;
    }

    if (!data.rooms || data.rooms.length === 0) {
        roomsContainer.innerHTML = `<p class="empty-state">You haven't joined any rooms yet.</p>`;
        return;
    }

    data.rooms.forEach(room => {
        const div = document.createElement("div");
        div.classList.add("room-card");

        div.innerHTML = `
            <div class="room-card-body">
                <h3>${room.name}</h3>
                <p>${room.description || "No description"}</p>
            </div>
            <div class="room-card-actions">
                <button class="open-btn btn-sm-primary">Open</button>
                <button class="leave-btn btn-sm-ghost">Leave</button>
            </div>
            <p class="room-card-error"></p>
        `;

        const openBtn = div.querySelector(".open-btn");
        const leaveBtn = div.querySelector(".leave-btn");
        const cardError = div.querySelector(".room-card-error");

        openBtn.onclick = () => {
            window.location.href = `/room.html?id=${room.id}`;
        };

        leaveBtn.onclick = async () => {
            cardError.textContent = "";
            const res = await fetch(`/rooms/${room.id}/leave`, { method: "POST" });
            const result = await res.json();

            if (result.success) {
                loadRooms();
            } else {
                cardError.textContent = result.message;
            }
        };

        roomsContainer.appendChild(div);
    });
}

loadUserInfo();
loadRooms();