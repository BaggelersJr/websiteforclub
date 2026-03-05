const membersContainer = document.getElementById("members");
const errorEl = document.getElementById("error");
const memberCountLabel = document.getElementById("memberCount");

async function loadMembers() {
    const res = await fetch(`/rooms/${roomId}/members`);
    const data = await res.json();

    if (!data.success) {
        errorEl.textContent = data.message || "Failed to load members.";
        return;
    }

    const members = data.members;
    memberCountLabel.textContent = `${members.length} member${members.length !== 1 ? "s" : ""}`;
    membersContainer.innerHTML = "";

    members.forEach(member => {
        const initials = member.username.slice(0, 2).toUpperCase();
        const isOwner = member.role === "owner";

        const row = document.createElement("div");
        row.classList.add("member-row");

        row.innerHTML = `
            <div class="member-avatar">${initials}</div>
            <div class="member-info">
                <div class="member-name">${member.username}</div>
            </div>
            <span class="member-role ${isOwner ? "" : "role-member"}">
                ${isOwner ? "Owner" : "Member"}
            </span>
        `;

        membersContainer.appendChild(row);
    });
}

loadMembers();