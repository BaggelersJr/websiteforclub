const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("id");
if (!roomId) {
  error.textContent = "Invalid room ID";
}
const form = document.getElementById("settingsForm");
const error = document.getElementById("error");
const privateCheckbox = document.getElementById("private");
const joinCodeContainer = document.getElementById("joinCodeContainer");
const joinCodeInput = document.getElementById("joinCode");

async function loadRoom() {

    const res = await fetch(`/rooms/${roomId}/edit`);
    const data = await res.json();

    if (!data.success) {
        error.textContent = data.message;
        return;
    }

    const room = data.room;

    document.getElementById("name").value = room.name || "";
    document.getElementById("description").value = room.description || "";
    privateCheckbox.checked = room.is_private === 1;

    if (room.is_private && room.join_code) {
        joinCodeContainer.style.display = "block";
        joinCodeInput.value = room.join_code;
    } 
    else {
        joinCodeContainer.style.display = "none";
    }
}

privateCheckbox.addEventListener("change", () => {
    joinCodeContainer.style.display = privateCheckbox.checked ? "block" : "none";
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const description = document.getElementById("description").value.trim();
    const is_private = privateCheckbox.checked;

    const res = await fetch(`/rooms/${roomId}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, is_private })
    });

    const data = await res.json();

    if (!data.success) {
        error.textContent = data.message;
    } else {
        error.textContent = "Saved.";
    }
});

loadRoom();