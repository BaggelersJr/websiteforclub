const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("id");

const form = document.getElementById("settingsForm");
const message = document.getElementById("message");
const nameInput = document.getElementById("name");
const descriptionInput = document.getElementById("description");
const privateCheckbox = document.getElementById("private");
const joinCodeContainer = document.getElementById("joinCodeContainer");
const joinCodeInput = document.getElementById("joinCode");
const backBtn = document.getElementById("backBtn");
const copyCodeBtn = document.getElementById("copyCodeBtn");

backBtn.addEventListener("click", () => {
    window.location.href = `/room.html?id=${roomId}`;
});

copyCodeBtn.addEventListener("click", () => {
    if (!joinCodeInput.value) return;
    navigator.clipboard.writeText(joinCodeInput.value).then(() => {
        copyCodeBtn.textContent = "Copied!";
        setTimeout(() => { copyCodeBtn.textContent = "Copy"; }, 2000);
    });
});

async function loadRoom() {
    try {
        const res = await fetch(`/rooms/${roomId}/settings`);
        const data = await res.json();

        if (!data.success) {
            message.style.color = "#c0392b";
            message.textContent = data.message || "Failed to load room.";
            return;
        }

        const room = data.room;

        if (data.currentUserId !== room.creator_id) {
            message.style.color = "#c0392b";
            message.textContent = "You are not the owner of this room.";
            form.style.display = "none";
            return;
        }

        nameInput.value = room.name || "";
        descriptionInput.value = room.description || "";
        privateCheckbox.checked = room.is_private === 1;

        if (room.is_private === 1) {
            joinCodeContainer.style.display = "block";
            joinCodeInput.value = room.join_code || "";
        } else {
            joinCodeContainer.style.display = "none";
        }

    } catch (err) {
        message.style.color = "#c0392b";
        message.textContent = "Error loading room settings.";
    }
}

privateCheckbox.addEventListener("change", () => {
    joinCodeContainer.style.display = privateCheckbox.checked ? "block" : "none";
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    message.textContent = "";

    const name = nameInput.value.trim();
    const description = descriptionInput.value.trim();
    const is_private = privateCheckbox.checked;

    try {
        const res = await fetch(`/rooms/${roomId}/edit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description, is_private })
        });

        const data = await res.json();

        if (!data.success) {
            message.style.color = "#c0392b";
            message.textContent = data.message || "Failed to save changes.";
        } else {
            message.style.color = "#27ae60";
            message.textContent = "Changes saved successfully.";

            if (data.joinCode) {
                joinCodeContainer.style.display = "block";
                joinCodeInput.value = data.joinCode;
            } else if (!is_private) {
                joinCodeContainer.style.display = "none";
                joinCodeInput.value = "";
            }
        }

    } catch (err) {
        message.style.color = "#c0392b";
        message.textContent = "Error saving changes.";
    }
});

loadRoom();