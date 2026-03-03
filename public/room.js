const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("id");

const messagesDiv = document.getElementById("messages");
const form = document.getElementById("messageForm");
const input = document.getElementById("messageInput");
const errorElement = document.getElementById("error");

if (!roomId) {
  errorElement.textContent = "Invalid room.";
}

async function loadMessages() {
    const response = await fetch(`/rooms/${roomId}/messages`);
    const data = await response.json();

    if (!data.success) {
    errorElement.textContent = data.message;
        return;
    }

    messagesDiv.innerHTML = "";
    data.messages.reverse().forEach(msg => {
        const div = document.createElement("div");
        div.textContent = `${msg.author}: ${msg.content}`;
        messagesDiv.appendChild(div);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const content = input.value.trim();
    if (!content) return;

    const response = await fetch(`/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
    });

    const data = await response.json();

    if (data.success) {
        input.value = "";
        loadMessages();
    } else {
        errorElement.textContent = data.message;
    }
});

loadMessages();