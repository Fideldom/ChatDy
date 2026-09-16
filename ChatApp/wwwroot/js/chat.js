"use strict";

let currentFriendId = null;

window.getCurrentFriendId = () => currentFriendId;

let mediaRecorder = null;

let audioChunks = [];

let chatConnection = null; registerChatEvents

function getChatConnection() {
    if (
        chatConnection &&
        typeof signalR !== "undefined"
    ) {
        return chatConnection;
    }

    if (
        window.ChatConnection &&
        typeof signalR !== "undefined"
    ) {
        chatConnection =
            window.ChatConnection;

        return chatConnection;
    }

    if (typeof signalR === "undefined") {
        console.error(
            "SignalR não foi carregado."
        );

        return null;
    }

    chatConnection =
        new signalR.HubConnectionBuilder()
            .withUrl("/hubs/chat")
            .withAutomaticReconnect([
                0,
                2000,
                5000,
                10000,
                30000
            ])
            .build();

    window.ChatConnection =
        chatConnection;

    return chatConnection;
}

function registerChatEvents() {
    const connection =
        getChatConnection();

    if (!connection) {
        return;
    }

    connection.on(
        "ReceiveMessage",
        (msg) => {
            const isCurrentConversation =
                currentFriendId &&
                (
                    msg.senderId ===
                    currentFriendId ||
                    msg.receiverId ===
                    currentFriendId
                );

            if (isCurrentConversation) {
                renderMessage(msg);

                scrollMessagesToBottom();

                if (
                    msg.senderId ===
                    currentFriendId
                ) {
                    if (
                        window.ChatBadges?.messages
                    ) {
                        window.ChatBadges.messages();
                    }
                }

                return;
            }

            if (
                window.ChatBadges?.messages
            ) {
                window.ChatBadges.messages();
            }
        }
    );

    connection.on(
        "UserTyping",
        (
            userId,
            isTyping
        ) => {
            if (
                userId !==
                currentFriendId
            ) {
                return;
            }

            const status =
                document.getElementById(
                    "chatFriendStatus"
                );

            if (!status) {
                return;
            }

            status.innerText =
                isTyping
                    ? "a escrever..."
                    : "";
        }
    );

    if (window.ChatPresence?.register) {
        window.ChatPresence.register(connection);
    }

    connection.on(
        "ReceiveNotification",
        (notification) => {
            console.log(
                "Nova notificação:",
                notification
            );

            const type =
                notification?.type;

            if (
                type === "NewMessage" ||
                type === 0
            ) {
                if (
                    window.ChatBadges
                ) {
                    window.ChatBadges.messages();
                }

                return;
            }

            if (
                type ===
                "MeetingInvite" ||
                type === 1
            ) {
                if (
                    window.ChatBadges
                ) {
                    window.ChatBadges.meetings();
                }

                return;
            }

            if (
                window.ChatBadges
            ) {
                window.ChatBadges.notifications();
            }

            loadNotifications();
        }
    );
}

function initializeChatConnection() {
    const connection =
        getChatConnection();

    if (!connection) {
        return;
    }

    registerChatEvents(); //sdfhdkfghhd

    if (
        connection.state ===
        signalR.HubConnectionState.Connected
    ) {
        console.log(
            "ChatHub já está conectado."
        );

        return;
    }

    if (
        connection.state ===
        signalR.HubConnectionState.Connecting ||
        connection.state ===
        signalR.HubConnectionState.Reconnecting
    ) {
        return;
    }

    connection.start()
        .then(() => {
            console.log(
                "ChatHub conectado."
            );
        })
        .catch((error) => {
            console.error(
                "Erro ao ligar ao ChatHub:",
                error
            );
        });
}

