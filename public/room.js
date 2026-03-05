const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("id");

const messagesDiv = document.getElementById("messages");
const form = document.getElementById("messageform");
const input = document.getElementById("messageInput");
const errorElement = document.getElementById("error");

if (!roomId) {
  errorElement.textContent = "Invalid room.";
  throw new Error("No room id");
}

const socket = io();

socket.emit("joinRoom", roomId);

socket.on("messageReceived", (message) => {
  addMessage(message);
});


function addMessage(msg) {
  const div = document.createElement("div");
  div.textContent = `${msg.author}: ${msg.content}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
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
    addMessage(msg);
  });
}

loadMessages();

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

  if (!data.success) {
    errorElement.textContent = data.message;
    return;
  }

  input.value = "";

  socket.emit("newMessage", {
    roomId,
    author: data.author,
    content
  });
});

async function loadRoomInfo() {
    const res = await fetch(`/rooms/${roomId}`);
    const data = await res.json();

    if (!data.success) {
        errorElement.textContent = data.message;
        return;
    }

    const room = data.room;

    document.getElementById("roomTitle").textContent = room.name;

    const nav = document.createElement("div");
    nav.classList.add("room-nav");

    const membersBtn = document.createElement("button");
    membersBtn.textContent = "Members";
    membersBtn.onclick = () => {
        window.location.href = `/members.html?id=${roomId}`;
    };
    nav.appendChild(membersBtn);

    if (room.creator_id === data.currentUserId) {
        const settingsBtn = document.createElement("button");
        settingsBtn.textContent = "Settings";
        settingsBtn.onclick = () => {
        window.location.href = `/settings.html?id=${roomId}`;
        };
        nav.appendChild(settingsBtn);
    }

    document.querySelector("main").prepend(nav);
}

loadRoomInfo();
