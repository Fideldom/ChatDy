"use strict";

(function () {
    function escapeSelectorValue(value) {
        const stringValue = String(value);

        if (
            typeof CSS !== "undefined" &&
            typeof CSS.escape === "function"
        ) {
            return CSS.escape(stringValue);
        }

        return stringValue.replace(
            /["\\]/g,
            "\\$&"
        );
    }

    function updateFriendElements(
        userId,
        isOnline
    ) {
        if (!userId) {
            return;
        }

        const escapedId =
            escapeSelectorValue(userId);

        const elements =
            document.querySelectorAll(
                `[data - friend - id= "${escapedId}"] .presence - dot`
            );

        elements.forEach((element) => {
            const online =
                Boolean(isOnline);

            element.classList.toggle(
                "bg-success",
                online
            );

            element.classList.toggle(
                "bg-secondary",
                !online
            );

            element.dataset.online =
                online
                    ? "true"
                    : "false";
        });

        updateCurrentChatStatus(
            userId,
            Boolean(isOnline)
        );
    }

    function updateCurrentChatStatus(
        userId,
        isOnline
    ) {
        const getCurrentFriendId =
            window.getCurrentFriendId;

        if (
            typeof getCurrentFriendId !==
            "function"
        ) {
            return;
        }

        const currentFriendId =
            getCurrentFriendId();

        if (
            !currentFriendId ||
            String(currentFriendId) !==
                String(userId)
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

        status.textContent =
            isOnline
                ? "online"
                : "offline";

        status.classList.toggle(
            "text-success",
            isOnline
        );

        status.classList.toggle(
            "text-secondary",
            !isOnline
        );
    }

    function update(
        userId,
        isOnline
    ) {
        updateFriendElements(
            userId,
            isOnline
        );
    }

    function applyFriendsPresence(
        friends
    ) {
        if (!Array.isArray(friends)) {
            return;
        }

        friends.forEach((friend) => {
            if (!friend?.userId) {
                return;
            }

            update(
                friend.userId,
                Boolean(friend.isOnline)
            );
        });
    }

    async function refresh() {
        try {
            const response =
                await fetch(
                    "/api/friends",
                    {
                        method: "GET",
                        credentials: "same-origin",
                        cache: "no-store"
                    }
                );

            if (!response.ok) {
                return;
            }

            const friends =
                await response.json();

            applyFriendsPresence(
                friends
            );
        } catch (error) {
            console.error(
                "[Presence] Erro ao atualizar presença:",
                error
            );
        }
    }

    function getConnection() {
        if (
            window.ChatConnection
        ) {
            return window.ChatConnection;
        }

        return null;
    }

    function isConnected() {
        const connection =
            getConnection();

        if (
            !connection ||
            typeof signalR ===
                "undefined"
        ) {
            return false;
        }

        return (
            connection.state ===
            signalR.HubConnectionState.Connected
        );
    }

    function register(
        connection
    ) {
        if (!connection) {
            return;
        }

        // Evita duplicação caso este método seja chamado
        // novamente.
        connection.off(
            "FriendPresenceChanged"
        );

        connection.on(
            "FriendPresenceChanged",
            (
                userId,
                isOnline
            ) => {
                console.log(
                    "[Presence]",
                    userId,
                    isOnline
                        ? "online"
                        : "offline"
                );

                update(
                    userId,
                    isOnline
                );
            }
        );
    }

    window.ChatPresence = {
        update,
        refresh,
        register,
        isConnected,
        getConnection
    };
})();