function setupSidebarTabs() {
    const sidebarTabs =
        document.getElementById(
            "sidebarTabs"
        );

    if (!sidebarTabs) {
        console.warn(
            "#sidebarTabs não encontrado."
        );

        return;
    }

    const buttons =
        sidebarTabs.querySelectorAll(
            ".nav-link[data-tab]"
        );

    const panes =
        document.querySelectorAll(
            ".tab-pane-item"
        );

    buttons.forEach(
        (button) => {
            button.addEventListener(
                "click",
                () => {
                    const tabName =
                        button.dataset.tab;

                    if (
                        tabName ===
                        "notifications"
                    ) {
                        if (
                            window.ChatBadges
                                ?.markNotificationsAsRead
                        ) {
                            window.ChatBadges.markNotificationsAsRead();
                        }
                    }

                    if (!tabName) {
                        return;
                    }

                    buttons.forEach(
                        (btn) => {
                            btn.classList.remove(
                                "active"
                            );
                        }
                    );

                    button.classList.add(
                        "active"
                    );

                    panes.forEach(
                        (pane) => {
                            pane.classList.add(
                                "d-none"
                            );
                        }
                    );

                    const selectedPane =
                        document.getElementById(
                            `tab-${tabName}`
                        );

                    if (
                        selectedPane
                    ) {
                        selectedPane.classList.remove(
                            "d-none"
                        );
                    }

                    console.log(
                        "Aba aberta:",
                        tabName
                    );
                }
            );
        }
    );
}

async function loadFriends() {
    try {
        const response =
            await fetch(
                "/api/friends"
            );

        if (!response.ok) {
            return;
        }

        const friends =
            await response.json();

        const list =
            document.getElementById(
                "friendsList"
            );

        if (!list) {
            return;
        }

        list.innerHTML = "";

        friends.forEach(
            (friend) => {
                const item =
                    document.createElement(
                        "button"
                    );

                item.type = "button";

                item.className =
                    "list-group-item list-group-item-action d-flex align-items-center gap-2";

                item.dataset.friendId =
                    friend.userId;

                item.innerHTML = `
                    <span
                        class="presence-dot rounded-circle ${friend.isOnline
                        ? "bg-success"
                        : "bg-secondary"
                    }"
                        data-online="${friend.isOnline
                        ? "true"
                        : "false"
                    }"
                        style="width:8px;height:8px;">
                    </span>

                    <img
                        src="${friend.profilePhotoUrl ||
                    "/images/default-avatar.png"
                    }"
                        class="avatar-sm"
                        alt="Avatar"
                        onerror="this.onerror=null;this.src='/images/default-avatar.png';"
                    />

                    <span>
                        ${escapeHtml(
                        friend.fullName
                    )}
                    </span>
                `;

                item.addEventListener(
                    "click",
                    () => {
                        openChat(friend);
                    }
                );

                list.appendChild(item);
            }
        );
    } catch (error) {
        console.error(
            "Erro ao carregar amigos:",
            error
        );
    }
}

async function loadFriendRequests() {
    try {
        const response =
            await fetch(
                "/api/friends/requests"
            );

        if (!response.ok) {
            return;
        }

        const requests =
            await response.json();

        const container =
            document.getElementById(
                "friendRequests"
            );

        if (!container) {
            return;
        }

        container.innerHTML = "";

        requests.forEach(
            (request) => {
                const div =
                    document.createElement(
                        "div"
                    );

                div.className =
                    "d-flex align-items-center justify-content-between border rounded p-2 mb-2";

                div.innerHTML = `
                    <span>
                        ${escapeHtml(
                    request.fullName
                )}
                    </span>

                    <span class="d-flex gap-1">

                        <button
                            type="button"
                            class="btn btn-sm btn-success">
                            ✓
                        </button>

                        <button
                            type="button"
                            class="btn btn-sm btn-danger">
                            ✕
                        </button>

                    </span>
                `;

                div.querySelector(
                    ".btn-success"
                ).addEventListener(
                    "click",
                    async () => {
                        await fetch(
                            `/api/friends/${request.friendshipId}/accept`,
                            {
                                method: "POST"
                            }
                        );

                        await loadFriendRequests();

                        await loadFriends();

                        if (
                            window.ChatBadges
                        ) {
                            window.ChatBadges.notifications();
                        }
                    }
                );

                div.querySelector(
                    ".btn-danger"
                ).addEventListener(
                    "click",
                    async () => {
                        await fetch(
                            `/api/friends/${request.friendshipId}/reject`,
                            {
                                method: "POST"
                            }
                        );

                        await loadFriendRequests();

                        if (
                            window.ChatBadges
                        ) {
                            window.ChatBadges.notifications();
                        }
                    }
                );

                container.appendChild(
                    div
                );
            }
        );
    } catch (error) {
        console.error(
            "Erro ao carregar pedidos:",
            error
        );
    }
}

