const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("id");

const messagesDiv = document.getElementById("messages");
const form = document.getElementById("messageform");
const input = document.getElementById("messageInput");
const errorEl = document.getElementById("error");
const roomTitle = document.getElementById("roomTitle");
const roomDescription = document.getElementById("roomDescription");
const roomMeta = document.getElementById("roomMeta");
const membersBtn = document.getElementById("membersBtn");
const settingsBtn = document.getElementById("settingsBtn");

let currentUserId = null;

if (!roomId) {
    errorEl.textContent = "Invalid room.";
    throw new Error("No room id");
}

const socket = io();
socket.emit("joinRoom", roomId);

socket.on("messageReceived", (message) => {
    appendMessage(message);
});

function appendMessage(msg) {
    const isOwn = msg.authorId === currentUserId || msg.author === window._currentUsername;

    const wrapper = document.createElement("div");
    wrapper.classList.add("message-wrapper", isOwn ? "message-own" : "message-other");

    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");

    if (!isOwn) {
        const author = document.createElement("span");
        author.classList.add("message-author");
        author.textContent = msg.author;
        bubble.appendChild(author);
    }

    const content = document.createElement("p");
    content.classList.add("message-content");
    content.textContent = msg.content;
    bubble.appendChild(content);

    wrapper.appendChild(bubble);
    messagesDiv.appendChild(wrapper);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function loadMessages() {
    const res = await fetch(`/rooms/${roomId}/messages`);
    const data = await res.json();

    if (!data.success) {
        errorEl.textContent = data.message;
        return;
    }

    currentUserId = data.currentUserId;
    messagesDiv.innerHTML = "";

    data.messages.reverse().forEach(msg => {
        appendMessage(msg);
    });
}

async function loadRoomInfo() {
    const res = await fetch(`/rooms/${roomId}`);
    const data = await res.json();

    if (!data.success) {
        errorEl.textContent = data.message;
        return;
    }

    const room = data.room;
    currentUserId = data.currentUserId;

    roomTitle.textContent = room.name;
    roomDescription.textContent = room.description || "";

    roomMeta.innerHTML = `
        <div class="room-meta-item">
            <span class="room-meta-label">Creator</span>
            <span class="room-meta-value">${room.creator}</span>
        </div>
        <div class="room-meta-item">
            <span class="room-meta-label">Members</span>
            <span class="room-meta-value">${room.member_count}</span>
        </div>
        <div class="room-meta-item">
            <span class="room-meta-label">Visibility</span>
            <span class="room-meta-value">${room.is_private ? "Private 🔒" : "Public 🌐"}</span>
        </div>
    `;

    membersBtn.onclick = () => {
        window.location.href = `/members.html?id=${roomId}`;
    };

    if (room.creator_id === data.currentUserId) {
        settingsBtn.style.display = "flex";
        settingsBtn.onclick = () => {
            window.location.href = `/settings.html?id=${roomId}`;
        };
    }
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";

    const content = input.value.trim();
    if (!content) return;

    const res = await fetch(`/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
    });

    const data = await res.json();

    if (!data.success) {
        errorEl.textContent = data.message;
        return;
    }

    input.value = "";
    
    socket.emit("newMessage", {
        roomId,
        author: data.author,
        authorId: currentUserId,
        content
    });
});

loadRoomInfo();
loadMessages();