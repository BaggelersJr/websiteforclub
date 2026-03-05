document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("id");
    const container = document.getElementById("members");
    const error = document.getElementById("error");

    let isOwner = false;

    async function loadRoomInfo() {
        const res = await fetch(`/rooms/${roomId}`);
        const data = await res.json();

        if (!data.success) return;

        isOwner = data.room.creator_id === data.currentUserId;
    }

    async function loadMembers() {
        await loadRoomInfo();

        const res = await fetch(`/rooms/${roomId}/members`);
        const data = await res.json();

        if (!data.success) {
        error.textContent = data.message;
        return;
        }

        container.innerHTML = "";

        data.members.forEach(member => {
            const div = document.createElement("div");
            div.classList.add("member-item");

            div.innerHTML = `
                <p><strong>${member.username}</strong></p>
                <p>Role: ${member.role}</p>
            `;

            container.appendChild(div);
        });
    }

    loadMembers();
});