function setupFriendSearch() {
    const searchBtn =
        document.getElementById(
            "searchBtn"
        );

    if (!searchBtn) {
        return;
    }

    searchBtn.addEventListener(
        "click",
        async () => {
            const input =
                document.getElementById(
                    "searchInput"
                );

            const q =
                input?.value.trim();

            if (!q) {
                return;
            }

            try {
                const response =
                    await fetch(
                        `/api/friends/search?q=${encodeURIComponent(q)}`
                    );

                if (!response.ok) {
                    return;
                }

                const users =
                    await response.json();

                const container =
                    document.getElementById(
                        "searchResults"
                    );

                if (!container) {
                    return;
                }

                container.innerHTML = "";

                users.forEach(
                    (user) => {
                        const div =
                            document.createElement(
                                "div"
                            );

                        div.className =
                            "d-flex align-items-center justify-content-between border rounded p-2 mb-2";

                        div.innerHTML = `
                            <div class="d-flex align-items-center gap-2">

                                <img
                                    src="${user.profilePhotoUrl ||
                            "/images/default-avatar.png"
                            }"
                                    class="avatar-sm"
                                    alt="Avatar"
                                    onerror="this.onerror=null;this.src='/images/default-avatar.png';"
                                />

                                <span>
                                    ${escapeHtml(
                                user.fullName
                            )}
                                </span>

                            </div>

                            <button
                                type="button"
                                class="btn btn-sm btn-primary">
                                Adicionar
                            </button>
                        `;

                        div.querySelector(
                            "button"
                        ).addEventListener(
                            "click",
                            async () => {
                                await fetch(
                                    "/api/friends/request",
                                    {
                                        method: "POST",
                                        headers: {
                                            "Content-Type":
                                                "application/json"
                                        },
                                        body: JSON.stringify(
                                            {
                                                addresseeId:
                                                    user.id
                                            }
                                        )
                                    }
                                );

                                const button =
                                    div.querySelector(
                                        "button"
                                    );

                                button.innerText =
                                    "Pedido enviado";

                                button.disabled =
                                    true;
                            }
                        );

                        container.appendChild(
                            div
                        );
                    }
                );
            } catch (error) {
                console.error(
                    "Erro ao pesquisar utilizadores:",
                    error
                );
            }
        }
    );
}

async function loadNotifications() {
    try {
        const response =
            await fetch(
                "/api/notifications"
            );

        if (!response.ok) {
            return;
        }

        const notifications =
            await response.json();

        const list =
            document.getElementById(
                "notificationsList"
            );

        if (!list) {
            return;
        }

        list.innerHTML = "";

        notifications.forEach(
            (notification) => {
                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    `list-group-item ${notification.isRead
                        ? ""
                        : "fw-bold"
                    }`;

                item.innerHTML = `
                    <div>
                        ${escapeHtml(
                    notification.title ||
                    ""
                )}
                    </div>

                    <small class="text-muted">
                        ${escapeHtml(
                    notification.content ||
                    ""
                )}
                    </small>
                `;

                list.appendChild(
                    item
                );
            }
        );

        if (
            window.ChatBadges
        ) {
            window.ChatBadges.notifications();
        }
    } catch (error) {
        console.error(
            "Erro ao carregar notificações:",
            error
        );
    }
}

