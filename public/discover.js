const container = document.getElementById("roomsContainer");
const errorElement = document.getElementById("error");

async function loadRooms() {
    const response = await fetch("/rooms");
    const data = await response.json();

    if (!data.success) {
        errorElement.textContent = data.message;
        return;
    }

    container.innerHTML = "";

    if (!data.rooms || data.rooms.length === 0) {
        container.innerHTML = "<p>No rooms available.</p>";
        return;
    }

    data.rooms.forEach(room => {
        const card = document.createElement("div");
        card.classList.add("room-card");

        card.innerHTML = `
        <h2>${room.name}</h2>
        <p>${room.description || "No description provided."}</p>
        <p><strong>Creator:</strong> ${room.creator}</p>
        <p><strong>Members:</strong> ${room.member_count}</p>
        <button data-id="${room.id}">Join</button>
        `;

        const joinButton = card.querySelector("button");

        joinButton.addEventListener("click", async () => {
        const joinRes = await fetch(`/rooms/${room.id}/join`, {
            method: "POST"
        });

        const joinData = await joinRes.json();

        if (joinData.success) {
            window.location.href = `/room.html?id=${room.id}`;
        } else {
            errorElement.textContent = joinData.message;
        }
        });

        container.appendChild(card);
    });
}

loadRooms();