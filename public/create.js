const form = document.getElementById("createRoomForm");
const error = document.getElementById("error");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("roomName").value.trim();
    const description = document.getElementById("description").value.trim();
    const is_private = document.getElementById("privateRoom").checked;

    const response = await fetch("/rooms", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ name, description, is_private })
    });

    const data = await response.json();

    if (data.success) {
        window.location.href = `/room.html?id=${data.roomId}`;
    } else {
        error.textContent = data.message;
    }
});