async function loadMeetings() {
    try {
        const response =
            await fetch(
                "/api/meetings/upcoming"
            );

        if (!response.ok) {
            return;
        }

        const meetings =
            await response.json();

        const list =
            document.getElementById(
                "meetingsList"
            );

        if (!list) {
            return;
        }

        list.innerHTML = "";

        meetings.forEach(
            (meeting) => {
                const item =
                    document.createElement(
                        "a"
                    );

                item.href =
                    `/Home/Meeting?roomCode=${encodeURIComponent(
                        meeting.roomCode
                    )}`;

                item.className =
                    "list-group-item list-group-item-action";

                item.innerHTML = `
                    <strong>
                        ${escapeHtml(
                    meeting.title
                )}
                    </strong>

                    <br />

                    <small>
                        Código:
                        ${escapeHtml(
                    meeting.roomCode
                )}
                    </small>
                `;

                list.appendChild(
                    item
                );
            }
        );

        if (
            window.ChatBadges
        ) {
            window.ChatBadges.meetings();
        }
    } catch (error) {
        console.error(
            "Erro ao carregar reuniões:",
            error
        );
    }
}

function setupMeetingCreation() {
    const button =
        document.getElementById(
            "btnCreateMeeting"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        async () => {
            try {
                const title =
                    document
                        .getElementById(
                            "meetingTitle"
                        )
                        ?.value.trim() ||
                    "Reunião sem título";

                const start =
                    document.getElementById(
                        "meetingStart"
                    )?.value;

                const response =
                    await fetch(
                        "/api/meetings",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify(
                                {
                                    title,
                                    scheduledStart:
                                        start ||
                                        null,
                                    inviteUserIds:
                                        []
                                }
                            )
                        }
                    );

                if (!response.ok) {
                    console.error(
                        "Erro ao criar reunião:",
                        response.status
                    );

                    return;
                }

                const meeting =
                    await response.json();

                window.location.href =
                    `/Home/Meeting?roomCode=${encodeURIComponent(
                        meeting.roomCode
                    )}`;
            } catch (error) {
                console.error(
                    "Erro ao criar reunião:",
                    error
                );
            }
        }
    );
}

function openChat(friend) {
    currentFriendId =
        friend.userId;

    const empty =
        document.getElementById(
            "chatEmpty"
        );

    const windowChat =
        document.getElementById(
            "chatWindow"
        );

    if (empty) {
        empty.classList.add(
            "d-none"
        );
    }

    if (windowChat) {
        windowChat.classList.remove(
            "d-none"
        );
    }

    const name =
        document.getElementById(
            "chatFriendName"
        );

    if (name) {
        name.innerText =
            friend.fullName;
    }

    const photo =
        document.getElementById(
            "chatFriendPhoto"
        );

    if (photo) {
        photo.src =
            friend.profilePhotoUrl ||
            "/images/default-avatar.png";
    }

    const status =
        document.getElementById(
            "chatFriendStatus"
        );

    if (status) {
        status.textContent =
            friend.isOnline
                ? "online"
                : "offline";

        status.classList.toggle(
            "text-success",
            Boolean(friend.isOnline)
        );

        status.classList.toggle(
            "text-secondary",
            !friend.isOnline
        );
    }

    const shell =
        document.querySelector(
            ".app-shell"
        );

    if (shell) {
        shell.classList.add(
            "chat-open"
        );
    }

    loadConversation(
        friend.userId
    );

    if (
        window.ChatBadges
    ) {
        window.ChatBadges.markMessagesAsRead();
    }
}

function setupBackButton() {
    const button =
        document.getElementById(
            "btnBackToList"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        () => {
            const shell =
                document.querySelector(
                    ".app-shell"
                );

            if (shell) {
                shell.classList.remove(
                    "chat-open"
                );
            }

            currentFriendId =
                null;
        }
    );
}

async function loadConversation(
    friendId
) {
    try {
        const response =
            await fetch(
                `/api/messages/conversation/${friendId}`
            );

        if (!response.ok) {
            return;
        }

        const messages =
            await response.json();

        const container =
            document.getElementById(
                "messagesContainer"
            );

        if (!container) {
            return;
        }

        container.innerHTML = "";

        messages.forEach(
            renderMessage
        );

        scrollMessagesToBottom();
    } catch (error) {
        console.error(
            "Erro ao carregar conversa:",
            error
        );
    }
}

