// chat.js: liga ao ChatHub, gere amigos, notificações e mensagens de texto/
// áudio/ficheiro. Comunicação REST (api/...) para persistência + SignalR
// para tempo real.

let currentFriendId = null;
let mediaRecorder = null;
let audioChunks = [];

const chatConnection = new signalR.HubConnectionBuilder()
    .withUrl("/hubs/chat")
    .withAutomaticReconnect()
    .build();

chatConnection.start().catch(err => console.error("Erro ao ligar ao ChatHub:", err));

chatConnection.on("ReceiveMessage", (msg) => {
    if (currentFriendId && (msg.senderId === currentFriendId || msg.receiverId === currentFriendId)) {
        renderMessage(msg);
        scrollMessagesToBottom();
    }
});

chatConnection.on("UserTyping", (userId, isTyping) => {
    if (userId === currentFriendId) {
        document.getElementById("chatFriendStatus").innerText = isTyping ? "a escrever..." : "";
    }
});

chatConnection.on("FriendPresenceChanged", (userId, isOnline) => {
    const el = document.querySelector(`[data-friend-id="${userId}"] .presence-dot`);
    if (el) el.classList.toggle("bg-success", isOnline);
});

chatConnection.on("ReceiveNotification", (n) => {
    incrementNotifBadge();
    loadNotifications();
});

// Abas da sidebar 
document.querySelectorAll("#sidebarTabs .nav-link").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#sidebarTabs .nav-link").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        document.querySelectorAll(".tab-pane-item").forEach(p => p.classList.add("d-none"));
        document.getElementById(`tab-${btn.dataset.tab}`).classList.remove("d-none");
    });
});

// Amigos 
async function loadFriends() {
    const res = await fetch("/api/friends");
    const friends = await res.json();
    const list = document.getElementById("friendsList");
    list.innerHTML = "";
    friends.forEach(f => {
        const item = document.createElement("button");
        item.className = "list-group-item list-group-item-action d-flex align-items-center gap-2";
        item.dataset.friendId = f.userId;
        item.innerHTML = `
            <span class="presence-dot rounded-circle ${f.isOnline ? "bg-success" : "bg-secondary"}" style="width:8px;height:8px;"></span>
            <img src="${f.profilePhotoUrl || "/images/default-avatar.png"}" class="avatar-sm" />
            <span>${f.fullName}</span>`;
        item.addEventListener("click", () => openChat(f));
        list.appendChild(item);
    });
}

async function loadFriendRequests() {
    const res = await fetch("/api/friends/requests");
    const requests = await res.json();
    const container = document.getElementById("friendRequests");
    container.innerHTML = "";
    requests.forEach(r => {
        const div = document.createElement("div");
        div.className = "d-flex align-items-center justify-content-between border rounded p-2 mb-2";
        div.innerHTML = `
            <span>${r.fullName}</span>
            <span>
                <button class="btn btn-sm btn-success">✓</button>
                <button class="btn btn-sm btn-danger">✕</button>
            </span>`;
        div.querySelector(".btn-success").addEventListener("click", async () => {
            await fetch(`/api/friends/${r.friendshipId}/accept`, { method: "POST" });
            loadFriendRequests(); loadFriends();
        });
        div.querySelector(".btn-danger").addEventListener("click", async () => {
            await fetch(`/api/friends/${r.friendshipId}/reject`, { method: "POST" });
            loadFriendRequests();
        });
        container.appendChild(div);
    });
}

document.getElementById("searchBtn").addEventListener("click", async () => {
    const q = document.getElementById("searchInput").value.trim();
    if (!q) return;
    const res = await fetch(`/api/friends/search?q=${encodeURIComponent(q)}`);
    const users = await res.json();
    const container = document.getElementById("searchResults");
    container.innerHTML = "";
    users.forEach(u => {
        const div = document.createElement("div");
        div.className = "d-flex align-items-center justify-content-between border rounded p-2 mb-2";
        div.innerHTML = `<span>${u.fullName}</span><button class="btn btn-sm btn-primary">Adicionar</button>`;
        div.querySelector("button").addEventListener("click", async () => {
            await fetch("/api/friends/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ addresseeId: u.id })
            });
            div.querySelector("button").innerText = "Pedido enviado";
            div.querySelector("button").disabled = true;
        });
        container.appendChild(div);
    });
});

// Notificações 
async function loadNotifications() {
    const res = await fetch("/api/notifications");
    const notifications = await res.json();
    const list = document.getElementById("notificationsList");
    list.innerHTML = "";
    let unread = 0;
    notifications.forEach(n => {
        if (!n.isRead) unread++;
        const item = document.createElement("div");
        item.className = `list-group-item ${n.isRead ? "" : "fw-bold"}`;
        item.innerHTML = `<div>${n.title}</div><small class="text-muted">${n.content ?? ""}</small>`;
        list.appendChild(item);
    });
    const badge = document.getElementById("notifBadge");
    if (unread > 0) { badge.innerText = unread; badge.classList.remove("d-none"); }
    else { badge.classList.add("d-none"); }
}
function incrementNotifBadge() {
    const badge = document.getElementById("notifBadge");
    const current = parseInt(badge.innerText || "0", 10) || 0;
    badge.innerText = current + 1;
    badge.classList.remove("d-none");
}

