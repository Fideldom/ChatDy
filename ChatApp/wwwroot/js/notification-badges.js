"use strict";

const BADGES_API = "/api/Notifications";

// ATUALIZAR BADGE
function updateBadge(elementId, count) {
  const badge = document.getElementById(elementId);

  if (!badge) {
    console.warn(`ChatBadges: elemento #${elementId} não encontrado.`);

    return;
  }

  const value = Number(count) || 0;

  if (value <= 0) {
    badge.textContent = "0";

    badge.classList.add("d-none");

    return;
  }

  badge.textContent = value > 99 ? "99+" : value.toString();

  badge.classList.remove("d-none");
}

// BUSCAR CONTADOR
async function fetchBadgeCount(endpoint, badgeId) {
  try {
    const url = `${BADGES_API}/${endpoint}`;

    console.log("ChatBadges:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "same-origin",
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();

      console.error(`ChatBadges: erro em ${url}`, response.status, text);

      return;
    }

    const data = await response.json();

    console.log(`ChatBadges: ${endpoint} =`, data.count);

    updateBadge(badgeId, data.count);
  } catch (error) {
    console.error(`ChatBadges: erro ao carregar ${endpoint}:`, error);
  }
}

// NOTIFICAÇÕES
async function loadNotificationBadge() {
  await fetchBadgeCount("count", "notifBadge");
}

// MENSAGENS
async function loadMessageBadge() {
  await fetchBadgeCount("messages-count", "messageBadge");
}

// REUNIÕES
async function loadMeetingBadge() {
  await fetchBadgeCount("meetings-count", "meetingBadge");
}

// TODOS
async function loadAllBadges() {
  await Promise.allSettled([
    loadNotificationBadge(),
    loadMessageBadge(),
    loadMeetingBadge(),
  ]);
}

// POLLING
let badgePollingInterval = null;

function startBadgePolling() {
  if (badgePollingInterval !== null) {
    return;
  }

  badgePollingInterval = setInterval(loadAllBadges, 10000);
}

// MARCAR MENSAGENS COMO LIDAS
async function markMessagesAsRead() {
  try {
    const response = await fetch(`${BADGES_API}/messages/read`, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      credentials: "same-origin",
    });

    if (!response.ok) {
      console.error("Erro ao marcar mensagens:", response.status);

      return;
    }

    updateBadge("messageBadge", 0);
  } catch (error) {
    console.error("Erro ao marcar mensagens:", error);
  }
}

// MARCAR REUNIÕES COMO LIDAS
async function markMeetingsAsRead() {
  try {
    const response = await fetch(`${BADGES_API}/meetings/read`, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      credentials: "same-origin",
    });

    if (!response.ok) {
      console.error("Erro ao marcar reuniões:", response.status);

      return;
    }

    updateBadge("meetingBadge", 0);
  } catch (error) {
    console.error("Erro ao marcar reuniões:", error);
  }
}

// CLICAR EM MENSAGENS
document.addEventListener("click", (event) => {
  const button = event.target.closest(
    '#sidebarTabs .nav-link[data-tab="friends"]',
  );

  if (!button) {
    return;
  }

  markMessagesAsRead();
});

// CLICAR EM REUNIÕES
document.addEventListener("click", (event) => {
  const button = event.target.closest(
    '#sidebarTabs .nav-link[data-tab="meetings"]',
  );

  if (!button) {
    return;
  }

  markMeetingsAsRead();
});

// INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", () => {
  console.log("ChatApp: iniciando ChatBadges...");

  loadAllBadges();

  startBadgePolling();
});

// ============================================================
async function markConversationMessagesAsRead(friendId) {
  if (!friendId) {
    return;
  }

  try {
    const response = await fetch(
      `${BADGES_API}/messages/${encodeURIComponent(friendId)}/read`,
      {
        method: "POST",

        headers: {
          Accept: "application/json",
        },

        credentials: "same-origin",
      },
    );

    if (!response.ok) {
      console.error("Erro ao marcar conversa como lida:", response.status);

      return;
    }

    // Atualizar contador depois de marcar
    await loadMessageBadge();
  } catch (error) {
    console.error("Erro ao marcar mensagens da conversa:", error);
  }
}

async function markNotificationsAsRead() {
  try {
    const response = await fetch(`${BADGES_API}/read-all`, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      credentials: "same-origin",
    });

    if (!response.ok) {
      console.error("Erro ao marcar notificações como lidas:", response.status);
      return;
    }

    updateBadge("notifBadge", 0);
  } catch (error) {
    console.error("Erro ao marcar notificações como lidas:", error);
  }
}

// API GLOBAL click
window.ChatBadges = {
  reload: loadAllBadges,

  notifications: loadNotificationBadge,

  messages: loadMessageBadge,

  meetings: loadMeetingBadge,

  markMessagesAsRead,

  markMeetingsAsRead,

  update: updateBadge,

  stopPolling: stopBadgePolling,
};