function renderMessage(msg) {
    const container =
        document.getElementById(
            "messagesContainer"
        );

    if (!container) {
        return;
    }

    const mine =
        msg.senderId !==
        currentFriendId;

    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        `msg-bubble ${mine
            ? "mine"
            : "theirs"
        }`;

    // Guardamos o valor original para poder reformatar
    // imediatamente quando o utilizador mudar TimeZone/TimeFormat.
    bubble.dataset.sentAt = msg.sentAt || "";

    let contentHtml = "";

    if (msg.type === 0) {
        contentHtml =
            `<div>${escapeHtml(
                msg.content ?? ""
            )}</div>`;
    } else if (
        msg.type === 1
    ) {
        contentHtml =
            `<audio controls src="${msg.attachmentUrl}"></audio>`;
    } else if (
        msg.type === 2
    ) {
        contentHtml =
            `<img src="${msg.attachmentUrl}" style="max-width:220px; border-radius:8px;" alt="Imagem enviada"/>`;
    } else {
        contentHtml =
            `<a href="${msg.attachmentUrl}" target="_blank" rel="noopener noreferrer">
                📎 ${escapeHtml(
                msg.attachmentName ||
                "Ficheiro"
            )}
            </a>`;
    }

    bubble.innerHTML =
        contentHtml +
        `
            <div class="msg-meta">
                ${window.ChatPreferences?.formatTime
            ? window.ChatPreferences.formatTime(msg.sentAt)
            : new Date(msg.sentAt).toLocaleTimeString()}
            </div>
        `;

    container.appendChild(
        bubble
    );
}

window.addEventListener("chatapp:preferences-changed", () => {
    const container = document.getElementById("messagesContainer");

    if (!container || !window.ChatPreferences?.formatTime) {
        return;
    }

    container.querySelectorAll(".msg-bubble[data-sent-at]").forEach((bubble) => {
        const meta = bubble.querySelector(".msg-meta");

        if (!meta) {
            return;
        }

        meta.textContent = window.ChatPreferences.formatTime(
            bubble.dataset.sentAt,
        );
    });
});

function scrollMessagesToBottom() {
    const container =
        document.getElementById(
            "messagesContainer"
        );

    if (!container) {
        return;
    }

    container.scrollTop =
        container.scrollHeight;
}

function escapeHtml(str) {
    const div =
        document.createElement(
            "div"
        );

    div.innerText =
        String(str);

    return div.innerHTML;
}

function setupMessageSending() {
    const sendButton =
        document.getElementById(
            "btnSend"
        );

    const input =
        document.getElementById(
            "messageInput"
        );

    if (sendButton) {
        sendButton.addEventListener(
            "click",
            sendTextMessage
        );
    }

    if (input) {
        input.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.key ===
                    "Enter" &&
                    !event.shiftKey
                ) {
                    event.preventDefault();

                    sendTextMessage();

                    return;
                }

                const connection =
                    getChatConnection();

                if (
                    currentFriendId &&
                    connection &&
                    connection.state ===
                    signalR.HubConnectionState.Connected
                ) {
                    connection
                        .invoke(
                            "Typing",
                            currentFriendId,
                            true
                        )
                        .catch(
                            () => { }
                        );
                }
            }
        );
    }
}

async function sendTextMessage() {
    const input =
        document.getElementById(
            "messageInput"
        );

    if (!input) {
        return;
    }

    const content =
        input.value.trim();

    if (
        !content ||
        !currentFriendId
    ) {
        return;
    }

    try {
        const response =
            await fetch(
                "/api/messages/text",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify(
                        {
                            receiverId:
                                currentFriendId,
                            content,
                            type: 0
                        }
                    )
                }
            );

        if (!response.ok) {
            console.error(
                "Erro ao enviar mensagem:",
                response.status
            );

            return;
        }

        input.value = "";
    } catch (error) {
        console.error(
            "Erro ao enviar mensagem:",
            error
        );
    }
}