// Reuniões 
async function loadMeetings() {
    const res = await fetch("/api/meetings/upcoming");
    const meetings = await res.json();
    const list = document.getElementById("meetingsList");
    list.innerHTML = "";
    meetings.forEach(m => {
        const item = document.createElement("a");
        item.href = `/Home/Meeting?roomCode=${m.roomCode}`;
        item.className = "list-group-item list-group-item-action";
        item.innerHTML = `<strong>${m.title}</strong><br/><small>Código: ${m.roomCode}</small>`;
        list.appendChild(item);
    });
}

document.getElementById("btnCreateMeeting").addEventListener("click", async () => {
    const title = document.getElementById("meetingTitle").value || "Reunião sem título";
    const start = document.getElementById("meetingStart").value;
    const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, scheduledStart: start || null, inviteUserIds: [] })
    });
    const meeting = await res.json();
    window.location.href = `/Home/Meeting?roomCode=${meeting.roomCode}`;
});

// Conversa 
document.getElementById("btnBackToList").addEventListener("click", () => {
    document.querySelector(".app-shell").classList.remove("chat-open");
});

function openChat(friend) {
    currentFriendId = friend.userId;
    document.getElementById("chatEmpty").classList.add("d-none");
    document.getElementById("chatWindow").classList.remove("d-none");
    document.getElementById("chatFriendName").innerText = friend.fullName;
    document.getElementById("chatFriendPhoto").src = friend.profilePhotoUrl || "/images/default-avatar.png";
    document.querySelector(".app-shell").classList.add("chat-open");
    loadConversation(friend.userId);
}

async function loadConversation(friendId) {
    const res = await fetch(`/api/messages/conversation/${friendId}`);
    const messages = await res.json();
    const container = document.getElementById("messagesContainer");
    container.innerHTML = "";
    messages.forEach(renderMessage);
    scrollMessagesToBottom();
}

function renderMessage(msg) {
    const container = document.getElementById("messagesContainer");
    const mine = msg.senderId !== currentFriendId;
    const bubble = document.createElement("div");
    bubble.className = `msg-bubble ${mine ? "mine" : "theirs"}`;

    let contentHtml = "";
    if (msg.type === 0) contentHtml = `<div>${escapeHtml(msg.content ?? "")}</div>`;
    else if (msg.type === 1) contentHtml = `<audio controls src="${msg.attachmentUrl}"></audio>`;
    else if (msg.type === 2) contentHtml = `<img src="${msg.attachmentUrl}" style="max-width:220px;border-radius:8px;" />`;
    else contentHtml = `<a href="${msg.attachmentUrl}" target="_blank">📎 ${msg.attachmentName}</a>`;

    bubble.innerHTML = contentHtml + `<div class="msg-meta">${new Date(msg.sentAt).toLocaleTimeString()}</div>`;
    container.appendChild(bubble);
}

function scrollMessagesToBottom() {
    const c = document.getElementById("messagesContainer");
    c.scrollTop = c.scrollHeight;
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.innerText = str;
    return div.innerHTML;
}

document.getElementById("btnSend").addEventListener("click", sendTextMessage);
document.getElementById("messageInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendTextMessage();
    else chatConnection.invoke("Typing", currentFriendId, true).catch(() => { });
});

async function sendTextMessage() {
    const input = document.getElementById("messageInput");
    const content = input.value.trim();
    if (!content || !currentFriendId) return;

    await fetch("/api/messages/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: currentFriendId, content, type: 0 })
    });
    input.value = "";
}

document.getElementById("fileInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file || !currentFriendId) return;

    const isImage = file.type.startsWith("image/");
    const formData = new FormData();
    formData.append("receiverId", currentFriendId);
    formData.append("type", isImage ? 2 : 3);
    formData.append("file", file);

    await fetch("/api/messages/attachment", { method: "POST", body: formData });
    e.target.value = "";
});

// Gravação de áudio (MediaRecorder API) 
document.getElementById("btnRecordAudio").addEventListener("click", async () => {
    const btn = document.getElementById("btnRecordAudio");

    // A gravação só arranca quando não existe recorder ainda, ou quando o
    // último já terminou (estado "inactive"). Os estados válidos do
    // MediaRecorder são "inactive" | "recording" | "paused" — nunca "active",
    // por isso a condição original nunca reconhecia um recorder já parado e
    // tentava chamar stop() outra vez, o que lança erro e impede nova gravação.
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        if (!currentFriendId) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) audioChunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                // liberta o microfone
                stream.getTracks().forEach(track => track.stop());

                const blob = new Blob(audioChunks, { type: "audio/webm" });
                const formData = new FormData();
                formData.append("receiverId", currentFriendId);
                formData.append("type", 1);
                formData.append("file", blob, "audio.webm");

                try {
                    const res = await fetch("/api/messages/attachment", { method: "POST", body: formData });
                    if (!res.ok) console.error("Falha ao enviar áudio:", res.status, await res.text());
                } catch (err) {
                    console.error("Erro de rede ao enviar áudio:", err);
                }
            };

            mediaRecorder.start();
            btn.classList.add("btn-danger");
        } catch (err) {
            // Falha comum: permissão negada ou página servida fora de HTTPS/localhost
            // (getUserMedia exige contexto seguro).
            console.error("Não foi possível aceder ao microfone:", err);
            alert(`Não foi possível aceder ao microfone.\nErro: ${err.name} - ${err.message}`);
        }
    } else if (mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        btn.classList.remove("btn-danger");
    }
});

// Inicialização 
loadFriends();
loadFriendRequests();
loadNotifications();
loadMeetings();