function setupFileSending() {
    const input =
        document.getElementById(
            "fileInput"
        );

    if (!input) {
        return;
    }

    input.addEventListener(
        "change",
        async (event) => {
            const file =
                event.target.files[0];

            if (
                !file ||
                !currentFriendId
            ) {
                return;
            }

            try {
                const isImage =
                    file.type.startsWith(
                        "image/"
                    );

                const formData =
                    new FormData();

                formData.append(
                    "receiverId",
                    currentFriendId
                );

                formData.append(
                    "type",
                    isImage ? 2 : 3
                );

                formData.append(
                    "file",
                    file
                );

                const response =
                    await fetch(
                        "/api/messages/attachment",
                        {
                            method: "POST",
                            body: formData
                        }
                    );

                if (!response.ok) {
                    console.error(
                        "Erro ao enviar ficheiro:",
                        response.status
                    );
                }
            } catch (error) {
                console.error(
                    "Erro ao enviar ficheiro:",
                    error
                );
            } finally {
                input.value = "";
            }
        }
    );
}

function setupAudioRecorder() {
    const button =
        document.getElementById(
            "btnRecordAudio"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        async () => {
            if (
                mediaRecorder &&
                mediaRecorder.state ===
                "recording"
            ) {
                mediaRecorder.stop();

                button.classList.remove(
                    "btn-danger"
                );

                return;
            }

            if (
                !currentFriendId
            ) {
                return;
            }

            try {
                const stream =
                    await navigator.mediaDevices.getUserMedia(
                        {
                            audio: true
                        }
                    );

                mediaRecorder =
                    new MediaRecorder(
                        stream
                    );

                audioChunks = [];

                mediaRecorder.ondataavailable =
                    (event) => {
                        if (
                            event.data &&
                            event.data.size >
                            0
                        ) {
                            audioChunks.push(
                                event.data
                            );
                        }
                    };

                mediaRecorder.onstop =
                    async () => {
                        stream
                            .getTracks()
                            .forEach(
                                (track) =>
                                    track.stop()
                            );

                        const blob =
                            new Blob(
                                audioChunks,
                                {
                                    type: "audio/webm"
                                }
                            );

                        const formData =
                            new FormData();

                        formData.append(
                            "receiverId",
                            currentFriendId
                        );

                        formData.append(
                            "type",
                            1
                        );

                        formData.append(
                            "file",
                            blob,
                            "audio.webm"
                        );

                        try {
                            const response =
                                await fetch(
                                    "/api/messages/attachment",
                                    {
                                        method: "POST",
                                        body: formData
                                    }
                                );

                            if (
                                !response.ok
                            ) {
                                console.error(
                                    "Falha ao enviar áudio:",
                                    response.status
                                );
                            }
                        } catch (
                        error
                        ) {
                            console.error(
                                "Erro de rede ao enviar áudio:",
                                error
                            );
                        }
                    };

                mediaRecorder.start();

                button.classList.add(
                    "btn-danger"
                );
            } catch (error) {
                console.error(
                    "Não foi possível aceder ao microfone:",
                    error
                );

                alert(
                    `Não foi possível aceder ao microfone.\nErro: ${error.name} - ${error.message}`
                );
            }
        }
    );
}

async function loadMyProfile() {
    try {
        const response =
            await fetch(
                "/api/profile/me",
                {
                    method: "GET",
                    headers: {
                        Accept:
                            "application/json"
                    },
                    credentials:
                        "same-origin"
                }
            );

        if (!response.ok) {
            console.error(
                "Não foi possível carregar o perfil:",
                response.status
            );

            return;
        }

        const user =
            await response.json();

        const photo =
            document.getElementById(
                "profilePhotoUrl"
            );

        const name =
            document.getElementById(
                "myName"
            );

        if (photo) {
            photo.src =
                user.profilePhotoUrl ||
                "/images/default-avatar.png";
        }

        if (name) {
            name.textContent =
                user.fullName ||
                "Eu";
        }
    } catch (error) {
        console.error(
            "Erro ao carregar perfil:",
            error
        );
    }
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        initializeChatConnection();

        setupSidebarTabs();

        setupFriendSearch();

        setupMeetingCreation();

        setupBackButton();

        setupMessageSending();

        setupFileSending();

        setupAudioRecorder();

        loadFriends();

        loadFriendRequests();

        loadNotifications();

        loadMeetings();

        loadMyProfile();
    }
);